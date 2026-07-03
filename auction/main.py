from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .models import models, database
from .routers import auth, players, teams, auction
import os

from sqlalchemy import text
# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

try:
    with database.engine.connect() as conn:
        conn.execute(text("ALTER TABLE players ADD COLUMN original_base_price FLOAT;"))
        conn.execute(text("UPDATE players SET original_base_price = base_price WHERE original_base_price IS NULL;"))
        conn.commit()
except Exception:
    pass

def auto_seed():
    """Auto-create admin + teams if DB is empty (first deploy)."""
    db = database.SessionLocal()
    try:
        existing = db.query(models.User).first()
        if existing:
            return  # Already seeded, skip

        from passlib.context import CryptContext
        pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Create 8 teams
        team_names = [
            ("Sargodha Thunders",    "Owner 1"),
            ("Jauharabad Buber Sher","Owner 2"),
            ("Khushab Punjabians",   "Owner 3"),
            ("Sialkot Janbaz",       "Owner 4"),
            ("Bhakkar Wolves",       "Owner 5"),
            ("Faisalabad Stallions", "Owner 6"),
            ("Mianwali Royals",      "Owner 7"),
            ("Naushera Gladiators",  "Owner 8"),
        ]
        for name, owner in team_names:
            db.add(models.Team(name=name, owner_name=owner, total_budget=110000))
        db.commit()

        # Create admin user
        admin = models.User(
            username="admin",
            password_hash=pwd.hash("admin"),
            role="admin"
        )
        db.add(admin)
        db.commit()
        print("✅ Auto-seed complete: admin user and 8 teams created.")
    except Exception as e:
        print(f"⚠️ Auto-seed failed: {e}")
    finally:
        db.close()

auto_seed()


app = FastAPI(title="PCL Auction Real-time")

# CORS — allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(players.router)
app.include_router(teams.router)
app.include_router(auction.router)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve built frontend (only in local/Railway mode, not needed on Vercel)
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import FileResponse

class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except (StarletteHTTPException, FileNotFoundError):
            index_path = os.path.join(self.directory, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            raise

frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", SPAStaticFiles(directory=frontend_dir, html=True), name="frontend")
