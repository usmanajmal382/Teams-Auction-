import asyncio
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from ..models import models, database
from .auth import require_role
from ..websocket.manager import manager


router = APIRouter(tags=["auction"])

current_active_player_id: Optional[int] = None

class BidRequest(BaseModel):
    player_id: int
    amount: float
    team_id: int

class AutoSellRequest(BaseModel):
    current_bid_id: Optional[int] = None

class RTMRequest(BaseModel):
    team_id: int

@router.websocket("/ws/auction")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain connection, message processing can be handled here if needed
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/auction/active")
def get_active_auction(db: Session = Depends(database.get_db)):
    global current_active_player_id
    if current_active_player_id is None:
        return {"active": False, "player": None, "current_bid": 0, "winning_team": "None", "winning_team_id": None, "bid_history": [], "countdown_active": False, "seconds_left": 0}
    
    player = db.query(models.Player).filter(models.Player.id == current_active_player_id).first()
    if not player:
        return {"active": False, "player": None, "current_bid": 0, "winning_team": "None", "winning_team_id": None, "bid_history": [], "countdown_active": False, "seconds_left": 0}
        
    current_highest_bid = db.query(models.Bid).filter(models.Bid.player_id == current_active_player_id).order_by(models.Bid.amount.desc()).first()
    
    winning_team_name = "None"
    winning_team_id = None
    current_bid_amount = player.base_price
    
    if current_highest_bid:
        current_bid_amount = current_highest_bid.amount
        winning_team_id = current_highest_bid.team_id
        team = db.query(models.Team).filter(models.Team.id == current_highest_bid.team_id).first()
        if team:
            winning_team_name = team.name
            
    # Fetch bid history for this active player in chronological order
    bids = db.query(models.Bid).filter(models.Bid.player_id == current_active_player_id).order_by(models.Bid.timestamp.asc()).all()
    bid_history = []
    for b in bids:
        t = db.query(models.Team).filter(models.Team.id == b.team_id).first()
        bid_history.append({
            "amount": b.amount,
            "team_id": b.team_id,
            "team_name": t.name if t else "Unknown",
            "owner_name": t.owner_name if t else "Unknown"
        })

    # Calculate timer state dynamically based on the last bid timestamp
    countdown_active = False
    seconds_left = 0
    if current_highest_bid:
        delta = datetime.utcnow() - current_highest_bid.timestamp
        seconds_since_last_bid = delta.total_seconds()
        if seconds_since_last_bid >= 60:
            countdown_active = True
            seconds_left = max(0.0, 15.0 - (seconds_since_last_bid - 60.0))
            
    return {
        "active": True,
        "player": {
            "id": player.id,
            "name": player.name,
            "role": player.role,
            "base_price": player.base_price,
            "nationality": player.nationality,
            "previous_team_id": player.previous_team_id
        },
        "current_bid": current_bid_amount,
        "winning_team": winning_team_name,
        "winning_team_id": winning_team_id,
        "bid_history": bid_history,
        "countdown_active": countdown_active,
        "seconds_left": int(seconds_left)
    }

@router.post("/auction/start/{player_id}")
async def start_auction(player_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    global current_active_player_id
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    current_active_player_id = player_id
    
    # Broadcast auction start (no timer initiated)
    await manager.broadcast_json({
        "type": "auction_start",
        "player": {
            "id": player.id,
            "name": player.name,
            "role": player.role,
            "base_price": player.base_price,
            "nationality": player.nationality,
            "previous_team_id": player.previous_team_id
        }
    })
    
    return {"message": "Auction started", "player_id": player.id}

@router.post("/bid")
async def place_bid(bid_req: BidRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["owner"]))):
    global current_active_player_id
    print(f"[DEBUG BID] User: {current_user.username}, Role: {current_user.role}, TeamID: {current_user.team_id} | Req TeamID: {bid_req.team_id}")
    if current_active_player_id is None or bid_req.player_id != current_active_player_id:
        raise HTTPException(status_code=400, detail="This player is not currently active for bidding.")

    if current_user.team_id != bid_req.team_id:
        print(f"[DEBUG BID] 403 Mismatch! user.team_id={current_user.team_id} != req.team_id={bid_req.team_id}")
        raise HTTPException(status_code=403, detail="You can only bid for your own team.")

    player = db.query(models.Player).filter(models.Player.id == bid_req.player_id).first()
    team = db.query(models.Team).filter(models.Team.id == bid_req.team_id).first()
    
    if not player or player.status != "available":
        raise HTTPException(status_code=400, detail="Player not available for bidding")
        
    current_highest_bid = db.query(models.Bid).filter(models.Bid.player_id == bid_req.player_id).order_by(models.Bid.amount.desc()).first()
    
    # Minimum increment calculation (+1000)
    if current_highest_bid:
        min_bid = current_highest_bid.amount + 1000
        if bid_req.amount < min_bid:
            raise HTTPException(status_code=400, detail=f"Bid amount must be at least {min_bid}")
    else:
        if bid_req.amount < player.base_price:
            raise HTTPException(status_code=400, detail=f"Bid amount must be at least base price ({player.base_price})")
        
    if bid_req.amount > team.remaining_budget:
        raise HTTPException(status_code=400, detail="Insufficient budget")

    # Create bid
    new_bid = models.Bid(player_id=player.id, team_id=team.id, amount=bid_req.amount)
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)

    # Broadcast new bid with owner name and team details
    await manager.broadcast_json({
        "type": "new_bid",
        "player_id": player.id,
        "amount": new_bid.amount,
        "team_id": team.id,
        "team_name": team.name,
        "owner_name": team.owner_name
    })

    # Schedule Celery task for 1 minute (60 seconds) of silent wait
    wait_for_countdown_task.apply_async(args=[player.id, new_bid.id], countdown=60)

    return new_bid

@router.post("/auction/auto-sell/start-countdown/{player_id}")
async def start_countdown(player_id: int, req: AutoSellRequest, db: Session = Depends(database.get_db)):
    global current_active_player_id
    current_highest_bid = db.query(models.Bid).filter(models.Bid.player_id == player_id).order_by(models.Bid.amount.desc()).first()
    bid_id = current_highest_bid.id if current_highest_bid else None
    
    if req.current_bid_id == bid_id and bid_id is not None:
        # Broadcast countdown_start
        await manager.broadcast_json({
            "type": "countdown_start",
            "player_id": player_id,
            "seconds": 15
        })
        # Schedule final sale check in 15 seconds
        wait_for_sale_task.apply_async(args=[player_id, bid_id], countdown=15)
        
    return {"status": "processed"}

@router.post("/auction/auto-sell/finalize/{player_id}")
async def finalize_sale(player_id: int, req: AutoSellRequest, db: Session = Depends(database.get_db)):
    global current_active_player_id
    current_highest_bid = db.query(models.Bid).filter(models.Bid.player_id == player_id).order_by(models.Bid.amount.desc()).first()
    bid_id = current_highest_bid.id if current_highest_bid else None
    
    if req.current_bid_id == bid_id and bid_id is not None:
        player = db.query(models.Player).filter(models.Player.id == player_id).first()
        team = db.query(models.Team).filter(models.Team.id == current_highest_bid.team_id).first()
        
        # Check for RTM eligibility
        if player.previous_team_id and player.previous_team_id != team.id:
            await manager.broadcast_json({
                "type": "rtm_prompt",
                "player_id": player.id,
                "highest_bid": current_highest_bid.amount,
                "winning_team_id": team.id,
                "rtm_team_id": player.previous_team_id
            })
        else:
            player.status = "sold"
            player.sold_to_team_id = team.id
            player.final_price = current_highest_bid.amount
            
            team.spent_budget += current_highest_bid.amount
            db.commit()
            current_active_player_id = None
            
            await manager.broadcast_json({
                "type": "sold",
                "player_id": player.id,
                "team_id": team.id,
                "team_name": team.name,
                "amount": current_highest_bid.amount
            })
            
    return {"status": "processed"}

class ManualSellRequest(BaseModel):
    team_id: int
    final_price: float

@router.get("/auction/history")
def get_auction_history(db: Session = Depends(database.get_db)):
    players = db.query(models.Player).filter(models.Player.status.in_(["sold", "unsold"])).order_by(models.Player.sold_at.desc()).all()
    history = []
    for p in players:
        history.append({
            "player_id": p.id,
            "player_name": p.name,
            "status": p.status,
            "team_name": p.team.name if p.team else "Unsold",
            "price": p.final_price if p.status == "sold" else None,
            "time": p.sold_at.isoformat() if p.sold_at else None
        })
    return history

@router.post("/auction/reset")
def reset_auction(db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    db.query(models.Player).update({
        models.Player.status: "available",
        models.Player.sold_to_team_id: None,
        models.Player.final_price: None,
        models.Player.sold_at: None
    })
    db.query(models.Bid).delete()
    db.commit()
    return {"message": "Auction has been reset successfully"}

@router.post("/auction/sold/{player_id}")
def manual_sell(player_id: int, req: ManualSellRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    team = db.query(models.Team).filter(models.Team.id == req.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    if req.final_price < player.base_price:
        raise HTTPException(status_code=400, detail=f"Final price must be at least the base price of {player.base_price}")
        
    if req.final_price > team.remaining_budget:
        raise HTTPException(status_code=400, detail=f"Insufficient budget. Team has only {team.remaining_budget} remaining.")
        
    player.status = "sold"
    player.sold_to_team_id = team.id
    player.final_price = req.final_price
    player.sold_at = datetime.utcnow()
    
    db.commit()
    db.refresh(player)
    return {"message": "Player marked as sold successfully", "player": player}

@router.post("/auction/unsold/{player_id}")
def manual_unsold(player_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    player.status = "unsold"
    player.sold_at = datetime.utcnow()
    db.commit()
    return {"message": "Player marked as unsold successfully"}

class DowngradeRequest(BaseModel):
    new_base_price: float

@router.post("/auction/downgrade/{player_id}")
def downgrade_player(player_id: int, req: DowngradeRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    if req.new_base_price >= player.base_price:
        raise HTTPException(status_code=400, detail="New base price must be lower than current base price")
        
    player.base_price = req.new_base_price
    player.status = "available"
    player.sold_at = None
    
    # Remove any existing bids just in case
    db.query(models.Bid).filter(models.Bid.player_id == player_id).delete()
    
    db.commit()
    return {"message": f"Player downgraded to {req.new_base_price} and returned to queue"}

@router.post("/auction/rtm/{player_id}")
async def process_rtm(player_id: int, req: RTMRequest, use_rtm: bool, db: Session = Depends(database.get_db)):
    global current_active_player_id
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    current_highest_bid = db.query(models.Bid).filter(models.Bid.player_id == player_id).order_by(models.Bid.amount.desc()).first()
    
    if use_rtm:
        team = db.query(models.Team).filter(models.Team.id == req.team_id).first()
        player.status = "sold"
        player.sold_to_team_id = team.id
        player.final_price = current_highest_bid.amount
        team.spent_budget += current_highest_bid.amount
        db.commit()
        current_active_player_id = None
        await manager.broadcast_json({
            "type": "sold",
            "player_id": player.id,
            "team_id": team.id,
            "team_name": team.name,
            "amount": current_highest_bid.amount,
            "rtm_used": True
        })
    else:
        team = db.query(models.Team).filter(models.Team.id == current_highest_bid.team_id).first()
        player.status = "sold"
        player.sold_to_team_id = team.id
        player.final_price = current_highest_bid.amount
        team.spent_budget += current_highest_bid.amount
        db.commit()
        current_active_player_id = None
        await manager.broadcast_json({
            "type": "sold",
            "player_id": player.id,
            "team_id": team.id,
            "team_name": team.name,
            "amount": current_highest_bid.amount,
            "rtm_used": False
        })
    return {"message": "RTM processed"}

import io
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_results_pdf(db: Session):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#0A1628'),
        spaceAfter=12
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=24
    )
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#0A1628'),
        spaceBefore=15,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155')
    )
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )
    
    # Title
    story.append(Paragraph("PCL Auction Results", title_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
    
    # Teams & Squads
    teams = db.query(models.Team).all()
    for team in teams:
        story.append(Paragraph(f"Team: {team.name} (Owner: {team.owner_name})", section_style))
        
        # Get squad — both auction-sold AND pre-retained players
        squad = db.query(models.Player).filter(
            models.Player.sold_to_team_id == team.id,
            models.Player.status.in_(['sold', 'retained'])
        ).all()
        retained_players = [p for p in squad if p.status == 'retained']
        sold_players = [p for p in squad if p.status == 'sold']
        spent = sum(p.final_price for p in squad if p.final_price is not None)
        remaining = team.total_budget - spent
        
        # Budget summary text
        budget_text = f"<b>Total Budget:</b> Rs.{team.total_budget:,.0f} | <b>Spent:</b> Rs.{spent:,.0f} | <b>Remaining:</b> Rs.{remaining:,.0f}"
        story.append(Paragraph(budget_text, body_style))
        story.append(Spacer(1, 6))
        
        # Table of players
        table_data = [[Paragraph("Player Name", header_style), Paragraph("Role", header_style), Paragraph("Nationality", header_style), Paragraph("Price Paid", header_style)]]

        # Captain always appears first — free player, no budget consumed
        if team.captain_name:
            table_data.append([
                Paragraph(f"<b>{team.captain_name}</b> (C)", body_style),
                Paragraph("Captain", body_style),
                Paragraph("-", body_style),
                Paragraph("-", body_style)
            ])

        # Retained players (pre-auction)
        for player in retained_players:
            table_data.append([
                Paragraph(f"<b>{player.name}</b>", body_style),
                Paragraph(player.role, body_style),
                Paragraph(player.nationality or "-", body_style),
                Paragraph(f"Rs.{player.final_price:,.0f} (Retained)", body_style)
            ])

        # Auction-sold players
        for player in sold_players:
            table_data.append([
                Paragraph(player.name, body_style),
                Paragraph(player.role, body_style),
                Paragraph(player.nationality or "-", body_style),
                Paragraph(f"Rs.{player.final_price:,.0f}", body_style)
            ])

        if len(squad) == 0 and not team.captain_name:
            table_data.append([Paragraph("No players purchased.", body_style), "", "", ""])
            
        t = Table(table_data, colWidths=[200, 120, 100, 120])

        # Build dynamic style — gold background for retained player rows
        captain_offset = 1 if team.captain_name else 0
        table_style_cmds = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0A1628')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]
        # Highlight each retained player row with a soft gold background
        for i, _ in enumerate(retained_players):
            row_idx = 1 + captain_offset + i  # header=0, captain=1 (optional), then retained
            table_style_cmds.append(('BACKGROUND', (0, row_idx), (-1, row_idx), colors.HexColor('#FEF9C3')))

        t.setStyle(TableStyle(table_style_cmds))
        story.append(t)
        story.append(Spacer(1, 15))
        
    # Unsold Players
    unsold_players = db.query(models.Player).filter(models.Player.status == 'unsold').all()
    if len(unsold_players) > 0:
        story.append(Paragraph("Unsold Players", section_style))
        table_data = [[Paragraph("Player Name", header_style), Paragraph("Role", header_style), Paragraph("Nationality", header_style), Paragraph("Base Price", header_style)]]
        for p in unsold_players:
            table_data.append([
                Paragraph(p.name, body_style),
                Paragraph(p.role, body_style),
                Paragraph(p.nationality or "-", body_style),
                Paragraph(f"Rs.{p.base_price:,.0f}", body_style)
            ])
        t = Table(table_data, colWidths=[200, 120, 100, 120])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EF4444')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))
        
    doc.build(story)
    buffer.seek(0)
    return buffer

@router.get("/auction/pdf")
def get_pdf(db: Session = Depends(database.get_db), current_user: models.User = Depends(require_role(["admin"]))):
    try:
        pdf_buffer = generate_results_pdf(db)
        return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=auction_results.pdf"})
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

