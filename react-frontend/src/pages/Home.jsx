import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiCall, getUser } from '../utils/api';

export default function Home() {
    const user = getUser();
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            const loadStatsData = async () => {
                setLoading(true);
                try {
                    const pData = await apiCall('/players');
                    const tData = await apiCall('/teams');
                    setPlayers(pData);
                    setTeams(tData);
                } catch (e) {
                    console.error("Failed to load statistics:", e);
                } finally {
                    setLoading(false);
                }
            };
            loadStatsData();
        }
    }, []);

    // Calculate Statistics
    const soldPlayers = players.filter(p => p.status === 'sold' && p.final_price);
    const mostExpensive = [...soldPlayers].sort((a, b) => b.final_price - a.final_price).slice(0, 5);
    
    const teamSpending = teams.map(t => {
        const spent = t.total_budget - t.remaining_budget;
        return { name: t.name, spent };
    }).sort((a, b) => b.spent - a.spent);

    const nationalityCount = players.reduce((acc, p) => {
        const nat = p.nationality || 'Unknown';
        acc[nat] = (acc[nat] || 0) + 1;
        return acc;
    }, {});

    const nationalityBreakdown = Object.entries(nationalityCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '5rem', position: 'relative' }}>

            {/* CRICKET FLOATING BACKGROUND ANIMATION */}
            {!user && (
                <>
                    <style>{`
                        @keyframes cricketFloat {
                            0%   { top: 105vh; opacity: 0;   transform: rotate(0deg) scale(0.8); }
                            5%   { opacity: 0.7; }
                            50%  { opacity: 0.5; transform: rotate(180deg) scale(1.1); }
                            95%  { opacity: 0.3; }
                            100% { top: -80px;  opacity: 0;   transform: rotate(360deg) scale(0.8); }
                        }
                        @keyframes cricketSway {
                            0%, 100% { margin-left: 0px; }
                            25%      { margin-left: 30px; }
                            75%      { margin-left: -20px; }
                        }
                        .ci {
                            position: fixed;
                            pointer-events: none;
                            z-index: 0;
                            animation: cricketFloat linear infinite, cricketSway ease-in-out infinite;
                            filter: drop-shadow(0 0 8px rgba(244,160,28,0.5));
                        }
                    `}</style>
                    {[
                        { icon: '🏏', left: '5%',  dur: 9,  delay: 0,   size: '2.2rem' },
                        { icon: '🏟️', left: '15%', dur: 12, delay: 2,   size: '1.8rem' },
                        { icon: '🏆', left: '25%', dur: 10, delay: 4,   size: '2rem'   },
                        { icon: '🏏', left: '35%', dur: 14, delay: 1,   size: '1.6rem' },
                        { icon: '⚡', left: '45%', dur: 8,  delay: 3,   size: '1.5rem' },
                        { icon: '🎯', left: '55%', dur: 11, delay: 5,   size: '2rem'   },
                        { icon: '🏏', left: '65%', dur: 13, delay: 0.5, size: '2.4rem' },
                        { icon: '🏆', left: '75%', dur: 9,  delay: 6,   size: '1.7rem' },
                        { icon: '🏟️', left: '82%', dur: 15, delay: 2.5, size: '2rem'   },
                        { icon: '⭐', left: '90%', dur: 10, delay: 4.5, size: '1.6rem' },
                        { icon: '🏏', left: '10%', dur: 16, delay: 7,   size: '1.9rem' },
                        { icon: '🎽', left: '50%', dur: 12, delay: 8,   size: '2.1rem' },
                        { icon: '🏆', left: '70%', dur: 11, delay: 1.5, size: '1.5rem' },
                        { icon: '🏏', left: '30%', dur: 13, delay: 9,   size: '2.3rem' },
                    ].map((item, i) => (
                        <span key={i} className="ci" style={{
                            left: item.left,
                            fontSize: item.size,
                            top: '105vh',
                            animationDuration: `${item.dur}s, ${item.dur * 1.5}s`,
                            animationDelay: `${item.delay}s, ${item.delay}s`,
                        }}>
                            {item.icon}
                        </span>
                    ))}
                </>
            )}

            {/* HERO SECTION */}
            <div className="grid-2" style={{ alignItems: 'center', marginTop: '2rem', position: 'relative', zIndex: 1 }}>
                <div className="animate-slide-up">
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '800', background: 'linear-gradient(to right, #F4A01C, #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.1', fontFamily: 'Outfit' }}>
                        PCL CRICKET<br />AUCTION ARENA
                    </h1>
                    <p className="text-muted" style={{ fontSize: '1.25rem', marginTop: '1rem', lineHeight: '1.6' }}>
                        Welcome to the official Pakistan Cricket League Auction Portal. Real-time bidding room, franchise squad tracker, and budget management.
                    </p>
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        {user ? (
                            <>
                                {user.role === 'admin' && <Link to="/admin" className="btn btn-primary">Go to Control Center</Link>}
                                {user.role === 'owner' && <Link to="/auction" className="btn btn-primary">Go to Live Bidding</Link>}
                                <Link to="/players" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>View Player Database</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-primary">Enter Bidding Arena</Link>
                                <Link to="/register" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>Register as Viewer</Link>
                            </>
                        )}
                    </div>
                </div>
                <div className="animate-float" style={{ display: 'flex', justifyContent: 'center' }}>
                    <img src="/assets/home_cricket_auction_1780909121104.png" alt="Cricket Stadium" className="hero-image" style={{ border: '2px solid rgba(244, 160, 28, 0.3)', boxShadow: '0 15px 35px rgba(244, 160, 28, 0.15)' }} />
                </div>
            </div>


            {/* SEASON ARCHIVE */}
            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: '#F4A01C', marginBottom: '1.5rem' }}>
                    <span style={{ marginRight: '0.5rem' }}>🏆</span> Season History & Archive
                </h2>
                <div className="grid-3">
                    <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                        <h4 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem' }}>Season 2026 (Active)</h4>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>The current season is underway. Follow teams and bid statuses live.</p>
                        <div style={{ fontSize: '0.85rem' }}>
                            <div><strong>Teams Registered:</strong> {teams.length || 'Loading...'}</div>
                            <div><strong>Players Drafted:</strong> {soldPlayers.length}</div>
                        </div>
                    </div>
                    <div className="card">
                        <h4 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem' }}>Season 2025 (Archive)</h4>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>A thrilling campaign dominated by the Sargodha Thunders.</p>
                        <div style={{ fontSize: '0.85rem' }}>
                            <div><strong>Champion:</strong> Sargodha Thunders</div>
                            <div><strong>Top Purchase:</strong> Babar Azam (₹18,000)</div>
                            <div><strong>Total Spend:</strong> ₹8,40,000</div>
                        </div>
                    </div>
                    <div className="card">
                        <h4 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem' }}>Season 2024 (Archive)</h4>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>The inaugural PCL season with high-intensity bidding wars.</p>
                        <div style={{ fontSize: '0.85rem' }}>
                            <div><strong>Champion:</strong> Karachi Kings</div>
                            <div><strong>Top Purchase:</strong> Shaheen Afridi (₹16,500)</div>
                            <div><strong>Total Spend:</strong> ₹7,90,000</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* STATISTICS SECTION */}
            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: '#F4A01C', marginBottom: '0.5rem' }}>
                    <span style={{ marginRight: '0.5rem' }}>📊</span> Tournament Statistics
                </h2>
                
                {user ? (
                    loading ? (
                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', padding: '2rem', textAlign: 'center' }}>Loading statistics data...</div>
                    ) : (
                        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
                            
                            {/* Most Expensive Players */}
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', color: 'white', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                    MOST EXPENSIVE BUYS
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {mostExpensive.map((p, idx) => (
                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{idx + 1}. {p.name}</span>
                                            <strong style={{ marginLeft: 'auto', color: '#F4A01C' }}>₹{p.final_price?.toLocaleString()}</strong>
                                        </div>
                                    ))}
                                    {mostExpensive.length === 0 && (
                                        <div className="text-muted" style={{ fontStyle: 'italic', textAlign: 'center' }}>No players sold yet in active season.</div>
                                    )}
                                </div>
                            </div>

                            {/* Top Spending Teams */}
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', color: 'white', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                    TEAM EXPENDITURE
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {teamSpending.map((t, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{t.name}</span>
                                            <strong style={{ marginLeft: 'auto', color: 'white' }}>₹{t.spent?.toLocaleString()}</strong>
                                        </div>
                                    ))}
                                    {teamSpending.length === 0 && (
                                        <div className="text-muted" style={{ fontStyle: 'italic', textAlign: 'center' }}>No teams registered.</div>
                                    )}
                                </div>
                            </div>

                            {/* Nationality Breakdown */}
                            <div className="card">
                                <h3 style={{ fontSize: '1.1rem', color: 'white', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                    NATIONALITY BREAKDOWN
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {nationalityBreakdown.slice(0, 5).map((n, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{n.name}</span>
                                            <strong style={{ marginLeft: 'auto', color: 'white' }}>{n.count} Players</strong>
                                        </div>
                                    ))}
                                    {nationalityBreakdown.length === 0 && (
                                        <div className="text-muted" style={{ fontStyle: 'italic', textAlign: 'center' }}>No players in database.</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )
                ) : (
                    <div className="card text-center" style={{ padding: '3rem 2rem', background: 'rgba(16, 29, 48, 0.4)' }}>
                        <p className="text-muted" style={{ fontSize: '1.1rem' }}>
                            Detailed statistics and analytics are restricted to registered users.
                        </p>
                        <div style={{ marginTop: '1.5rem' }}>
                            <Link to="/login" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>Login to View Stats</Link>
                        </div>
                    </div>
                )}
            </div>

            {/* DEVELOPER CREDIT */}
            <div style={{
                marginTop: '1rem',
                padding: '2rem',
                borderTop: '1px solid rgba(244, 160, 28, 0.15)',
                textAlign: 'center',
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'rgba(244, 160, 28, 0.06)',
                    border: '1px solid rgba(244, 160, 28, 0.2)',
                    borderRadius: '50px',
                    padding: '0.6rem 1.5rem',
                }}>
                    <span style={{ fontSize: '1rem' }}>⚡</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Designed &amp; Developed by
                    </span>
                    <span style={{
                        color: '#F4A01C',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        fontFamily: 'Outfit',
                        letterSpacing: '0.5px',
                    }}>
                        Usman Ajmal
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>|</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        PCL Auction Platform © 2026
                    </span>
                </div>
            </div>

        </div>
    );
}
