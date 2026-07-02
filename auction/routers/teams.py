from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from ..models import models, schemas, database
from .auth import get_current_active_user, require_role

router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("", response_model=List[schemas.Team])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    teams = db.query(models.Team).offset(skip).limit(limit).all()
    # Pydantic will use the properties like remaining_budget automatically
    return teams

@router.post("", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    db_team = models.Team(**team.dict())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@router.get("/{team_id}", response_model=schemas.Team)
def read_team(team_id: int, db: Session = Depends(database.get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.get("/{team_id}/squad", response_model=List[schemas.Player])
def read_team_squad(team_id: int, db: Session = Depends(database.get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    players = db.query(models.Player).filter(models.Player.sold_to_team_id == team_id).all()
    for p in players:
        p.team_name = team.name
    return players

class CaptainAssignRequest(BaseModel):
    captain_name: Optional[str] = None

@router.post("/{team_id}/captain", response_model=schemas.Team)
def assign_captain(team_id: int, req: CaptainAssignRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    team.captain_name = req.captain_name if req.captain_name else None
    db.commit()
    db.refresh(team)
    return team


class BudgetUpdateRequest(BaseModel):
    total_budget: float

@router.put("/{team_id}/budget", response_model=schemas.Team)
def update_team_budget(
    team_id: int,
    req: BudgetUpdateRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin"]))
):
    """Admin sets the starting budget for a team before auction begins."""
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    if req.total_budget < 0:
        raise HTTPException(status_code=400, detail="Budget cannot be negative")
    team.total_budget = req.total_budget
    db.commit()
    db.refresh(team)
    return team
