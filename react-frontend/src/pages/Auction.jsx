import { useState, useEffect, useRef } from 'react';
import { apiCall, WS_URL, getUser } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Auction() {
    const [user] = useState(() => getUser());
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [currentBid, setCurrentBid] = useState(0);
    const [winningTeam, setWinningTeam] = useState('None');
    const [winningTeamId, setWinningTeamId] = useState(null);
    const [timerSeconds, setTimerSeconds] = useState(15);
    const [showTimer, setShowTimer] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [ownerTeam, setOwnerTeam] = useState(null);
    const [squad, setSquad] = useState([]);
    const [bidHistory, setBidHistory] = useState([]);
    const [customBid, setCustomBid] = useState('');
    const navigate = useNavigate();

    const timerIntervalRef = useRef(null);

    const fetchOwnerTeam = async () => {
        if (user && user.role === 'owner' && user.team_id) {
            try {
                const data = await apiCall(`/teams/${user.team_id}`);
                setOwnerTeam(data);
            } catch (e) {
                console.error("Error loading team details:", e);
            }
        }
    };

    const fetchOwnerSquad = async () => {
        if (user && user.role === 'owner' && user.team_id) {
            try {
                const data = await apiCall(`/teams/${user.team_id}/squad`);
                setSquad(data);
            } catch (e) {
                console.error("Error loading squad details:", e);
            }
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        fetchOwnerTeam();
        fetchOwnerSquad();

        const showStatusMsg = (msg) => {
            setStatusMsg(msg);
            setTimeout(() => setStatusMsg(''), 4000);
        };

        const clearAuctionState = () => {
            setTimeout(() => {
                setCurrentPlayer(null);
                setCurrentBid(0);
                setWinningTeam('None');
                setWinningTeamId(null);
                setBidHistory([]);
                setShowTimer(false);
            }, 3000);
        };

        const startCountdown = (seconds) => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            setShowTimer(true);
            setTimerSeconds(Math.ceil(seconds));
            timerIntervalRef.current = setInterval(() => {
                setTimerSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(timerIntervalRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        const stopCountdown = () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            setShowTimer(false);
        };

        const checkActiveAuction = async () => {
            try {
                const res = await apiCall('/auction/active');
                if (res.active) {
                    setCurrentPlayer(res.player);
                    setCurrentBid(res.current_bid);
                    setWinningTeam(res.winning_team);
                    setWinningTeamId(res.winning_team_id);
                    setBidHistory(res.bid_history || []);
                    if (res.countdown_active) {
                        startCountdown(res.seconds_left);
                    } else {
                        stopCountdown();
                    }
                }
            } catch (e) {
                console.error("Error loading active auction:", e);
            }
        };

        const connectWS = () => {
            const websocket = new WebSocket(WS_URL);

            websocket.onopen = () => console.log('Connected to auction WS');
            websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'auction_start') {
                    setCurrentPlayer(data.player);
                    setCurrentBid(data.player.base_price);
                    setWinningTeam('None');
                    setWinningTeamId(null);
                    setBidHistory([]);
                    stopCountdown();
                } else if (data.type === 'new_bid') {
                    setCurrentBid(data.amount);
                    setWinningTeam(data.team_name);
                    setWinningTeamId(data.team_id);
                    stopCountdown();
                    
                    // Add to history
                    setBidHistory(prev => {
                        if (prev.some(b => b.amount === data.amount)) return prev;
                        return [...prev, {
                            amount: data.amount,
                            team_id: data.team_id,
                            team_name: data.team_name,
                            owner_name: data.owner_name
                        }];
                    });
                } else if (data.type === 'countdown_start') {
                    startCountdown(data.seconds);
                } else if (data.type === 'sold') {
                    stopCountdown();
                    showStatusMsg(`Sold to ${data.team_name} for Rs ${data.amount.toLocaleString()}`);
                    clearAuctionState();
                    fetchOwnerTeam();
                    fetchOwnerSquad();
                } else if (data.type === 'unsold') {
                    stopCountdown();
                    showStatusMsg(`Player Unsold`);
                    clearAuctionState();
                } else if (data.type === 'rtm_prompt') {
                    stopCountdown();
                    // Process RTM decision
                    if (user.role === 'owner' && user.team_id === data.rtm_team_id) {
                        if (window.confirm(`Right to Match available! Match bid of Rs ${data.highest_bid.toLocaleString()}?`)) {
                            apiCall(`/auction/rtm/${data.player_id}?use_rtm=true`, {
                                method: 'POST',
                                body: JSON.stringify({ team_id: user.team_id })
                            }).then(() => {
                                fetchOwnerTeam();
                                fetchOwnerSquad();
                            });
                        } else {
                            apiCall(`/auction/rtm/${data.player_id}?use_rtm=false`, {
                                method: 'POST',
                                body: JSON.stringify({ team_id: user.team_id })
                            }).then(() => {
                                fetchOwnerTeam();
                                fetchOwnerSquad();
                            });
                        }
                    } else {
                        showStatusMsg(`Waiting for RTM decision...`);
                    }
                }
            };

            websocket.onclose = () => {
                console.log('WS disconnected. Attempting reconnect...');
                setTimeout(connectWS, 3000);
            };

            return websocket;
        };

        checkActiveAuction();
        const websocket = connectWS();

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            websocket.close();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const nextMinBid = currentPlayer
        ? (currentBid > 0 && winningTeam !== 'None' ? currentBid + 1000 : currentPlayer.base_price)
        : 0;

    useEffect(() => {
        if (currentPlayer) {
            setCustomBid(nextMinBid);
        }
    }, [nextMinBid, currentPlayer]);

    const verifyOwnerSession = () => {
        const currentUser = getUser();
        if (!currentUser || currentUser.role !== 'owner') {
            alert("Your session has changed or expired (e.g., logged in as another user in a different tab). Please log in as Owner again.");
            navigate('/');
            return false;
        }
        return true;
    };

    const placeBid = async (amountToBid) => {
        if (!verifyOwnerSession()) return;
        if (!user || user.role !== 'owner' || !currentPlayer) return;
        
        const bidAmount = parseInt(amountToBid);
        if (isNaN(bidAmount) || bidAmount < nextMinBid) {
            alert(`Bid must be at least the minimum next bid (Rs ${nextMinBid.toLocaleString()})`);
            return;
        }

        if (ownerTeam && bidAmount > ownerTeam.remaining_budget) {
            alert(`Insufficient budget! Your remaining budget is Rs ${ownerTeam.remaining_budget.toLocaleString()}`);
            return;
        }

        try {
            await apiCall('/bid', {
                method: 'POST',
                body: JSON.stringify({
                    player_id: currentPlayer.id,
                    team_id: user.team_id,
                    amount: bidAmount
                })
            });
        } catch (e) {
            alert(e.message);
        }
    };

    const isWinning = winningTeamId === user?.team_id;
    const canAfford = ownerTeam ? ownerTeam.remaining_budget >= nextMinBid : false;

    return (
        <>
            {statusMsg && <div className="status-msg">{statusMsg}</div>}

            <div className="container">
                {user?.role === 'owner' && ownerTeam && (
                    <div className="card mb-2 flex-responsive" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                        <div>
                            <span className="text-muted">Logged in as:</span>
                            <h3 style={{ color: 'var(--primary)', fontFamily: 'Outfit' }}>{ownerTeam.owner_name} ({ownerTeam.name})</h3>
                        </div>
                        <div className="text-right-responsive">
                            <span className="text-muted">Remaining Budget:</span>
                            <h2 style={{ color: 'var(--secondary)', fontFamily: 'Outfit' }}>Rs {ownerTeam.remaining_budget.toLocaleString()}</h2>
                        </div>
                    </div>
                )}

                {!currentPlayer ? (
                    <div className="text-center mt-2" style={{ padding: '4rem 0' }}>
                        <h2>Waiting for auctioneer to start...</h2>
                        <p className="text-muted mt-2">The next player bidding will appear here in real-time.</p>
                        <div className="pulse-anim mt-2" style={{fontSize: '3rem'}}>⏳</div>
                    </div>
                ) : (
                    <div className="auction-layout animate-fade-in">
                        {/* Player Info Card */}
                        <div className="card player-card animate-slide-up">
                            <div className="player-avatar animate-float">
                                {currentPlayer.name.charAt(0)}
                            </div>
                            <h2>{currentPlayer.name}</h2>
                            <div className="status available mt-2">{currentPlayer.role}</div>
                            <p className="mt-2 text-muted">{currentPlayer.nationality}</p>
                            <div className="mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <p>Base Price: <strong style={{ color: 'white' }}>Rs {currentPlayer.base_price.toLocaleString()}</strong></p>
                            </div>
                            <img src="/assets/live_auction_bidding_1780909276215.png" alt="Live Bidding" style={{ width: '100%', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid var(--border)', objectFit: 'cover', height: '150px' }} />
                        </div>

                        {/* Bidding Controls & History */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Bid Dashboard Card */}
                            <div className="card text-center animate-slide-in-right">
                                <h3>Current Bid</h3>
                                <h1 style={{fontSize: '3rem', color: 'var(--accent)', margin: '0.5rem 0'}}>
                                    Rs {currentBid.toLocaleString()}
                                </h1>
                                <p style={{ fontSize: '1.1rem' }}>
                                    Winning: {winningTeam !== 'None' ? (
                                        <strong style={{ color: isWinning ? 'var(--secondary)' : 'white' }}>
                                            {winningTeam} {isWinning && "(You)"}
                                        </strong>
                                    ) : (
                                        <span className="text-muted">None</span>
                                    )}
                                </p>

                                {winningTeam !== 'None' && (
                                    <div className="mt-2">
                                        {isWinning ? (
                                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', border: '1px solid var(--secondary)', padding: '0.5rem', borderRadius: '8px', fontWeight: 'bold' }}>
                                                🏆 You are currently the highest bidder!
                                            </div>
                                        ) : (
                                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '0.5rem', borderRadius: '8px', fontWeight: 'bold' }}>
                                                ⚠️ You are currently outbid!
                                            </div>
                                        )}
                                    </div>
                                )}

                                {showTimer && (
                                    <div className="timer-container animate-pulse" style={{ marginTop: '1.5rem', background: 'rgba(245, 158, 11, 0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--accent)' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: '1px' }}>COUNTDOWN ACTIVE</span>
                                        <div className="timer-circle" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', margin: '0.5rem auto' }}>
                                            {timerSeconds}s
                                        </div>
                                        <small className="text-muted">Player will be sold if no other bids are placed!</small>
                                    </div>
                                )}

                                {user?.role === 'owner' && (
                                    <div className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                        {/* Direct Bid Button */}
                                        <button 
                                            className="btn btn-primary pulse-anim" 
                                            style={{fontSize: '1.2rem', width: '100%', padding: '1rem'}}
                                            onClick={() => placeBid(nextMinBid)}
                                            disabled={!canAfford}
                                        >
                                            {!canAfford ? "Cannot Afford Next Bid" : `Bid Minimum: Rs ${nextMinBid.toLocaleString()}`}
                                        </button>

                                        {/* Custom Bid Input */}
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                                            <input 
                                                type="number" 
                                                value={customBid}
                                                onChange={(e) => setCustomBid(e.target.value)}
                                                placeholder={`Min: Rs ${nextMinBid}`}
                                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1rem', width: '100%', flex: 1 }}
                                            />
                                            <button 
                                                className="btn btn-success" 
                                                style={{ padding: '0.8rem 1.2rem' }}
                                                onClick={() => placeBid(customBid)}
                                                disabled={!canAfford || customBid < nextMinBid}
                                            >
                                                Bid Custom
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Live Bid Feed Card */}
                            <div className="card animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
                                <h3>Live Bid Feed</h3>
                                <div style={{ maxHeight: '180px', overflowY: 'auto', marginTop: '1rem', paddingRight: '0.5rem' }}>
                                    {bidHistory.slice().reverse().map((bid, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ fontWeight: '500' }}>
                                                {bid.owner_name || bid.team_name} Owner
                                            </span>
                                            <strong style={{ color: 'var(--secondary)' }}>
                                                Rs {bid.amount.toLocaleString()}
                                            </strong>
                                        </div>
                                    ))}
                                    {bidHistory.length === 0 && (
                                        <p className="text-center text-muted" style={{ padding: '1rem 0' }}>No bids placed yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Owner Squad Tracking Section */}
                {user?.role === 'owner' && (
                    <div className="card mt-2 animate-slide-up" style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ fontFamily: 'Outfit', color: 'var(--primary)', marginBottom: '1.2rem' }}>
                            My Team's Squad ({squad.length + (ownerTeam?.captain_name ? 1 : 0)} Members)
                        </h3>
                        {squad.length === 0 && !ownerTeam?.captain_name ? (
                            <p className="text-center text-muted" style={{ padding: '2rem 0' }}>No players purchased yet.</p>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Nationality</th>
                                            <th>Base Price</th>
                                            <th>Final Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ownerTeam?.captain_name && (
                                            <tr style={{ borderBottom: '2px solid rgba(244,160,28,0.3)' }}>
                                                <td style={{ fontWeight: 'bold', color: 'white' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <span style={{ background: 'var(--accent)', color: '#000', fontWeight: 'bold', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>C</span>
                                                        {ownerTeam.captain_name}
                                                    </span>
                                                </td>
                                                <td>Captain</td>
                                                <td>-</td>
                                                <td>-</td>
                                                <td style={{ color: 'var(--text-muted)' }}>-</td>
                                            </tr>
                                        )}
                                        {squad.map(p => (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: '500' }}>{p.name}</td>
                                                <td>{p.role}</td>
                                                <td>{p.nationality}</td>
                                                <td>Rs {p.base_price?.toLocaleString()}</td>
                                                <td style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>
                                                    Rs {p.final_price?.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
