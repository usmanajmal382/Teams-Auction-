import requests
import json

BASE = "http://127.0.0.1:8000"

def sep(title):
    print(f"\n{'='*52}")
    print(f"  {title}")
    print(f"{'='*52}")

# STEP 1: Admin logs in
sep("STEP 1: Admin Login")
r = requests.post(f"{BASE}/login", data={"username": "admin", "password": "admin"})
admin_token = r.json().get("access_token")
print(f"Status : {r.status_code} OK")
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# STEP 2: Get available players
sep("STEP 2: Player Queue")
r = requests.get(f"{BASE}/players", headers=admin_headers)
players = r.json()
available = [p for p in players if p["status"] == "available"]
print(f"Available players ({len(available)}):")
for p in available:
    print(f"  [{p['id']}] {p['name']}  base={p['base_price']:,.0f}")
target = available[0]
print(f"\n>>> Target player: {target['name']} (ID={target['id']})")

# STEP 3: Admin starts auction
sep("STEP 3: Admin Starts Auction")
r = requests.post(f"{BASE}/auction/start/{target['id']}", headers=admin_headers)
print(f"Status : {r.status_code}")
print(f"Response: {r.json()}")

# STEP 4: Owner ST logs in and places first bid
sep("STEP 4: owner_st Places Opening Bid")
r = requests.post(f"{BASE}/login", data={"username": "owner_st", "password": "owner"})
st_data = r.json()
st_token = st_data.get("access_token")
st_team_id = 1  # Sargodha Thunders
st_headers = {"Authorization": f"Bearer {st_token}"}
print(f"Login  : {r.status_code} OK  (team_id={st_team_id})")

bid1 = int(target["base_price"] * 1.25)  # 25% over base
print(f"Bidding: {bid1:,}")
r = requests.post(f"{BASE}/bid", json={
    "player_id": target["id"],
    "amount": bid1,
    "team_id": st_team_id
}, headers=st_headers)
print(f"Status : {r.status_code}")
print(f"Response: {r.json()}")

# STEP 5: Owner KP counter-bids
sep("STEP 5: owner_kp Counter-Bids")
r = requests.post(f"{BASE}/login", data={"username": "owner_kp", "password": "owner"})
kp_token = r.json().get("access_token")
kp_team_id = 2  # Khushab Punjabians
kp_headers = {"Authorization": f"Bearer {kp_token}"}
print(f"Login  : {r.status_code} OK  (team_id={kp_team_id})")

bid2 = bid1 + 5_000
print(f"Bidding: {bid2:,}")
r = requests.post(f"{BASE}/bid", json={
    "player_id": target["id"],
    "amount": bid2,
    "team_id": kp_team_id
}, headers=kp_headers)
print(f"Status : {r.status_code}")
print(f"Response: {r.json()}")

# STEP 6: Owner JB tries a LOWER bid — should FAIL
sep("STEP 6: owner_jb Tries Lower Bid (Should Fail)")
r = requests.post(f"{BASE}/login", data={"username": "owner_jb", "password": "owner"})
jb_token = r.json().get("access_token")
jb_team_id = 3  # Jauharbad BuberSher
jb_headers = {"Authorization": f"Bearer {jb_token}"}

bad_bid = bid2 - 2_000
print(f"Bidding: {bad_bid:,} (invalid — below current highest)")
r = requests.post(f"{BASE}/bid", json={
    "player_id": target["id"],
    "amount": bad_bid,
    "team_id": jb_team_id
}, headers=jb_headers)
print(f"Status : {r.status_code}  (expected 400)")
print(f"Response: {r.json()}")

# STEP 7: Owner ST outbids again
sep("STEP 7: owner_st Wins With Top Bid")
bid3 = bid2 + 10_000
print(f"Bidding: {bid3:,}")
r = requests.post(f"{BASE}/bid", json={
    "player_id": target["id"],
    "amount": bid3,
    "team_id": st_team_id
}, headers=st_headers)
print(f"Status : {r.status_code}")
print(f"Response: {r.json()}")

# STEP 8: Admin manually sells
sep("STEP 8: Admin Sells Player")
r = requests.post(f"{BASE}/auction/sold/{target['id']}", headers=admin_headers)
print(f"Status : {r.status_code}")
print(f"Response: {r.json()}")

# STEP 9: Final verification
sep("STEP 9: Final Verification")
r = requests.get(f"{BASE}/players", headers=admin_headers)
updated = next(p for p in r.json() if p["id"] == target["id"])
r2 = requests.get(f"{BASE}/teams", headers=admin_headers)
teams = {t["id"]: t["name"] for t in r2.json()}

print(f"Player       : {updated['name']}")
print(f"Status       : {updated['status']}")
fp = updated.get('final_price') or updated.get('sold_price')
print(f"Final Price  : {fp:,.0f}" if fp else "Final Price  : N/A")
tid = updated.get('sold_to_team_id') or updated.get('team_id')
print(f"Sold To Team : {teams.get(tid, 'N/A')} (ID={tid})")

sep("ALL STEPS COMPLETE")
