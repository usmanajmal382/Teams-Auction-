import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, getUser } from '../utils/api';

export default function RetainedPlayers() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [retainTeamId, setRetainTeamId] = useState('');
    const [retainName, setRetainName] = useState('');
    const [retainRole, setRetainRole] = useState('Batsman');
    const [retainFee, setRetainFee] = useState('');
    const [retainLoading, setRetainLoading] = useState(false);
    const [retainMsg, setRetainMsg] = useState('');

    const loadData = async () => {
        try {
            const [teamsData, playersData] = await Promise.all([
                apiCall('/teams'),
                apiCall('/players')
            ]);
            setTeams(teamsData);
            setPlayers(playersData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUnretainPlayer = async (playerId) => {
        if (!window.confirm("Are you sure you want to remove this player? Their fee will be refunded to the team budget.")) return;
        try {
            await apiCall(`/players/${playerId}/unretain`, { method: 'DELETE' });
            await loadData();
        } catch (err) {
            alert('Failed to remove player: ' + err.message);
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

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(244,160,28,0.3)',
                boxShadow: '0 0 40px rgba(244,160,28,0.08), 0 20px 60px rgba(0,0,0,0.3)'
            }}>
                {/* Animated background */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(10,22,40,0.97) 0%, rgba(28,20,8,0.97) 50%, rgba(10,22,40,0.97) 100%)',
                    zIndex: 0
                }}/>
                <div style={{
                    position: 'absolute', top: '-80px', right: '-40px', width: '250px', height: '250px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(244,160,28,0.12) 0%, transparent 70%)',
                    animation: 'pulse 5s ease-in-out infinite', zIndex: 0
                }}/>
                <div style={{
                    position: 'absolute', bottom: '-50px', left: '5%', width: '180px', height: '180px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(244,160,28,0.07) 0%, transparent 70%)',
                    animation: 'pulse 7s ease-in-out infinite reverse', zIndex: 0
                }}/>
                <div style={{
                    position: 'absolute', top: '30%', left: '40%', width: '120px', height: '120px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(244,160,28,0.05) 0%, transparent 70%)',
                    animation: 'pulse 9s ease-in-out infinite', zIndex: 0
                }}/>
                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1, padding: '1.75rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #F4A01C, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', boxShadow: '0 0 20px rgba(244,160,28,0.5)'
                        }}>🏅</div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', color: 'white', margin: 0, fontWeight: '800', letterSpacing: '0.3px' }}>
                                Retained Players Setup
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(244,160,28,0.8)' }}>
                                Retention fee is instantly deducted from team's auction budget
                            </p>
                        </div>
                    </div>
                    <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(244,160,28,0.5), transparent)', margin: '1.5rem 0' }}/>

                    {loading ? (
                        <p style={{color: 'rgba(255,255,255,0.7)'}}>Loading data...</p>
                    ) : (
                        <>
                            {/* Form */}
                            <div style={{
                                background: 'rgba(244,160,28,0.05)',
                                border: '1px solid rgba(244,160,28,0.15)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                marginBottom: '2rem'
                            }}>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(244,160,28,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem' }}>
                                    ➕ Add Retained Player
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'rgba(244,160,28,0.7)', fontWeight: '600', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team</label>
                                        <select
                                            value={retainTeamId}
                                            onChange={e => setRetainTeamId(e.target.value)}
                                            style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(244,160,28,0.3)', color: 'white', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.9rem', width: '100%', outline: 'none' }}
                                        >
                                            <option value="">-- Select Team --</option>
                                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'rgba(244,160,28,0.7)', fontWeight: '600', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Player Name</label>
                                        <input
                                            type="text" value={retainName}
                                            onChange={e => setRetainName(e.target.value)}
                                            placeholder="e.g. Babar Azam"
                                            style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(244,160,28,0.25)', color: 'white', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.9rem', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                                            onFocus={e => e.target.style.borderColor='rgba(244,160,28,0.7)'}
                                            onBlur={e => e.target.style.borderColor='rgba(244,160,28,0.25)'}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'rgba(244,160,28,0.7)', fontWeight: '600', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
                                        <select
                                            value={retainRole}
                                            onChange={e => setRetainRole(e.target.value)}
                                            style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(244,160,28,0.25)', color: 'white', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.9rem', width: '100%', outline: 'none' }}
                                        >
                                            <option value="Batsman">🏏 Batsman</option>
                                            <option value="Bowler">🎯 Bowler</option>
                                            <option value="All-Rounder">⚡ All-Rounder</option>
                                            <option value="Wicket-Keeper">🧤 Wicket-Keeper</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'rgba(244,160,28,0.7)', fontWeight: '600', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Retention Fee (Rs)</label>
                                        <input
                                            type="number" value={retainFee}
                                            onChange={e => setRetainFee(e.target.value)}
                                            placeholder="e.g. 20000" min="0"
                                            style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(244,160,28,0.25)', color: 'white', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.9rem', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                                            onFocus={e => e.target.style.borderColor='rgba(244,160,28,0.7)'}
                                            onBlur={e => e.target.style.borderColor='rgba(244,160,28,0.25)'}
                                        />
                                    </div>
                                    <div>
                                        <button
                                            style={{
                                                width: '100%', padding: '0.65rem 1rem',
                                                background: retainLoading ? 'rgba(244,160,28,0.3)' : 'linear-gradient(135deg, #F4A01C, #d97706)',
                                                border: 'none', borderRadius: '8px',
                                                color: '#000', fontWeight: '800', fontSize: '0.9rem',
                                                cursor: retainLoading ? 'wait' : 'pointer',
                                                boxShadow: '0 0 16px rgba(244,160,28,0.4)',
                                                transition: 'all 0.25s', opacity: retainLoading ? 0.7 : 1,
                                                letterSpacing: '0.3px'
                                            }}
                                            disabled={retainLoading}
                                            onMouseEnter={e => { if(!retainLoading) { e.currentTarget.style.boxShadow='0 0 28px rgba(244,160,28,0.7)'; e.currentTarget.style.transform='translateY(-1px)'; }}}
                                            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 16px rgba(244,160,28,0.4)'; e.currentTarget.style.transform='translateY(0)'; }}
                                            onClick={async () => {
                                                setRetainMsg('');
                                                if (!retainTeamId || !retainName.trim() || !retainFee) { setRetainMsg('❌ Please fill all fields.'); return; }
                                                setRetainLoading(true);
                                                try {
                                                    await apiCall(`/teams/${retainTeamId}/retain-player`, {
                                                        method: 'POST',
                                                        body: JSON.stringify({ player_name: retainName.trim(), role: retainRole, retention_fee: parseFloat(retainFee) })
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
                                            {retainLoading ? '⏳ Adding...' : '+ Retain Player'}
                                        </button>
                                    </div>
                                </div>
                                {retainMsg && (
                                    <div style={{
                                        marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px',
                                        fontSize: '0.9rem', fontWeight: '600',
                                        background: retainMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        border: `1px solid ${retainMsg.startsWith('✅') ? '#10b981' : 'var(--danger)'}`,
                                        color: retainMsg.startsWith('✅') ? '#10b981' : 'var(--danger)'
                                    }}>
                                        {retainMsg}
                                    </div>
                                )}
                            </div>

                            {/* Retained Players per Team */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {teams.map(t => {
                                    const retained = players.filter(p => p.sold_to_team_id === t.id && p.status === 'retained');
                                    if (retained.length === 0) return null;
                                    return (
                                        <div key={t.id} style={{
                                            background: 'rgba(244,160,28,0.05)',
                                            border: '1px solid rgba(244,160,28,0.2)',
                                            borderRadius: '12px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                background: 'linear-gradient(90deg, rgba(244,160,28,0.15), transparent)',
                                                padding: '0.8rem 1rem',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                borderBottom: '1px solid rgba(244,160,28,0.1)'
                                            }}>
                                                <span style={{ fontWeight: '800', color: '#F4A01C', fontSize: '1rem' }}>
                                                    🏏 {t.name}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                                    Left: Rs {t.remaining_budget?.toLocaleString()}
                                                </span>
                                            </div>
                                            <div style={{ padding: '0.75rem 1rem' }}>
                                                {retained.map((p, idx) => (
                                                    <div key={p.id} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '0.6rem 0.75rem', borderRadius: '8px',
                                                        background: idx % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent',
                                                        borderBottom: idx === retained.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
                                                    }}>
                                                        <div>
                                                            <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{p.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#F4A01C', marginTop: '0.2rem' }}>Fee: Rs {p.final_price?.toLocaleString()}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUnretainPlayer(p.id)}
                                                            style={{
                                                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                                                color: '#ef4444', borderRadius: '6px', padding: '0.3rem 0.6rem',
                                                                fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                                                                display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor='#ef4444'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.3)'; }}
                                                        >
                                                            ✕ Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
