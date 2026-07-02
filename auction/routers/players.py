import io
import os
import shutil
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..models import models, schemas, database
from .auth import require_role

router = APIRouter(prefix="/players", tags=["players"])

@router.get("", response_model=List[schemas.Player])
def read_players(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    players = db.query(models.Player).offset(skip).limit(limit).all()
    for p in players:
        p.team_name = p.team.name if p.team else None
    return players

@router.post("", response_model=schemas.Player)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    db_player = models.Player(**player.dict())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.put("/{player_id}", response_model=schemas.Player)
def update_player(player_id: int, player_data: schemas.PlayerCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    for key, value in player_data.dict().items():
        setattr(player, key, value)
        
    db.commit()
    db.refresh(player)
    player.team_name = player.team.name if player.team else None
    return player

@router.delete("/all")
def delete_all_players(db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    # Delete all bids first to avoid foreign key constraint errors
    db.query(models.Bid).delete()
    # Delete all players
    deleted_count = db.query(models.Player).delete()
    
    db.commit()
    return {"message": f"Successfully deleted all {deleted_count} players. Team budgets are automatically reset."}

@router.delete("/{player_id}")
def delete_player(player_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    # Delete associated bids
    db.query(models.Bid).filter(models.Bid.player_id == player_id).delete()
    
    db.delete(player)
    db.commit()
    return {"message": "Player deleted successfully"}

@router.post("/upload")
def upload_players_csv(file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")
    
    try:
        content = file.file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")
    
    # Required columns: name, role, nationality, base_price
    required_cols = ['name', 'role', 'nationality', 'base_price']
    for col in required_cols:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Required column '{col}' is missing in the CSV.")
            
    players_added = 0
    for _, row in df.iterrows():
        name = str(row['name']).strip()
        if not name or name.lower() == 'nan':
            continue
            
        role = str(row['role']).strip()
        nationality = str(row['nationality']).strip()
        
        try:
            base_price = float(row['base_price'])
        except Exception:
            base_price = 0.0
            
        age = None
        if 'age' in df.columns and not pd.isna(row['age']):
            try:
                age = int(row['age'])
            except Exception:
                pass
                
        stats = None
        if 'stats' in df.columns and not pd.isna(row['stats']):
            stats = str(row['stats']).strip()
            if stats.lower() == 'nan':
                stats = None
                
        photo_url = None
        if 'photo_url' in df.columns and not pd.isna(row['photo_url']):
            photo_url = str(row['photo_url']).strip()
            if photo_url.lower() == 'nan':
                photo_url = None

        db_player = models.Player(
            name=name,
            role=role,
            nationality=nationality,
            base_price=base_price,
            age=age,
            stats=stats,
            photo_url=photo_url,
            status="available"
        )
        db.add(db_player)
        players_added += 1
        
    db.commit()
    return {"message": f"Successfully uploaded {players_added} players."}

@router.post("/{player_id}/photo")
def upload_player_photo(player_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    os.makedirs("uploads", exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    if ext.lower() not in ['.jpg', '.jpeg', '.png', '.webp']:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, PNG, and WEBP formats are supported.")
        
    file_path = f"uploads/player_{player_id}{ext}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    player.photo_url = f"http://127.0.0.1:8000/{file_path}"
    db.commit()
    db.refresh(player)
    return {"photo_url": player.photo_url}
