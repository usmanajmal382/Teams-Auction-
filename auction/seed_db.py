from models import models, database
from routers.auth import get_password_hash
from sqlalchemy.orm import Session

def seed():
    models.Base.metadata.drop_all(bind=database.engine)
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()

    # Create teams
    teams = [
        models.Team(name="Sargodha Thunders",     owner_name="Owner 1", total_budget=110000),
        models.Team(name="Jauharabad Buber Sher",  owner_name="Owner 2", total_budget=110000),
        models.Team(name="Khushab Punjabians",     owner_name="Owner 3", total_budget=110000),
        models.Team(name="Sialkot Janbaz",         owner_name="Owner 4", total_budget=110000),
        models.Team(name="Bhakkar Wolves",         owner_name="Owner 5", total_budget=110000),
        models.Team(name="Faisalabad Stallions",   owner_name="Owner 6", total_budget=110000),
        models.Team(name="Mianwali Royals",        owner_name="Owner 7", total_budget=110000),
        models.Team(name="Naushera Gladiators",    owner_name="Owner 8", total_budget=110000),
    ]
    for team in teams:
        db.add(team)
    db.commit()

    t1 = db.query(models.Team).filter(models.Team.name == "Sargodha Thunders").first()
    t2 = db.query(models.Team).filter(models.Team.name == "Jauharabad Buber Sher").first()
    t3 = db.query(models.Team).filter(models.Team.name == "Khushab Punjabians").first()

    # Create users
    users = [
        models.User(username="admin", password_hash=get_password_hash("admin"), role="admin"),
        models.User(username="owner1", password_hash=get_password_hash("owner"), role="owner", team_id=t1.id),
        models.User(username="owner2", password_hash=get_password_hash("owner"), role="owner", team_id=t2.id),
        models.User(username="owner3", password_hash=get_password_hash("owner"), role="owner", team_id=t3.id),
        models.User(username="viewer", password_hash=get_password_hash("viewer"), role="viewer"),
    ]
    for user in users:
        db.add(user)
    db.commit()

    # Create players
    players = [
        models.Player(name="Virat Kohli", role="Batsman", base_price=1000, nationality="Indian", previous_team_id=None),
        models.Player(name="MS Dhoni", role="Wicket-Keeper", base_price=1000, nationality="Indian", previous_team_id=None),
        models.Player(name="Rohit Sharma", role="Batsman", base_price=1000, nationality="Indian", previous_team_id=None),
        models.Player(name="Jasprit Bumrah", role="Bowler", base_price=1000, nationality="Indian", previous_team_id=None),
        models.Player(name="Rashid Khan", role="Bowler", base_price=1000, nationality="Afghan", previous_team_id=None),
        models.Player(name="Ben Stokes", role="All-Rounder", base_price=1000, nationality="English", previous_team_id=None),
        models.Player(name="Glenn Maxwell", role="All-Rounder", base_price=1000, nationality="Australian", previous_team_id=None),
        models.Player(name="Trent Boult", role="Bowler", base_price=1000, nationality="New Zealander", previous_team_id=None),
    ]
    # Generate 42 mock players
    for i in range(1, 43):
        players.append(models.Player(
            name=f"Mock Player {i}",
            role="All-Rounder",
            base_price=1000,
            nationality="Unknown",
            previous_team_id=None
        ))

    for player in players:
        db.add(player)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed()
    print("Database seeded with 3 teams, 5 users, and 50 players.")
