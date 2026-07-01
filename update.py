import os

# Replace IPL with PCL in HTML files
files = [
    'frontend/teams.html', 
    'frontend/players.html', 
    'frontend/index.html', 
    'frontend/auction.html', 
    'frontend/admin.html', 
    'README.md'
]

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        content = content.replace('IPL', 'PCL')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)

# Update seed_db.py
seed_db_content = """from auction.models import models, database
from auction.routers.auth import get_password_hash
from sqlalchemy.orm import Session

def seed():
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()

    # Create teams
    teams = [
        models.Team(name="Sargodha Thunders", owner_name="Owner ST", total_budget=1000000000),
        models.Team(name="Khushab Punjabians", owner_name="Owner KP", total_budget=1000000000),
        models.Team(name="Jauharbad BuberSher", owner_name="Owner JB", total_budget=1000000000),
        models.Team(name="Bhakar Wolves", owner_name="Owner BW", total_budget=1000000000),
    ]
    for team in teams:
        db.add(team)
    db.commit()

    st = db.query(models.Team).filter(models.Team.name == "Sargodha Thunders").first()
    kp = db.query(models.Team).filter(models.Team.name == "Khushab Punjabians").first()
    jb = db.query(models.Team).filter(models.Team.name == "Jauharbad BuberSher").first()
    bw = db.query(models.Team).filter(models.Team.name == "Bhakar Wolves").first()

    # Create users
    users = [
        models.User(username="admin", password_hash=get_password_hash("admin"), role="admin"),
        models.User(username="owner_st", password_hash=get_password_hash("owner"), role="owner", team_id=st.id),
        models.User(username="owner_kp", password_hash=get_password_hash("owner"), role="owner", team_id=kp.id),
        models.User(username="owner_jb", password_hash=get_password_hash("owner"), role="owner", team_id=jb.id),
        models.User(username="owner_bw", password_hash=get_password_hash("owner"), role="owner", team_id=bw.id),
        models.User(username="viewer", password_hash=get_password_hash("viewer"), role="viewer"),
    ]
    for user in users:
        db.add(user)
    db.commit()

    # Create players
    players = [
        models.Player(name="Virat Kohli", role="Batsman", base_price=20000000, nationality="Indian", previous_team_id=st.id),
        models.Player(name="MS Dhoni", role="Wicket-Keeper", base_price=20000000, nationality="Indian", previous_team_id=kp.id),
        models.Player(name="Rohit Sharma", role="Batsman", base_price=20000000, nationality="Indian", previous_team_id=jb.id),
        models.Player(name="Jasprit Bumrah", role="Bowler", base_price=20000000, nationality="Indian", previous_team_id=jb.id),
        models.Player(name="Rashid Khan", role="Bowler", base_price=15000000, nationality="Afghan", previous_team_id=None),
        models.Player(name="Ben Stokes", role="All-Rounder", base_price=20000000, nationality="English", previous_team_id=None),
        models.Player(name="Glenn Maxwell", role="All-Rounder", base_price=15000000, nationality="Australian", previous_team_id=bw.id),
        models.Player(name="Trent Boult", role="Bowler", base_price=15000000, nationality="New Zealander", previous_team_id=st.id),
    ]
    for player in players:
        db.add(player)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed()
    print("Database seeded with 4 teams, 6 users, and 8 players.")
"""

with open('seed_db.py', 'w', encoding='utf-8') as f:
    f.write(seed_db_content)

print("Update complete")
