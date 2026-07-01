import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, getUser } from '../utils/api';

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const user = getUser();
        if (!user) {
            navigate('/');
            return;
        }

        const loadData = async () => {
            try {
                const teamsData = await apiCall('/teams');
                const playersData = await apiCall('/players');
                setTeams(teamsData);
                setPlayers(playersData);
            } catch (e) {
                console.error(e);
            }
        };

        loadData();
    }, [navigate]);

    return (
        <div className="container animate-fade-in">
            <h2>Franchises</h2>
            <p className="text-muted" style={{ marginTop: '0.25rem', marginBottom: '2rem' }}>
                Track budgets, spending, and acquired player rosters for all participating teams
            </p>
            
            <div className="grid-3">
                {teams.map((t, index) => {
                    const squad = players.filter(p => p.sold_to_team_id === t.id && p.status === 'sold');
                    const spent = t.total_budget - t.remaining_budget;
                    const spentPercent = Math.min(100, Math.max(0, (spent / t.total_budget) * 100));

                    return (
                        <div className="card animate-slide-up team-card" style={{ animationDelay: `${index * 0.05}s` }} key={t.id}>
                            <div className="team-card-bg">
                                <img src="/assets/cricket_teams_banner_1780909290251.png" alt="" />
                            </div>
                            <div className="team-card-content">
                                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                    {t.name}
                                </h3>
                                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Owner: {t.owner_name}</p>
                                
                                <div style={{ marginTop: '1rem' }}>
                                    <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Purse Left:</span>
                                        <strong style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>
                                            ₹{t.remaining_budget?.toLocaleString()}
                                        </strong>
                                    </div>
                                    <div className="flex-between" style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                                        <span>Spent: ₹{spent?.toLocaleString()}</span>
                                        <span>Total: ₹{t.total_budget?.toLocaleString()}</span>
                                    </div>
                                    <div className="budget-bar" style={{ margin: '0.5rem 0 1.25rem' }}>
                                        <div className="budget-fill" style={{ width: `${spentPercent}%` }}></div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Squad ({squad.length + (t.captain_name ? 1 : 0)})
                                   </h4>
                                   <div className="team-squad-list" style={{ maxHeight: '200px' }}>
                                       {t.captain_name && (
                                           <div className="squad-member" style={{ borderBottom: '1px solid rgba(244,160,28,0.25)', paddingBottom: '0.35rem', marginBottom: '0.35rem' }}>
                                               <span style={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                                                   <span style={{ background: 'var(--accent)', color: '#000', fontWeight: 'bold', fontSize: '0.6rem', padding: '0.05rem 0.3rem', borderRadius: '4px' }}>C</span>
                                                   {t.captain_name}
                                               </span>
                                               <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                                           </div>
                                       )}
                                       {squad.map(p => (
                                           <div key={p.id} className="squad-member">
                                               <span>{p.name}</span>
                                               <strong style={{ color: 'white' }}>₹{p.final_price?.toLocaleString()}</strong>
                                           </div>
                                       ))}
                                       {squad.length === 0 && !t.captain_name && (
                                           <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem 0', textAlign: 'center' }}>
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
    );
}
