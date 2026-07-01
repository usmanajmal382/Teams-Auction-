# PCL Auction Real-time

A complete, real-time PCL cricket auction website with role-based access, live bidding, right-to-match (RTM) logic, and a dynamic modern UI.

## Tech Stack
- **Backend**: Python, FastAPI, WebSockets
- **Database**: SQLite (SQLAlchemy ORM)
- **Task Queue**: Celery & Redis (for auction timer)
- **Frontend**: HTML, CSS, JavaScript (No external framework)
- **Authentication**: JWT (python-jose, bcrypt)

## Prerequisites
- Python 3.9+
- Redis Server (must be running on `localhost:6379`)

## Installation & Setup

1. **Activate the Virtual Environment**:
   ```bash
   .\venv\Scripts\activate
   ```
   *Note: All required libraries are already installed in this `venv`.*

2. **Ensure Redis is Running**:
   You need a running Redis server on default port `6379` for Celery to work.
   - On Windows: You can use Memurai, WSL, or Docker (`docker run -p 6379:6379 -d redis`).

3. **Start the Celery Worker**:
   Open a new terminal, activate the `venv`, and run:
   ```bash
   cd "e:\Auction web"
   celery -A auction.tasks.celery_app worker --loglevel=info -P solo
   ```
   *(We use `-P solo` on Windows to avoid process spawning issues)*

4. **Start the FastAPI Server**:
   Open another terminal, activate the `venv`, and run:
   ```bash
   cd "e:\Auction web"
   uvicorn auction.main:app --reload
   ```

5. **Access the Application**:
   Open your browser and navigate to: `http://127.0.0.1:8000/`

## Pre-Loaded Test Accounts
The database has been seeded with 3 teams and 8 players.
- **Admin**: Username: `admin`, Password: `admin`
- **Team Owners**: 
  - `owner_mi` (Mumbai Indians) - Password: `owner`
  - `owner_csk` (Chennai Super Kings) - Password: `owner`
  - `owner_rcb` (Royal Challengers Bangalore) - Password: `owner`
- **Viewer**: Username: `viewer`, Password: `viewer`

## How to Test the Flow
1. Open an Incognito window and log in as `admin`. Go to the Admin Panel (`/admin.html`).
2. Open another window and log in as `owner_mi`. You will be directed to the Live Auction (`/auction.html`).
3. Open another window and log in as `owner_csk`.
4. In the Admin Panel, click "Start Bidding" on a player in the queue.
5. In the Owner windows, the player card will appear. Place bids. 
6. Wait 30 seconds without bidding to see the auto-sell logic kick in via Celery! If the player's previous team wasn't the winning team, the RTM prompt will appear for the eligible owner.
