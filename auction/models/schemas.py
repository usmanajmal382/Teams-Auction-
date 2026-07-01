from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str
    team_id: Optional[int] = None

class User(UserBase):
    id: int
    role: str
    team_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    team_id: Optional[int] = None

class TeamBase(BaseModel):
    name: str
    owner_name: str
    total_budget: float
    captain_name: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int
    spent_budget: float
    remaining_budget: float

    class Config:
        from_attributes = True

class PlayerBase(BaseModel):
    name: str
    role: str
    base_price: float
    nationality: Optional[str] = None
    previous_team_id: Optional[int] = None
    age: Optional[int] = None
    stats: Optional[str] = None
    photo_url: Optional[str] = None

class PlayerCreate(PlayerBase):
    pass

class Player(PlayerBase):
    id: int
    status: str
    sold_to_team_id: Optional[int] = None
    final_price: Optional[float] = None
    team_name: Optional[str] = None
    sold_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BidBase(BaseModel):
    player_id: int
    team_id: int
    amount: float

class BidCreate(BidBase):
    pass

class Bid(BidBase):
    id: int
    timestamp: datetime
    is_winning: bool
    auction_session_id: Optional[str] = None

    class Config:
        from_attributes = True
