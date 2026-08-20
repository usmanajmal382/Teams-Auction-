from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from ..models import models, database
from ..websocket.manager import manager

router = APIRouter(tags=["chatbot"])

class ChatbotRequest(BaseModel):
    message: str

class ChatMessageRequest(BaseModel):
    user_name: str
    role: str
    message: str
    team_name: Optional[str] = None

# In-memory live chat storage (keeps last 100 messages)
chat_messages_store: List[dict] = []

@router.post("/chatbot/ask")
def ask_chatbot(req: ChatbotRequest, db: Session = Depends(database.get_db)):
    msg = req.message.strip().lower()
    
    if not msg:
        return {"reply": "Aap aukanat ya rules ke baray mein sawal pooch sakte hain!"}

    # 1. Budget / Team Queries
    if "budget" in msg or "purse" in msg or "paise" in msg or "paisa" in msg or "baqi" in msg or "team" in msg:
        teams = db.query(models.Team).all()
        # Check if specific team requested
        for t in teams:
            t_name_lower = t.name.lower()
            if any(part in msg for part in t_name_lower.split()) or (t.owner_name and t.owner_name.lower() in msg):
                squad_count = db.query(models.Player).filter(
                    models.Player.sold_to_team_id == t.id,
                    models.Player.status.in_(["sold", "retained"])
                ).count()
                spent = t.spent_budget or 0
                rem = t.total_budget - spent
                return {
                    "reply": f"📊 **{t.name}** (Owner: {t.owner_name}):\n"
                             f"• Total Purse: Rs. {t.total_budget:,.0f}\n"
                             f"• Spent Purse: Rs. {spent:,.0f}\n"
                             f"• Remaining Purse: Rs. {rem:,.0f}\n"
                             f"• Squad Count: {squad_count} Players"
                }
        
        # Summary for all teams
        lines = ["💰 **Sub Teams ka Current Purse Status:**\n"]
        for t in teams:
            spent = t.spent_budget or 0
            rem = t.total_budget - spent
            lines.append(f"• **{t.name}**: Remaining Rs. {rem:,.0f} (Spent Rs. {spent:,.0f})")
        return {"reply": "\n".join(lines)}

    # 2. Highest Price / Most Expensive Player
    if "expensive" in msg or "highest" in msg or "mehnga" in msg or "top player" in msg or "record" in msg:
        top_player = db.query(models.Player).filter(models.Player.status == "sold").order_by(models.Player.final_price.desc()).first()
        if top_player:
            team_name = top_player.team.name if top_player.team else "Unknown"
            return {
                "reply": f"🔥 **Sab se mehnga player:**\n"
                         f"👤 **{top_player.name}** ({top_player.role})\n"
                         f"💵 Price: **Rs. {top_player.final_price:,.0f}**\n"
                         f"🛡️ Sold to: **{team_name}**"
            }
        else:
            return {"reply": "Abhi tak koi player auction me sell nahi hua hai!"}

    # 3. Unsold Players
    if "unsold" in msg:
        unsold = db.query(models.Player).filter(models.Player.status == "unsold").all()
        if unsold:
            names = [f"• {p.name} ({p.role} - Rs. {p.base_price:,.0f})" for p in unsold]
            return {"reply": f"❌ **Unsold Players List ({len(unsold)}):**\n" + "\n".join(names)}
        return {"reply": "Abhi tak koi player unsold nahi hua hai."}

    # 4. Retained Players
    if "retain" in msg or "retained" in msg:
        retained = db.query(models.Player).filter(models.Player.status == "retained").all()
        if retained:
            lines = [f"• **{p.name}** -> {p.team.name if p.team else 'Team'} (Rs. {p.final_price:,.0f})" for p in retained]
            return {"reply": f"⭐ **Retained Players ({len(retained)}):**\n" + "\n".join(lines)}
        return {"reply": "Abhi koi player retain nahi hai."}

    # 5. RTM & Auction Rules
    if "rtm" in msg or "rule" in msg or "kaise" in msg or "how" in msg:
        return {
            "reply": "📜 **PCL Auction Rules & RTM Guide:**\n"
                     "1. **Bidding Increment**: Minimum +Rs. 1,000 increment.\n"
                     "2. **Budget Constraint**: Aap team ke remaining purse se zyaada bid nahi laga sakte.\n"
                     "3. **RTM (Right To Match)**: Agar player kisi aur team ne jeeta ho, to player ki previous team same price match kar ke retain kar sakti hai.\n"
                     "4. **Undo Feature**: Admin accidental bids ko reverse/undo kar sakta hai."
        }

    # 6. Specific Player Search
    players = db.query(models.Player).all()
    for p in players:
        if p.name.lower() in msg or any(name_part in msg for name_part in p.name.lower().split() if len(name_part) > 2):
            st = p.status.upper()
            details = f"👤 **Player Information: {p.name}**\n" \
                      f"• Role: {p.role}\n" \
                      f"• Base Price: Rs. {p.base_price:,.0f}\n" \
                      f"• Status: **{st}**\n"
            if p.status in ["sold", "retained"] and p.team:
                details += f"• Team: **{p.team.name}**\n"
                details += f"• Price: **Rs. {p.final_price:,.0f}**\n"
            return {"reply": details}

    # Default Helpful Response
    return {
        "reply": "🤖 Main Aapka PCL Auction AI Assistant hun! Aap mujh se pooch sakte hain:\n"
                 "• *'MI ka budget kitna bacha hai?'*\n"
                 "• *'Sab se mehnga player konsa sell hua?'*\n"
                 "• *'Unsold players list'* ya *'Retained players'* \n"
                 "• *'RTM rules kya hain?'*\n"
                 "• Kisi bhi player ka naam likh kar unka status pooch sakte hain!"
    }


@router.get("/chat/messages")
def get_chat_messages():
    return chat_messages_store[-50:]  # Return last 50 messages


@router.post("/chat/message")
async def send_chat_message(req: ChatMessageRequest):
    new_msg = {
        "id": len(chat_messages_store) + 1,
        "user_name": req.user_name,
        "role": req.role,
        "team_name": req.team_name or "Spectator",
        "message": req.message,
        "timestamp": datetime.now().strftime("%H:%M")
    }
    chat_messages_store.append(new_msg)
    
    # Broadcast live chat message over WebSockets to all connected UI clients
    await manager.broadcast_json({
        "type": "chat_message",
        "data": new_msg
    })
    
    return new_msg
