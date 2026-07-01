from auction.models import models, database
from auction.routers.auth import get_password_hash
from sqlalchemy.orm import Session

def seed():
    models.Base.metadata.drop_all(bind=database.engine)
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()

    # Create teams
    teams = [
        models.Team(name="Sargodha Thunders", owner_name="Owner ST", total_budget=110000),
        models.Team(name="Khushab Punjabians", owner_name="Owner KP", total_budget=110000),
        models.Team(name="Jauharbad BuberSher", owner_name="Owner JB", total_budget=110000),
        models.Team(name="Bhakar Wolves", owner_name="Owner BW", total_budget=110000),
        models.Team(name="Mianwali Lions", owner_name="Owner ML", total_budget=110000),
        models.Team(name="Faisalabad Falcons", owner_name="Owner FF", total_budget=110000),
        models.Team(name="Lahore Qalandars", owner_name="Owner LQ", total_budget=110000),
        models.Team(name="Karachi Kings", owner_name="Owner KK", total_budget=110000),
    ]
    for team in teams:
        db.add(team)
    db.commit()

    st = db.query(models.Team).filter(models.Team.name == "Sargodha Thunders").first()
    kp = db.query(models.Team).filter(models.Team.name == "Khushab Punjabians").first()
    jb = db.query(models.Team).filter(models.Team.name == "Jauharbad BuberSher").first()
    bw = db.query(models.Team).filter(models.Team.name == "Bhakar Wolves").first()
    ml = db.query(models.Team).filter(models.Team.name == "Mianwali Lions").first()
    ff = db.query(models.Team).filter(models.Team.name == "Faisalabad Falcons").first()
    lq = db.query(models.Team).filter(models.Team.name == "Lahore Qalandars").first()
    kk = db.query(models.Team).filter(models.Team.name == "Karachi Kings").first()

    # Create users
    users = [
        models.User(username="admin", password_hash=get_password_hash("admin"), role="admin"),
        models.User(username="owner_st", password_hash=get_password_hash("owner"), role="owner", team_id=st.id),
        models.User(username="owner_kp", password_hash=get_password_hash("owner"), role="owner", team_id=kp.id),
        models.User(username="owner_jb", password_hash=get_password_hash("owner"), role="owner", team_id=jb.id),
        models.User(username="owner_bw", password_hash=get_password_hash("owner"), role="owner", team_id=bw.id),
        models.User(username="owner_ml", password_hash=get_password_hash("owner"), role="owner", team_id=ml.id),
        models.User(username="owner_ff", password_hash=get_password_hash("owner"), role="owner", team_id=ff.id),
        models.User(username="owner_lq", password_hash=get_password_hash("owner"), role="owner", team_id=lq.id),
        models.User(username="owner_kk", password_hash=get_password_hash("owner"), role="owner", team_id=kk.id),
        models.User(username="viewer", password_hash=get_password_hash("viewer"), role="viewer"),
    ]
    for user in users:
        db.add(user)
    db.commit()

    # Create players
    players = [
        models.Player(name="Virat Kohli", role="Batsman", base_price=10000, age=37, stats="Runs: 12000, Avg: 57.3", photo_url="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=300&h=300&fit=crop", previous_team_id=st.id),
        models.Player(name="MS Dhoni", role="Wicket-Keeper", base_price=10000, age=42, stats="Runs: 10773, Catches: 321", photo_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop", previous_team_id=kp.id),
        models.Player(name="Rohit Sharma", role="Batsman", base_price=10000, age=36, stats="Runs: 9800, 100s: 30", photo_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop", previous_team_id=jb.id),
        models.Player(name="Jasprit Bumrah", role="Bowler", base_price=10000, age=30, stats="Wickets: 150, Econ: 6.8", photo_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop", previous_team_id=jb.id),
        models.Player(name="Rashid Khan", role="Bowler", base_price=10000, age=25, stats="Wickets: 139, Econ: 6.4", photo_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop", previous_team_id=None),
        models.Player(name="Ben Stokes", role="All-Rounder", base_price=10000, age=32, stats="Runs: 3200, Wickets: 74", photo_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop", previous_team_id=None),
        models.Player(name="Glenn Maxwell", role="All-Rounder", base_price=10000, age=35, stats="Runs: 2800, SR: 154.2", photo_url="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop", previous_team_id=bw.id),
        models.Player(name="Trent Boult", role="Bowler", base_price=10000, age=34, stats="Wickets: 105, Econ: 7.2", photo_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop", previous_team_id=st.id),
    ]
    for player in players:
        db.add(player)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed()
    print("Database seeded with 8 teams, 10 users, and 8 players.")
