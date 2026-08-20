import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import shutil

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        tmp_db_path = "/tmp/auction.db"
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        source_db = os.path.join(base_dir, "auction.db")
        if not os.path.exists(tmp_db_path) and os.path.exists(source_db):
            try:
                shutil.copyfile(source_db, tmp_db_path)
            except Exception as e:
                print(f"Error copying DB to tmp: {e}")
        DATABASE_URL = f"sqlite:///{tmp_db_path}"
    else:
        DATABASE_URL = "sqlite:///./auction.db"

# Railway gives postgres:// but SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
