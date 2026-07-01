from auction.models import models, database
from auction.routers.auth import get_password_hash
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
        models.Player(name="Sharjeel Abbas",     role="Batsman",       base_price=1000, nationality="Pakistani", previous_team_id=None),
        models.Player(name="Shahid Baby",         role="All-Rounder",   base_price=1000, nationality="Pakistani", previous_team_id=None),
        models.Player(name="Hamza Dhol",          role="Bowler",        base_price=1000, nationality="Pakistani", previous_team_id=None),
        models.Player(name="Rizwan Ahmed Bajwa",  role="Wicket-Keeper", base_price=1000, nationality="Pakistani", previous_team_id=None),
    ]
    # Generate remaining players
    extra_names = [
        "Usman Tariq", "Ali Raza", "Bilal Hassan", "Kamran Akmal Jr", "Fahad Mirza",
        "Saad Butt", "Junaid Alam", "Imran Butt", "Zubair Khan", "Asad Mehmood",
        "Sohail Akhtar", "Noman Ali", "Haris Rauf", "Shadab Jr", "Amir Yousuf",
        "Danish Aziz", "Fawad Alam Jr", "Sarfraz Jr", "Babar Khan", "Aamir Sohail Jr",
        "Kashif Daud", "Tauseef Ahmed", "Waqar Jr", "Misbah Jr", "Yasir Ali",
        "Mukhtar Ahmed", "Khurram Manzoor Jr", "Saeed Ajmal Jr", "Umar Akmal Jr", "Shoaib Jr",
        "Tabish Khan", "Iftikhar Jr", "Haider Ali Jr", "Abdullah Shafique Jr", "Salman Agha Jr",
        "Faheem Ashraf Jr", "Mohammad Wasim Jr", "Naseem Jr", "Shaheen Jr", "Hasan Ali Jr",
        "Zaman Khan", "Ihsanullah",
    ]
    for name in extra_names:
        players.append(models.Player(
            name=name,
            role="All-Rounder",
            base_price=1000,
            nationality="Pakistani",
            previous_team_id=None
        ))

    for player in players:
        db.add(player)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed()
    print("Database seeded with 3 teams, 5 users, and 50 players.")
