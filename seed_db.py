"""
Standalone seed script — run from /app directory on Railway:
    python seed_db.py
"""
import os
import sys
sys.path.insert(0, '/app')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# DB setup
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./auction.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

# Import models
from auction.models.models import Base, Team, User, Player
from auction.models.database import Base as DecBase

# Create all tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Password hash
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_pw(pw): return pwd_context.hash(pw)

# Teams
teams = [
    Team(name="Sargodha Thunders",    owner_name="Owner 1", total_budget=110000),
    Team(name="Jauharabad Buber Sher", owner_name="Owner 2", total_budget=110000),
    Team(name="Khushab Punjabians",   owner_name="Owner 3", total_budget=110000),
    Team(name="Sialkot Janbaz",       owner_name="Owner 4", total_budget=110000),
    Team(name="Bhakkar Wolves",       owner_name="Owner 5", total_budget=110000),
    Team(name="Faisalabad Stallions", owner_name="Owner 6", total_budget=110000),
    Team(name="Mianwali Royals",      owner_name="Owner 7", total_budget=110000),
    Team(name="Naushera Gladiators",  owner_name="Owner 8", total_budget=110000),
]
for t in teams:
    db.add(t)
db.commit()

t1 = db.query(Team).filter(Team.name == "Sargodha Thunders").first()

# Users
users = [
    User(username="admin",  password_hash=hash_pw("admin"),  role="admin"),
    User(username="owner1", password_hash=hash_pw("owner"),  role="owner", team_id=t1.id),
    User(username="viewer", password_hash=hash_pw("viewer"), role="viewer"),
]
for u in users:
    db.add(u)
db.commit()

# Players
players = [
    Player(name="Player 1",  role="Batsman",      base_price=1000, nationality="Local"),
    Player(name="Player 2",  role="Bowler",       base_price=1000, nationality="Local"),
    Player(name="Player 3",  role="All-Rounder",  base_price=1000, nationality="Local"),
    Player(name="Player 4",  role="Wicket-Keeper",base_price=1000, nationality="Local"),
    Player(name="Player 5",  role="Batsman",      base_price=1000, nationality="Local"),
    Player(name="Player 6",  role="Bowler",       base_price=1000, nationality="Local"),
    Player(name="Player 7",  role="All-Rounder",  base_price=1000, nationality="Local"),
    Player(name="Player 8",  role="Batsman",      base_price=1000, nationality="Local"),
]
for i in range(1, 43):
    players.append(Player(name=f"Mock Player {i}", role="All-Rounder", base_price=1000, nationality="Local"))

for p in players:
    db.add(p)
db.commit()
db.close()

print("✅ Database seeded successfully!")
print("   Admin login -> username: admin | password: admin")
