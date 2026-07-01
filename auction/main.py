from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .models import models, database
from .routers import auth, players, teams, auction
import os

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="PCL Auction Real-time")

# CORS — allow all origins (frontend is on Vercel)
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
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
