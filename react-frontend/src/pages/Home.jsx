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
        <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '5rem' }}>
            
            {/* HERO SECTION */}
            <div className="grid-2" style={{ alignItems: 'center', marginTop: '2rem' }}>
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

        </div>
    );
}
