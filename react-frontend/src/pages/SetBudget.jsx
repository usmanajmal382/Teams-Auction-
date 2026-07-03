import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, getUser } from '../utils/api';

export default function SetBudget() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [teamBudgets, setTeamBudgets] = useState({});
    const [budgetSaving, setBudgetSaving] = useState({});
    const [budgetMsg, setBudgetMsg] = useState({});
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const teamsData = await apiCall('/teams');
            setTeams(teamsData);
        } catch (e) {
            console.error(e);
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

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '100%', margin: '0 auto' }}>
            <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(16,185,129,0.3)',
                boxShadow: '0 0 40px rgba(16,185,129,0.08), 0 20px 60px rgba(0,0,0,0.3)'
            }}>
                {/* Animated background */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(10,22,40,0.97) 0%, rgba(6,30,25,0.97) 50%, rgba(10,22,40,0.97) 100%)',
                    zIndex: 0
                }}/>
                <div style={{
                    position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
                    animation: 'pulse 4s ease-in-out infinite', zIndex: 0
                }}/>
                <div style={{
                    position: 'absolute', bottom: '-40px', left: '10%', width: '160px', height: '160px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
                    animation: 'pulse 6s ease-in-out infinite reverse', zIndex: 0
                }}/>
                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1, padding: '1.75rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', boxShadow: '0 0 20px rgba(16,185,129,0.4)'
                        }}>💰</div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', color: 'white', margin: 0, fontWeight: '800', letterSpacing: '0.3px' }}>
                                Pre-Auction Team Budget Setup
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(16,185,129,0.8)' }}>
                                Set each team's starting purse before auction begins
                            </p>
                        </div>
                    </div>
                    <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(16,185,129,0.4), transparent)', margin: '1.5rem 0' }}/>
                    
                    {loading ? (
                        <p style={{color: 'rgba(255,255,255,0.7)'}}>Loading teams...</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
                            {teams.map(t => {
                                const currentVal = teamBudgets[t.id] !== undefined ? teamBudgets[t.id] : t.total_budget;
                                const msg = budgetMsg[t.id];
                                const saving = budgetSaving[t.id];
                                return (
                                    <div key={t.id} style={{
                                        background: 'rgba(16,185,129,0.06)',
                                        border: '1px solid rgba(16,185,129,0.18)',
                                        borderRadius: '12px',
                                        padding: '1.25rem',
                                        transition: 'all 0.3s ease',
                                        cursor: 'default'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background='rgba(16,185,129,0.12)'; e.currentTarget.style.borderColor='rgba(16,185,129,0.4)'; e.currentTarget.style.boxShadow='0 0 20px rgba(16,185,129,0.15)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background='rgba(16,185,129,0.06)'; e.currentTarget.style.borderColor='rgba(16,185,129,0.18)'; e.currentTarget.style.boxShadow='none'; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                            <span style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{t.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                Rs {t.remaining_budget?.toLocaleString()} left
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ color: '#10b981', fontWeight: '800', fontSize: '1rem' }}>Rs</span>
                                            <input
                                                type="number"
                                                value={currentVal}
                                                min="0"
                                                onChange={e => setTeamBudgets(prev => ({ ...prev, [t.id]: parseFloat(e.target.value) || 0 }))}
                                                style={{
                                                    flex: 1, background: 'rgba(0,0,0,0.4)',
                                                    border: '1px solid rgba(16,185,129,0.3)',
                                                    borderRadius: '8px', color: 'white',
                                                    padding: '0.5rem 0.75rem', fontSize: '0.9rem',
                                                    outline: 'none', width: '100%',
                                                    transition: 'border-color 0.2s'
                                                }}
                                                onFocus={e => e.target.style.borderColor='rgba(16,185,129,0.7)'}
                                                onBlur={e => e.target.style.borderColor='rgba(16,185,129,0.3)'}
                                            />
                                            <button
                                                style={{
                                                    padding: '0.5rem 1rem', fontSize: '0.85rem',
                                                    background: saving ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#10b981,#059669)',
                                                    border: 'none', borderRadius: '8px',
                                                    color: 'white', fontWeight: '700', cursor: saving ? 'wait' : 'pointer',
                                                    whiteSpace: 'nowrap', boxShadow: '0 0 12px rgba(16,185,129,0.3)',
                                                    transition: 'all 0.2s', opacity: saving ? 0.7 : 1
                                                }}
                                                disabled={saving}
                                                onMouseEnter={e => { if(!saving) e.currentTarget.style.boxShadow='0 0 20px rgba(16,185,129,0.6)'; }}
                                                onMouseLeave={e => e.currentTarget.style.boxShadow='0 0 12px rgba(16,185,129,0.3)'}
                                                onClick={async () => {
                                                    setBudgetSaving(prev => ({ ...prev, [t.id]: true }));
                                                    setBudgetMsg(prev => ({ ...prev, [t.id]: '' }));
                                                    try {
                                                        await apiCall(`/teams/${t.id}/budget`, { method: 'PUT', body: JSON.stringify({ total_budget: currentVal }) });
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
                                        {msg && <div style={{ fontSize: '0.8rem', marginTop: '0.6rem', color: msg.startsWith('✅') ? '#10b981' : 'var(--danger)', fontWeight: '600' }}>{msg}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
