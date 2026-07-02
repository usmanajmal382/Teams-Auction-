import { useState, useEffect } from 'react';
import { apiCall, getUser, API_URL } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [soldPrice, setSoldPrice] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [csvFile, setCsvFile] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [pwCurrent, setPwCurrent] = useState('');
    const [pwNew, setPwNew] = useState('');
    const [pwMsg, setPwMsg] = useState('');
    const [pwError, setPwError] = useState('');
    const [teamBudgets, setTeamBudgets] = useState({});
    const [budgetSaving, setBudgetSaving] = useState({});
    const [budgetMsg, setBudgetMsg] = useState({});
    // Retained players state
    const [retainTeamId, setRetainTeamId] = useState('');
    const [retainName, setRetainName] = useState('');
    const [retainRole, setRetainRole] = useState('Batsman');
    const [retainFee, setRetainFee] = useState('');
    const [retainMsg, setRetainMsg] = useState('');
    const [retainLoading, setRetainLoading] = useState(false);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const playersData = await apiCall('/players');
            const teamsData = await apiCall('/teams');
            const historyData = await apiCall('/auction/history');
            setPlayers(playersData);
            setTeams(teamsData);
            setHistory(historyData);
        } catch (e) {
            console.error("Error loading data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const user = getUser();
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        loadData();
    }, [navigate]);

    // Determine current player up for auction
    const availablePlayers = players.filter(p => p.status === 'available');
    const curPlayer = availablePlayers.find(p => p.id === selectedPlayerId) || availablePlayers[0] || null;

    // Reset inputs when active player changes
    useEffect(() => {
        if (curPlayer) {
            setSoldPrice(curPlayer.base_price.toString());
            setSelectedTeamId('');
            setPhotoFile(null);
        } else {
            setSoldPrice('');
            setSelectedTeamId('');
            setPhotoFile(null);
        }
    }, [curPlayer?.id]);

    const handleSold = async (e) => {
        e.preventDefault();
        if (!curPlayer) return;
        if (!selectedTeamId) {
            alert("Please select a winning team.");
            return;
        }
        const price = parseFloat(soldPrice);
        if (isNaN(price) || price < curPlayer.base_price) {
            alert(`Sold price must be a number greater than or equal to the base price of Rs ${curPlayer.base_price.toLocaleString()}.`);
            return;
        }

        const targetTeam = teams.find(t => t.id === parseInt(selectedTeamId));
        if (!targetTeam) return;
        if (price > targetTeam.remaining_budget) {
            alert(`Insufficient budget! ${targetTeam.name} only has Rs ${targetTeam.remaining_budget.toLocaleString()} remaining.`);
            return;
        }

        try {
            await apiCall(`/auction/sold/${curPlayer.id}`, {
                method: 'POST',
                body: JSON.stringify({
                    team_id: parseInt(selectedTeamId),
                    final_price: price
                })
            });
            // Reset selected override and refresh lists
            setSelectedPlayerId(null);
            await loadData();
            alert(`${curPlayer.name} sold to ${targetTeam.name} for Rs ${price.toLocaleString()}!`);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUnsold = async () => {
        if (!curPlayer) return;
        try {
            await apiCall(`/auction/unsold/${curPlayer.id}`, {
                method: 'POST'
            });
            // Reset selected override and refresh lists
            setSelectedPlayerId(null);
            await loadData();
            alert(`${curPlayer.name} marked as Unsold.`);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleReset = async () => {
        setShowResetConfirm(false);
        try {
            await apiCall('/auction/reset', { 
                method: 'POST',
                body: JSON.stringify({})
            });
            setSelectedPlayerId(null);
            await loadData();
            alert("Auction reset successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePhotoUpload = async (e) => {
        e.preventDefault();
        if (!curPlayer || !photoFile) return;

        setPhotoUploading(true);
        const formData = new FormData();
        formData.append('file', photoFile);

        try {
            const res = await apiCall(`/players/${curPlayer.id}/photo`, {
                method: 'POST',
                body: formData
            });
            // Update photo URL locally
            setPlayers(prev => prev.map(p => p.id === curPlayer.id ? { ...p, photo_url: res.photo_url } : p));
            setPhotoFile(null);
            alert("Photo uploaded successfully!");
        } catch (err) {
            alert(err.message);
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleDeleteAllPlayers = async () => {
        if (!window.confirm("Are you sure you want to delete ALL players? This action cannot be undone.")) return;
        try {
            const res = await apiCall('/players/all', {
                method: 'DELETE'
            });
            alert(res.message);
            await loadData();
        } catch (err) {
            console.error("Delete players error:", err);
            let msg = err.message;
            if (typeof msg === 'object') msg = JSON.stringify(msg);
            alert('Failed to delete players: ' + msg);
        }
    };

    const handleCsvUpload = async (e) => {
        e.preventDefault();
        if (!csvFile) return;

        const formData = new FormData();
        formData.append('file', csvFile);

        try {
            const res = await apiCall('/players/upload', {
                method: 'POST',
                body: formData
            });
            alert(res.message);
            setCsvFile(null);
            await loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAssignCaptain = async (teamId, captainName) => {
        try {
            await apiCall(`/teams/${teamId}/captain`, {
                method: 'POST',
                body: JSON.stringify({ captain_name: captainName || null })
            });
            await loadData();
        } catch (err) {
            alert('Failed to set captain: ' + err.message);
        }
    };

    // Helper to get role badge class
    const getRoleClass = (role = '') => {
        const r = role.toLowerCase();
        if (r.includes('batsman')) return 'batsman';
        if (r.includes('bowler')) return 'bowler';
        if (r.includes('all-rounder')) return 'all-rounder';
        if (r.includes('keeper')) return 'wicket-keeper';
        return '';
    };

    const handleDownloadPdf = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/auction/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Server error ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'PCL_Auction_Results.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('PDF download failed: ' + err.message);
        }
    };

    return (
        <div className="container">
            <div className="flex-responsive animate-fade-in" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #F4A01C, #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Outfit', fontWeight: '800' }}>
                        Auction Control Center
                    </h1>
                    <p className="text-muted">Run and record verbal room bidding for the live cricket auction</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleDownloadPdf}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                    >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Download PDF Results
                    </button>
                    {showResetConfirm ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 'bold' }}>Confirm Reset?</span>
                            <button className="btn btn-danger" onClick={handleReset} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                                Yes, Reset
                            </button>
                            <button className="btn" onClick={() => setShowResetConfirm(false)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12"/></svg>
                            Reset Auction
                        </button>
                    )}
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                    Updating dashboard...
                </div>
            )}

            <div className="grid-2">
                {/* LEFT SIDE: Current Player up for auction & Auction History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Current Player Card — Premium Redesign */}
                    <div className="card animate-slide-up" style={{
                        borderLeft: '4px solid var(--primary)',
                        background: 'linear-gradient(135deg, rgba(10,22,40,0.98) 0%, rgba(15,30,55,0.95) 100%)',
                        overflow: 'hidden',
                        position: 'relative',
                        padding: 0
                    }}>
                        {/* Decorative glow background */}
                        <div style={{
                            position: 'absolute', top: '-60px', right: '-60px',
                            width: '220px', height: '220px',
                            background: 'radial-gradient(circle, rgba(26,75,140,0.35) 0%, transparent 70%)',
                            borderRadius: '50%', pointerEvents: 'none'
                        }} />
                        <div style={{
                            position: 'absolute', bottom: '-40px', left: '-40px',
                            width: '180px', height: '180px',
                            background: 'radial-gradient(circle, rgba(244,160,28,0.08) 0%, transparent 70%)',
                            borderRadius: '50%', pointerEvents: 'none'
                        }} />

                        {/* Header Banner */}
                        <div style={{
                            background: 'linear-gradient(90deg, var(--primary) 0%, #1a4b8c 100%)',
                            padding: '0.75rem 1.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexWrap: 'wrap', gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: curPlayer ? '#22c55e' : '#6b7280',
                                    boxShadow: curPlayer ? '0 0 8px #22c55e' : 'none',
                                    display: 'inline-block', animation: curPlayer ? 'pulse 1.5s infinite' : 'none'
                                }} />
                                <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'white' }}>
                                    Currently Up for Auction
                                </span>
                            </div>
                            {curPlayer && (
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                    Lot #{curPlayer.id}
                                </span>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                        {curPlayer ? (
                            <div>
                                {/* Top Section: Avatar + Core Info */}
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>

                                    {/* Player Avatar */}
                                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '110px', height: '110px',
                                            borderRadius: '16px',
                                            background: 'linear-gradient(135deg, #1a4b8c, #0a1628)',
                                            border: '2px solid var(--accent)',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            boxShadow: '0 8px 32px rgba(244,160,28,0.2)'
                                        }}>
                                            {curPlayer.photo_url ? (
                                                <img src={curPlayer.photo_url} alt={curPlayer.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{
                                                    width: '100%', height: '100%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '2.5rem', fontFamily: 'Outfit', fontWeight: 900,
                                                    color: 'var(--accent)',
                                                    background: 'linear-gradient(135deg, rgba(26,75,140,0.3), rgba(10,22,40,0.8))'
                                                }}>
                                                    {curPlayer.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        {/* Photo upload */}
                                        <form onSubmit={handlePhotoUpload} style={{ textAlign: 'center', width: '110px' }}>
                                            <label style={{
                                                display: 'block', fontSize: '0.65rem',
                                                color: 'var(--text-muted)', marginBottom: '0.2rem', cursor: 'pointer'
                                            }}>
                                                📷 {curPlayer.photo_url ? 'Replace' : 'Upload Photo'}
                                            </label>
                                            <input type="file" accept="image/*"
                                                onChange={e => setPhotoFile(e.target.files[0])}
                                                style={{ display: 'none' }} id="photo-upload-input" />
                                            <label htmlFor="photo-upload-input" style={{
                                                display: 'block', fontSize: '0.65rem',
                                                background: 'rgba(255,255,255,0.06)', border: '1px dashed var(--border)',
                                                borderRadius: '4px', padding: '0.25rem', cursor: 'pointer',
                                                color: 'var(--text-muted)', textAlign: 'center'
                                            }}>
                                                {photoFile ? photoFile.name.slice(0, 12) + '...' : 'Choose file'}
                                            </label>
                                            {photoFile && (
                                                <button type="submit" className="btn btn-primary"
                                                    style={{ width: '100%', padding: '0.25rem', fontSize: '0.65rem', marginTop: '0.25rem' }}
                                                    disabled={photoUploading}>
                                                    {photoUploading ? '⏳' : '✓ Upload'}
                                                </button>
                                            )}
                                        </form>
                                    </div>

                                    {/* Core Info */}
                                    <div style={{ flex: 1, minWidth: '180px' }}>
                                        <div style={{ marginBottom: '0.4rem' }}>
                                            <h3 style={{
                                                fontFamily: 'Outfit', fontSize: 'clamp(1.3rem, 3vw, 1.9rem)',
                                                fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '0.4rem'
                                            }}>{curPlayer.name}</h3>
                                        </div>

                                        {/* Badges row */}
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                            <span className={`badge-role ${getRoleClass(curPlayer.role)}`}
                                                style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                                🏏 {curPlayer.role}
                                            </span>
                                            {curPlayer.nationality && (
                                                <span style={{
                                                    background: 'rgba(255,255,255,0.08)', color: '#cbd5e1',
                                                    padding: '0.2rem 0.6rem', borderRadius: '20px',
                                                    fontSize: '0.72rem', border: '1px solid rgba(255,255,255,0.12)'
                                                }}>
                                                    🌍 {curPlayer.nationality}
                                                </span>
                                            )}
                                            {curPlayer.age && (
                                                <span style={{
                                                    background: 'rgba(255,255,255,0.08)', color: '#cbd5e1',
                                                    padding: '0.2rem 0.6rem', borderRadius: '20px',
                                                    fontSize: '0.72rem', border: '1px solid rgba(255,255,255,0.12)'
                                                }}>
                                                    🎂 Age {curPlayer.age}
                                                </span>
                                            )}
                                        </div>

                                        {/* Base price highlight */}
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                            background: 'linear-gradient(90deg, rgba(244,160,28,0.15), rgba(244,160,28,0.05))',
                                            border: '1px solid rgba(244,160,28,0.3)',
                                            borderRadius: '10px', padding: '0.5rem 1rem'
                                        }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base Price</span>
                                            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent)' }}>
                                                Rs {curPlayer.base_price?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Section */}
                                {curPlayer.stats && (
                                    <div style={{
                                        background: 'rgba(0,0,0,0.25)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.5rem' }}>
                                            📊 Player Stats
                                        </div>
                                        <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                                            {curPlayer.stats}
                                        </p>
                                    </div>
                                )}

                                {/* Divider */}
                                <div style={{ height: '1px', background: 'linear-gradient(90deg, var(--accent), transparent)', marginBottom: '1.25rem', opacity: 0.3 }} />

                                {/* ── Record Bid Result ── */}
                                <div className="auction-card-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                            🔨 Record Bid Result
                                        </span>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    </div>

                                    <form onSubmit={handleSold} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                        {/* Team Chip Selector */}
                                        <div>
                                            <label style={{
                                                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.8px',
                                                textTransform: 'uppercase', color: 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'
                                            }}>
                                                <span style={{ color: 'var(--accent)' }}>🏆</span> Winning Team
                                                {selectedTeamId && (
                                                    <span style={{ marginLeft: 'auto', color: 'var(--secondary)', fontSize: '0.68rem', fontWeight: 600 }}>
                                                        ✓ Selected
                                                    </span>
                                                )}
                                            </label>
                                            <div className="team-chip-grid">
                                                {teams.map(t => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        className={`team-chip ${String(selectedTeamId) === String(t.id) ? 'selected' : ''}`}
                                                        onClick={() => setSelectedTeamId(t.id)}
                                                    >
                                                        <span className="team-chip-name">{t.name}</span>
                                                        <span className="team-chip-purse">Rs {t.remaining_budget?.toLocaleString()}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Hidden required input for form validation */}
                                            <input
                                                type="text"
                                                value={selectedTeamId}
                                                required
                                                readOnly
                                                style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
                                            />
                                        </div>

                                        {/* Price Stepper */}
                                        <div>
                                            <label style={{
                                                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.8px',
                                                textTransform: 'uppercase', color: 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'
                                            }}>
                                                <span style={{ color: 'var(--accent)' }}>Rs </span> Final Sold Price
                                                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                                                    Min Rs {curPlayer.base_price?.toLocaleString()}
                                                </span>
                                            </label>
                                            <div className="price-stepper">
                                                <button type="button" className="price-stepper-btn"
                                                    onClick={() => setSoldPrice(v => Math.max(curPlayer.base_price, (parseInt(v)||0) - 1000))}>
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    value={soldPrice}
                                                    onChange={e => setSoldPrice(e.target.value)}
                                                    placeholder={`${curPlayer.base_price}`}
                                                    required
                                                    min={curPlayer.base_price}
                                                />
                                                <button type="button" className="price-stepper-btn"
                                                    onClick={() => setSoldPrice(v => (parseInt(v)||curPlayer.base_price) + 1000)}>
                                                    +
                                                </button>
                                            </div>
                                            {/* Quick Increment chips */}
                                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                {[1000, 2000, 5000, 10000].map(amt => (
                                                    <button key={amt} type="button"
                                                        onClick={() => setSoldPrice(v => (parseInt(v) || curPlayer.base_price) + amt)}
                                                        style={{
                                                            background: 'rgba(244,160,28,0.08)',
                                                            border: '1px solid rgba(244,160,28,0.2)',
                                                            borderRadius: '6px', color: 'var(--accent)',
                                                            fontSize: '0.7rem', fontWeight: 700,
                                                            padding: '0.2rem 0.5rem', cursor: 'pointer',
                                                            transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={e => e.target.style.background = 'rgba(244,160,28,0.2)'}
                                                        onMouseLeave={e => e.target.style.background = 'rgba(244,160,28,0.08)'}
                                                    >+{(amt/1000)}K</button>
                                                ))}
                                                <button type="button"
                                                    onClick={() => setSoldPrice(curPlayer.base_price)}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '6px', color: 'var(--text-muted)',
                                                        fontSize: '0.7rem', padding: '0.2rem 0.5rem',
                                                        cursor: 'pointer'
                                                    }}>Reset</button>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                                            <button type="submit" style={{
                                                padding: '0.9rem',
                                                background: 'linear-gradient(90deg, #059669, #10b981)',
                                                border: 'none', borderRadius: '12px',
                                                color: 'white', fontWeight: 800, fontSize: '1rem',
                                                cursor: 'pointer', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                                                transition: 'all 0.2s',
                                                fontFamily: 'Outfit'
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.45)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.3)'; }}
                                            >
                                                🏆 SOLD
                                            </button>
                                            <button type="button" onClick={handleUnsold} style={{
                                                padding: '0.9rem',
                                                background: 'linear-gradient(90deg, #991b1b, #ef4444)',
                                                border: 'none', borderRadius: '12px',
                                                color: 'white', fontWeight: 800, fontSize: '0.88rem',
                                                cursor: 'pointer', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                                                boxShadow: '0 4px 20px rgba(239,68,68,0.25)',
                                                transition: 'all 0.2s',
                                                fontFamily: 'Outfit'
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(239,68,68,0.4)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(239,68,68,0.25)'; }}
                                            >
                                                ✕ UNSOLD
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginBottom: '1rem', opacity: 0.5 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>All players have been auctioned!</p>
                                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Upload a new player CSV, or click the Reset button to start again.</p>
                            </div>
                        )}
                        </div>{/* end padding wrapper */}
                    </div>

                    {/* Completed Sales History */}
                    <div className="card">
                        <img src="/assets/home_cricket_auction_1780909121104.png" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border)' }} alt="History" />
                        <h3>Completed Auction History</h3>
                        <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {history.length === 0 ? (
                                <p className="text-muted" style={{ padding: '1rem 0', textAlign: 'center' }}>No completed sales yet.</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Player</th>
                                            <th>Status</th>
                                            <th>Sold To</th>
                                            <th>Price</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600' }}>{h.player_name}</td>
                                                <td>
                                                    <span className={`status ${h.status}`}>
                                                        {h.status}
                                                    </span>
                                                </td>
                                                <td>{h.team_name}</td>
                                                <td style={{ fontWeight: 'bold', color: h.status === 'sold' ? 'var(--secondary)' : 'var(--text-muted)' }}>
                                                    {h.price ? `Rs ${h.price.toLocaleString()}` : '-'}
                                                </td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {h.time ? new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Upcoming Player Queue & CSV File Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Player Queue Card */}
                    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <img src="/assets/cricket_players_queue_1780909303760.png" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border)' }} alt="Queue" />
                        <h3>Auction Queue ({availablePlayers.length} remaining)</h3>
                        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Sequential flow is automatic. Or click any player to prioritize them as current.
                        </p>

                        <div className="auction-queue-list" style={{ flex: 1, maxHeight: '420px' }}>
                            {availablePlayers.map((p, index) => {
                                const isCurrent = curPlayer && curPlayer.id === p.id;
                                return (
                                    <div 
                                        key={p.id} 
                                        className={`queue-item ${isCurrent ? 'active' : ''}`}
                                        onClick={() => setSelectedPlayerId(p.id)}
                                    >
                                        <div>
                                            <strong style={{ color: 'white' }}>{index + 1}. {p.name}</strong>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                {p.role} {p.age ? `• Age ${p.age}` : ''}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                                                Rs {p.base_price?.toLocaleString()}
                                            </span>
                                            {isCurrent && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '0.2rem' }}>
                                                    ACTIVE
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {availablePlayers.length === 0 && (
                                <p className="text-muted" style={{ padding: '2rem 0', textAlign: 'center' }}>No players remaining in the queue.</p>
                            )}
                        </div>
                    </div>

                    {/* CSV Upload Card */}
                    <div className="card">
                        <img src="/assets/admin_csv_upload.png" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border)' }} alt="CSV Upload" />
                        <h3>Upload Players CSV</h3>
                        <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0.25rem 0 1rem' }}>
                            Upload a `.csv` file. Required columns: <code>name, age, role, base_price, stats, photo_url</code>.
                        </p>

                        <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                                type="file" 
                                accept=".csv"
                                onChange={e => setCsvFile(e.target.files[0])}
                                required
                                style={{ color: 'white', display: 'block', fontSize: '0.85rem' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Upload and Queue Players
                            </button>
                        </form>
                        
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <button 
                                onClick={handleDeleteAllPlayers} 
                                className="btn btn-danger" 
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                Delete All Players
                            </button>
                            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
                                Caution: This will remove all players and reset teams' spent budgets.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL WIDTH BOTTOM: Teams Dashboard (8 Teams side-by-side) */}
            <div className="card mt-2 animate-slide-up" style={{ marginTop: '3rem', position: 'relative' }}>
                <style>{`
                    .team-card-premium {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        border: 1px solid rgba(255,255,255,0.05);
                        position: relative;
                        overflow: hidden;
                    }
                    .team-card-premium:hover {
                        transform: translateY(-5px);
                        border-color: rgba(244,160,28,0.4);
                        box-shadow: 0 10px 30px rgba(244,160,28,0.15);
                    }
                    .squad-member-animated {
                        animation: slideInRight 0.4s ease-out forwards;
                        padding: 0.5rem 0.75rem;
                        border-radius: 6px;
                        background: rgba(255,255,255,0.02);
                        margin-bottom: 0.4rem;
                        transition: all 0.2s;
                        border: 1px solid transparent;
                    }
                    .squad-member-animated:hover {
                        background: rgba(244,160,28,0.08);
                        border-color: rgba(244,160,28,0.2);
                        transform: translateX(4px);
                    }
                    @keyframes slideInRight {
                        from { opacity: 0; transform: translateX(10px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    .role-icon {
                        font-size: 0.75rem;
                        margin-right: 0.4rem;
                        opacity: 0.8;
                    }
                `}</style>
                <img src="/assets/cricket_teams_banner_1780909290251.png" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border)' }} alt="Teams" />
                <h2 style={{ fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--secondary)' }}>█</span> Teams Dashboard
                </h2>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Squad lists and budgets update automatically</p>

                <div className="teams-grid">
                    {teams.map(t => {
                        const squad = players.filter(p => p.sold_to_team_id === t.id && (p.status === 'sold' || p.status === 'retained'));
                        const retainedInSquad = squad.filter(p => p.status === 'retained');
                        const soldInSquad = squad.filter(p => p.status === 'sold');
                        const spent = t.total_budget - t.remaining_budget;
                        const spentPercent = Math.min(100, Math.max(0, (spent / t.total_budget) * 100));

                        return (
                            <div key={t.id} className="card team-card-premium" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.4)' }}>
                                <div className="team-card-bg">
                                    <img src="/assets/cricket_teams_banner_1780909290251.png" alt="" />
                                </div>
                                <div className="team-card-content">
                                    <h3 style={{ fontSize: '1.2rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                        {t.name}
                                    </h3>
                                    
                                    <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <div className="flex-between" style={{ fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Purse Left:</span>
                                            <strong style={{ color: 'var(--secondary)', fontSize: '1.05rem', textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>
                                                Rs {t.remaining_budget?.toLocaleString()}
                                            </strong>
                                        </div>
                                        <div className="flex-between" style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                                            <span>Spent: <span style={{color:'white'}}>Rs {spent?.toLocaleString()}</span></span>
                                            <span>Total: <span style={{color:'white'}}>Rs {t.total_budget?.toLocaleString()}</span></span>
                                        </div>
                                        <div className="budget-bar" style={{ marginTop: '0.5rem', height: '6px' }}>
                                            <div className="budget-fill" style={{ width: `${spentPercent}%`, background: spentPercent > 90 ? 'var(--danger)' : 'var(--secondary)', boxShadow: `0 0 8px ${spentPercent > 90 ? 'var(--danger)' : 'var(--secondary)'}` }}></div>
                                        </div>
                                    </div>

                                    {/* Captain Assignment */}
                                    <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.04)', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Captain</div>
                                        {t.captain_name ? (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ background: 'var(--accent)', color: '#000', fontWeight: 'bold', fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '4px', boxShadow: '0 0 5px rgba(244,160,28,0.5)' }}>C</span>
                                                    <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>{t.captain_name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleAssignCaptain(t.id, '')}
                                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '4px', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', padding: '0.1rem 0.4rem' }}
                                                    title="Remove Captain"
                                                >✕</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Enter captain name..."
                                                    id={`captain-input-${t.id}`}
                                                    style={{
                                                        fontSize: '0.78rem',
                                                        padding: '0.3rem 0.5rem',
                                                        flex: 1,
                                                        background: 'rgba(0,0,0,0.4)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '6px',
                                                        color: '#ffffff',
                                                        outline: 'none'
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.target.value.trim();
                                                            if (val) handleAssignCaptain(t.id, val);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', whiteSpace: 'nowrap' }}
                                                    onClick={() => {
                                                        const el = document.getElementById(`captain-input-${t.id}`);
                                                        if (el && el.value.trim()) handleAssignCaptain(t.id, el.value.trim());
                                                    }}
                                                >Set</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="team-squad-list" style={{ marginTop: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Squad Players</span>
                                            <span style={{ color: 'var(--accent)' }}>{squad.length + (t.captain_name ? 1 : 0)} / 15</span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            {t.captain_name && (
                                                <div className="squad-member-animated flex-between" style={{ borderLeft: '3px solid var(--accent)' }}>
                                                    <span style={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                                                        <span style={{ background: 'var(--accent)', color: '#000', fontWeight: 'bold', fontSize: '0.6rem', padding: '0.05rem 0.3rem', borderRadius: '4px' }}>C</span>
                                                        {t.captain_name}
                                                    </span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Retained</span>
                                                </div>
                                            )}
                                            {retainedInSquad.map((p, idx) => (
                                                <div key={p.id} className="squad-member-animated flex-between" style={{ borderLeft: '3px solid #F4A01C', animationDelay: `${idx * 0.05}s` }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                                                        <span style={{ background: '#F4A01C', color: '#000', fontWeight: '800', fontSize: '0.55rem', padding: '0.05rem 0.3rem', borderRadius: '3px', flexShrink: 0 }}>RET</span>
                                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', fontSize: '0.85rem', color: '#e2e8f0' }}>{p.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 'bold', color: '#F4A01C', fontSize: '0.8rem' }}>Rs {(p.final_price/1000).toFixed(0)}k</span>
                                                </div>
                                            ))}
                                            {soldInSquad.map((p, idx) => (
                                                <div key={p.id} className="squad-member-animated flex-between" style={{ animationDelay: `${idx * 0.05}s` }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                                        <span className="role-icon">
                                                            {p.role.toLowerCase().includes('bat') ? '🏏' : 
                                                             p.role.toLowerCase().includes('bowl') ? '🎯' : 
                                                             p.role.toLowerCase().includes('keep') ? '🧤' : '⚡'}
                                                        </span>
                                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px', fontSize: '0.85rem', color: '#e2e8f0' }}>
                                                            {p.name}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                                                        Rs {(p.final_price/1000).toFixed(0)}k
                                                    </span>
                                                </div>
                                            ))}
                                            {squad.length === 0 && !t.captain_name && (
                                                <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                                    No players bought yet
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CHANGE PASSWORD SECTION */}
            <div className="card" style={{ marginTop: '2rem', border: '1px solid rgba(244,160,28,0.2)', borderLeft: '4px solid #F4A01C' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔑 Change Admin Password
                </h3>
                {pwMsg && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--secondary)', borderRadius: '8px', padding: '0.6rem 1rem', color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>✅ {pwMsg}</div>}
                {pwError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '0.6rem 1rem', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>❌ {pwError}</div>}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Password</label>
                        <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)}
                            placeholder="Enter current password"
                            style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(244,160,28,0.2)' }} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>New Password</label>
                        <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)}
                            placeholder="Min 6 characters"
                            style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(244,160,28,0.2)' }} />
                    </div>
                    <button className="btn btn-primary" style={{ padding: '0.6rem 1.4rem', whiteSpace: 'nowrap' }}
                        onClick={async () => {
                            setPwMsg(''); setPwError('');
                            if (!pwCurrent || !pwNew) { setPwError('Both fields required'); return; }
                            try {
                                const res = await apiCall('/auth/change-password', {
                                    method: 'PUT',
                                    body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew })
                                });
                                setPwMsg(res.message);
                                setPwCurrent(''); setPwNew('');
                            } catch (err) { setPwError(err.message); }
                        }}>
                        Update Password
                    </button>
                </div>
            </div>

            {/* PRE-AUCTION BUDGET SETUP SECTION */}
            <div className="card" style={{ marginTop: '2rem', border: '1px solid rgba(16,185,129,0.2)', borderLeft: '4px solid #10b981' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💰 Pre-Auction Team Budget Setup
                </h3>
                <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1.4rem' }}>
                    Set each team's starting budget before the auction begins. Useful when teams have retained players whose fees need to be deducted upfront.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    {teams.map(t => {
                        const currentVal = teamBudgets[t.id] !== undefined ? teamBudgets[t.id] : t.total_budget;
                        const msg = budgetMsg[t.id];
                        const saving = budgetSaving[t.id];
                        return (
                            <div key={t.id} style={{
                                background: 'rgba(16,185,129,0.04)',
                                border: '1px solid rgba(16,185,129,0.15)',
                                borderRadius: '10px',
                                padding: '0.9rem 1rem'
                            }}>
                                <div style={{ fontWeight: '700', color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {t.name}
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--secondary)', fontWeight: '700', fontSize: '0.85rem' }}>Rs</span>
                                    <input
                                        type="number"
                                        value={currentVal}
                                        min="0"
                                        onChange={e => setTeamBudgets(prev => ({ ...prev, [t.id]: parseFloat(e.target.value) || 0 }))}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(0,0,0,0.35)',
                                            border: '1px solid rgba(16,185,129,0.25)',
                                            borderRadius: '6px',
                                            color: 'white',
                                            padding: '0.35rem 0.5rem',
                                            fontSize: '0.85rem',
                                            outline: 'none',
                                            width: '100%'
                                        }}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap', opacity: saving ? 0.6 : 1 }}
                                        disabled={saving}
                                        onClick={async () => {
                                            setBudgetSaving(prev => ({ ...prev, [t.id]: true }));
                                            setBudgetMsg(prev => ({ ...prev, [t.id]: '' }));
                                            try {
                                                await apiCall(`/teams/${t.id}/budget`, {
                                                    method: 'PUT',
                                                    body: JSON.stringify({ total_budget: currentVal })
                                                });
                                                setBudgetMsg(prev => ({ ...prev, [t.id]: '✅ Saved' }));
                                                await loadData();
                                                setTimeout(() => setBudgetMsg(prev => ({ ...prev, [t.id]: '' })), 2500);
                                            } catch (err) {
                                                setBudgetMsg(prev => ({ ...prev, [t.id]: '❌ ' + err.message }));
                                            } finally {
                                                setBudgetSaving(prev => ({ ...prev, [t.id]: false }));
                                            }
                                        }}
                                    >{saving ? '...' : 'Save'}</button>
                                </div>
                                {msg && <div style={{ fontSize: '0.72rem', marginTop: '0.35rem', color: msg.startsWith('✅') ? 'var(--secondary)' : 'var(--danger)' }}>{msg}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RETAINED PLAYERS SETUP SECTION */}
            <div className="card" style={{ marginTop: '2rem', border: '1px solid rgba(244,160,28,0.25)', borderLeft: '4px solid #F4A01C' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏅 Retained Players Setup
                </h3>
                <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1.4rem' }}>
                    Manually add retained players per team. The retention fee is instantly deducted from that team's auction budget.
                </p>

                {/* Add Retained Player Form */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Team</label>
                        <select
                            value={retainTeamId}
                            onChange={e => setRetainTeamId(e.target.value)}
                            style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(244,160,28,0.3)', color: 'white', borderRadius: '8px', padding: '0.55rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                        >
                            <option value="">-- Select Team --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Player Name</label>
                        <input
                            type="text"
                            value={retainName}
                            onChange={e => setRetainName(e.target.value)}
                            placeholder="e.g. Babar Azam"
                            style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(244,160,28,0.2)' }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Role</label>
                        <select
                            value={retainRole}
                            onChange={e => setRetainRole(e.target.value)}
                            style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(244,160,28,0.2)', color: 'white', borderRadius: '8px', padding: '0.55rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                        >
                            <option value="Batsman">Batsman</option>
                            <option value="Bowler">Bowler</option>
                            <option value="All-Rounder">All-Rounder</option>
                            <option value="Wicket-Keeper">Wicket-Keeper</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Retention Fee (Rs)</label>
                        <input
                            type="number"
                            value={retainFee}
                            onChange={e => setRetainFee(e.target.value)}
                            placeholder="e.g. 20000"
                            min="0"
                            style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(244,160,28,0.2)' }}
                        />
                    </div>
                    <div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', opacity: retainLoading ? 0.6 : 1 }}
                            disabled={retainLoading}
                            onClick={async () => {
                                setRetainMsg('');
                                if (!retainTeamId || !retainName.trim() || !retainFee) {
                                    setRetainMsg('❌ Please fill all fields.');
                                    return;
                                }
                                setRetainLoading(true);
                                try {
                                    await apiCall(`/teams/${retainTeamId}/retain-player`, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            player_name: retainName.trim(),
                                            role: retainRole,
                                            retention_fee: parseFloat(retainFee)
                                        })
                                    });
                                    setRetainMsg(`✅ ${retainName.trim()} retained successfully!`);
                                    setRetainName(''); setRetainFee('');
                                    await loadData();
                                    setTimeout(() => setRetainMsg(''), 3000);
                                } catch (err) {
                                    setRetainMsg('❌ ' + err.message);
                                } finally {
                                    setRetainLoading(false);
                                }
                            }}
                        >
                            {retainLoading ? 'Adding...' : '+ Retain Player'}
                        </button>
                    </div>
                </div>
                {retainMsg && (
                    <div style={{ padding: '0.6rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', background: retainMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${retainMsg.startsWith('✅') ? 'var(--secondary)' : 'var(--danger)'}`, color: retainMsg.startsWith('✅') ? 'var(--secondary)' : 'var(--danger)' }}>
                        {retainMsg}
                    </div>
                )}

                {/* Retained Players per Team */}
                {teams.map(t => {
                    const retained = players.filter(p => p.sold_to_team_id === t.id && p.status === 'retained');
                    if (retained.length === 0) return null;
                    return (
                        <div key={t.id} style={{ marginBottom: '1rem', background: 'rgba(244,160,28,0.04)', border: '1px solid rgba(244,160,28,0.15)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: '700', color: '#F4A01C', fontSize: '0.9rem', marginBottom: '0.6rem' }}>
                                🏏 {t.name} — <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>Remaining: Rs {t.remaining_budget?.toLocaleString()}</span>
                            </div>
                            {retained.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', marginBottom: '0.3rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <span style={{ background: '#F4A01C', color: '#000', fontWeight: '800', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '4px', letterSpacing: '0.5px' }}>RETAINED</span>
                                        <span style={{ color: 'white', fontWeight: '600', fontSize: '0.88rem' }}>{p.name}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.role}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ color: 'var(--secondary)', fontWeight: '700', fontSize: '0.85rem' }}>Rs {p.final_price?.toLocaleString()}</span>
                                        <button
                                            onClick={async () => {
                                                if (!window.confirm(`Remove ${p.name} from retention?`)) return;
                                                try {
                                                    await apiCall(`/players/${p.id}/unretain`, { method: 'DELETE' });
                                                    await loadData();
                                                } catch (err) { alert(err.message); }
                                            }}
                                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '4px', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                        >Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
