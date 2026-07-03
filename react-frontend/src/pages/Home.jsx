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
                        Welcome to the official Punjab Cricket League Auction Portal. Real-time bidding room, franchise squad tracker, and budget management.
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

                    {/* DEVELOPER CREDIT — animated, right in hero */}
                    <style>{`
                        @keyframes devBadgeGlow {
                            0%, 100% { box-shadow: 0 0 10px rgba(244,160,28,0.2), 0 0 20px rgba(244,160,28,0.1); border-color: rgba(244,160,28,0.3); }
                            50%       { box-shadow: 0 0 20px rgba(244,160,28,0.5), 0 0 40px rgba(244,160,28,0.2); border-color: rgba(244,160,28,0.7); }
                        }
                        @keyframes devNameShine {
                            0%, 100% { background-position: 0% 50%; }
                            50%       { background-position: 100% 50%; }
                        }
                        .dev-badge {
                            display: inline-flex; align-items: center; gap: 0.6rem;
                            margin-top: 1.5rem;
                            padding: 0.55rem 1.2rem;
                            border-radius: 50px;
                            border: 1px solid rgba(244,160,28,0.3);
                            background: rgba(244,160,28,0.07);
                            animation: devBadgeGlow 2.5s ease-in-out infinite;
                            cursor: default;
                        }
                        .dev-name {
                            font-family: 'Outfit', sans-serif;
                            font-weight: 800;
                            font-size: 1rem;
                            background: linear-gradient(90deg, #F4A01C, #fff, #F4A01C);
                            background-size: 200% auto;
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            animation: devNameShine 2.5s linear infinite;
                        }
                    `}</style>
                    <div className="dev-badge">
                        <span style={{ fontSize: '1rem' }}>⚡</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Built by</span>
                        <span className="dev-name">Usman Ajmal</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>|</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>PCL Platform © 2026</span>
                    </div>
                </div>
                <div className="animate-float" style={{ display: 'flex', justifyContent: 'center' }}>
                    <img src="/assets/home_cricket_auction_1780909121104.png" alt="Cricket Stadium" className="hero-image" style={{ border: '2px solid rgba(244, 160, 28, 0.3)', boxShadow: '0 15px 35px rgba(244, 160, 28, 0.15)' }} />
                </div>
            </div>




            {/* 5 JULY AUCTION BANNER — auto-hides after 6 July */}
            {(() => {
                const now = new Date();
                const hideAfter = new Date('2026-07-06T00:00:00');
                if (now >= hideAfter) return null;
                const auctionDate = new Date('2026-07-05T00:00:00');
                const diffMs = auctionDate - now;
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                return (
                    <div style={{
                        position: 'relative',
                        background: 'linear-gradient(135deg, rgba(244,160,28,0.15) 0%, rgba(255,100,0,0.1) 50%, rgba(244,160,28,0.15) 100%)',
                        border: '2px solid rgba(244,160,28,0.5)',
                        borderRadius: '20px',
                        padding: '2rem',
                        textAlign: 'center',
                        overflow: 'hidden',
                        marginTop: '1rem',
                    }}>
                        {/* Shimmer effect */}
                        <style>{`
                            @keyframes shimmer {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(200%); }
                            }
                            @keyframes pulse-glow {
                                0%, 100% { box-shadow: 0 0 20px rgba(244,160,28,0.3); }
                                50% { box-shadow: 0 0 40px rgba(244,160,28,0.7), 0 0 80px rgba(244,160,28,0.3); }
                            }
                            .auction-banner { animation: pulse-glow 2s ease-in-out infinite; }
                            .shimmer-line {
                                position: absolute; top: 0; left: 0; width: 40%; height: 100%;
                                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                                animation: shimmer 2.5s infinite;
                            }
                        `}</style>
                        <div className="shimmer-line" />
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏏</div>
                        <div style={{
                            fontSize: '1.8rem', fontWeight: '900', fontFamily: 'Outfit',
                            background: 'linear-gradient(to right, #F4A01C, #FF6B00, #F4A01C)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            letterSpacing: '1px', marginBottom: '0.5rem',
                        }}>
                            PCL AUCTION 2026
                        </div>
                        <div style={{ fontSize: '1.1rem', color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>
                            📅 Sunday, 5th July 2026
                        </div>
                        <div style={{
                            display: 'inline-block',
                            background: diffDays <= 1 ? 'rgba(239,68,68,0.2)' : 'rgba(244,160,28,0.15)',
                            border: `1px solid ${diffDays <= 1 ? 'rgba(239,68,68,0.5)' : 'rgba(244,160,28,0.4)'}`,
                            borderRadius: '50px', padding: '0.4rem 1.2rem',
                            fontSize: '0.9rem', color: diffDays <= 1 ? '#ff6b6b' : '#F4A01C',
                            fontWeight: '700', marginTop: '0.5rem',
                        }}>
                            {diffDays <= 0 ? '🔴 LIVE TODAY!' : diffDays === 1 ? '⚡ TOMORROW!' : `⏳ ${diffDays} days to go`}
                        </div>
                        <div style={{ marginTop: '0.75rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                            Organized by <strong style={{ color: '#F4A01C' }}>Hassan Khan</strong> — CEO, GTCC
                        </div>
                    </div>
                );
            })()}

            {/* SEASON ARCHIVE */}
            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: '#F4A01C', marginBottom: '1.5rem' }}>
                    <span style={{ marginRight: '0.5rem' }}>🏆</span> Season History &amp; Archive
                </h2>
                <style>{`
                    @keyframes cardGlow {
                        0%, 100% { box-shadow: 0 4px 20px rgba(244,160,28,0.05); }
                        50% { box-shadow: 0 8px 35px rgba(244,160,28,0.2); }
                    }
                    @keyframes trophySpin {
                        0% { transform: rotate(-10deg) scale(1); }
                        50% { transform: rotate(10deg) scale(1.15); }
                        100% { transform: rotate(-10deg) scale(1); }
                    }
                    .archive-card { animation: cardGlow 3s ease-in-out infinite; transition: transform 0.3s; }
                    .archive-card:hover { transform: translateY(-6px) scale(1.02); }
                    .trophy-icon { display: inline-block; animation: trophySpin 2.5s ease-in-out infinite; }
                `}</style>
                <div className="grid-3">
                    {/* Season 2026 Active */}
                    <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                        <h4 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem' }}>Season 2026 (Active)</h4>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>The current season is underway. Follow teams and bid statuses live.</p>
                        <div style={{ fontSize: '0.85rem' }}>
                            <div><strong>Teams Registered:</strong> {teams.length || 'Loading...'}</div>
                            <div><strong>Players Drafted:</strong> {soldPlayers.length}</div>
                        </div>
                    </div>

                    {/* Season 2025 — animated */}
                    <div className="card archive-card" style={{
                        borderLeft: '4px solid #F4A01C',
                        background: 'linear-gradient(135deg, rgba(16,29,48,0.95), rgba(244,160,28,0.08))',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: '10px', right: '14px', fontSize: '2rem' }}>
                            <span className="trophy-icon">🏆</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '2px', color: '#F4A01C', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Season Archive</div>
                        <h4 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.3rem' }}>Season 2025</h4>
                        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>A thrilling campaign dominated by the Sargodha Thunders.</p>
                        <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>👑</span>
                            <span style={{ color: 'var(--text-muted)' }}>Champions:</span>
                            <strong style={{ color: '#F4A01C', fontFamily: 'Outfit' }}>Sargodha Thunders</strong>
                        </div>
                    </div>

                    {/* Season 2024 — animated */}
                    <div className="card archive-card" style={{
                        borderLeft: '4px solid rgba(244,160,28,0.6)',
                        background: 'linear-gradient(135deg, rgba(16,29,48,0.95), rgba(244,160,28,0.05))',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: '10px', right: '14px', fontSize: '2rem' }}>
                            <span className="trophy-icon" style={{ animationDelay: '1s' }}>🥇</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '2px', color: 'rgba(244,160,28,0.7)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Inaugural Season</div>
                        <h4 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.3rem' }}>Season 2024</h4>
                        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>The inaugural PCL season with high-intensity bidding wars.</p>
                        <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>👑</span>
                            <span style={{ color: 'var(--text-muted)' }}>Champions:</span>
                            <strong style={{ color: '#F4A01C', fontFamily: 'Outfit' }}>Jauharabad Buber Sher</strong>
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
                                            <strong style={{ marginLeft: 'auto', color: '#F4A01C' }}>Rs {p.final_price?.toLocaleString()}</strong>
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
                                            <strong style={{ marginLeft: 'auto', color: 'white' }}>Rs {t.spent?.toLocaleString()}</strong>
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
            {/* CREDITS */}
            <div style={{
                marginTop: '1rem',
                padding: '2.5rem 1rem',
                borderTop: '1px solid rgba(244, 160, 28, 0.15)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
            }}>
                {/* CEO Credit */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'linear-gradient(135deg, rgba(244,160,28,0.1), rgba(255,255,255,0.03))',
                    border: '1px solid rgba(244,160,28,0.25)',
                    borderRadius: '50px',
                    padding: '0.7rem 1.8rem',
                }}>
                    <span style={{ fontSize: '1.1rem' }}>🏛️</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Organized by</span>
                    <span style={{ color: '#F4A01C', fontWeight: '700', fontSize: '0.95rem', fontFamily: 'Outfit' }}>Hassan Khan</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>—</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>CEO, GTCC</span>
                </div>

                {/* Developer Credit */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'rgba(244, 160, 28, 0.04)',
                    border: '1px solid rgba(244, 160, 28, 0.15)',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                }}>
                    <span style={{ fontSize: '0.9rem' }}>⚡</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Designed &amp; Developed by</span>
                    <span style={{ color: '#F4A01C', fontWeight: '700', fontSize: '0.9rem', fontFamily: 'Outfit' }}>Usman Ajmal</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>|</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PCL Auction Platform © 2026</span>
                </div>
            </div>

        </div>
    );
}
