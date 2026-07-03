from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # admin, owner, viewer
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    full_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="owner_user")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    owner_name = Column(String)
    total_budget = Column(Float, default=110000.0) # Fixed ₹1,10,000
    captain_name = Column(String, nullable=True)

    owner_user = relationship("User", back_populates="team", uselist=False)
    players = relationship("Player", back_populates="team", foreign_keys="Player.sold_to_team_id")
    bids = relationship("Bid", back_populates="team")
    
    @property
    def spent_budget(self):
        return sum(p.final_price for p in self.players if p.final_price is not None)

    @spent_budget.setter
    def spent_budget(self, value):
        pass

    @property
    def remaining_budget(self):
        return self.total_budget - self.spent_budget

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String) # Batsman, Bowler, All-Rounder, Wicket-Keeper
    base_price = Column(Float)
    original_base_price = Column(Float, nullable=True)
    nationality = Column(String, nullable=True)
    status = Column(String, default="available") # available, sold, unsold
    sold_to_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    final_price = Column(Float, nullable=True)
    previous_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True) # For RTM logic
    age = Column(Integer, nullable=True)
    stats = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    sold_at = Column(DateTime, nullable=True)

    team = relationship("Team", back_populates="players", foreign_keys=[sold_to_team_id])
    bids = relationship("Bid", back_populates="player")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_winning = Column(Boolean, default=False)
    auction_session_id = Column(String, nullable=True)

    player = relationship("Player", back_populates="bids")
    team = relationship("Team", back_populates="bids")
