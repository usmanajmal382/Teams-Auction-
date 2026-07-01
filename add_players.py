import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from auction.models import models, database

def add_mock_players():
    db = database.SessionLocal()
    players = []
    # Check how many players already exist to avoid duplicating if run multiple times
    existing = db.query(models.Player).count()
    if existing >= 50:
        print(f"Already have {existing} players.")
        return

    needed = 50 - existing
    for i in range(1, needed + 1):
        players.append(models.Player(
            name=f"Mock Player {i + existing}",
            role="All-Rounder",
            base_price=10000000,
            nationality="Unknown",
            previous_team_id=None,
            status="available"
        ))
    
    for p in players:
        db.add(p)
    db.commit()
    db.close()
    print(f"Added {needed} mock players.")

if __name__ == "__main__":
    add_mock_players()
