import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, getUser } from '../utils/api';

export default function Players() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const user = getUser();
    const isAdmin = user && user.role === 'admin';

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedNationality, setSelectedNationality] = useState('');

    // Edit Modal states
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editBasePrice, setEditBasePrice] = useState('');
    const [editNationality, setEditNationality] = useState('');
    const [editAge, setEditAge] = useState('');
    const [editStats, setEditStats] = useState('');
    const [editPhotoUrl, setEditPhotoUrl] = useState('');

    const loadPlayers = async () => {
        setLoading(true);
        try {
            const data = await apiCall('/players');
            setPlayers(data);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlayers();
    }, []);

    const handleEditClick = (player) => {
        setEditingPlayer(player);
        setEditName(player.name);
        setEditRole(player.role);
        setEditBasePrice(player.base_price.toString());
        setEditNationality(player.nationality || '');
        setEditAge(player.age ? player.age.toString() : '');
        setEditStats(player.stats || '');
        setEditPhotoUrl(player.photo_url || '');
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!editingPlayer) return;

        try {
            await apiCall(`/players/${editingPlayer.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: editName,
                    role: editRole,
                    base_price: parseFloat(editBasePrice),
                    nationality: editNationality || null,
                    age: editAge ? parseInt(editAge) : null,
                    stats: editStats || null,
                    photo_url: editPhotoUrl || null
                })
            });
            alert('Player updated successfully!');
            setEditingPlayer(null);
            loadPlayers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteClick = async (playerId) => {
        if (!window.confirm('Are you sure you want to delete this player? This will remove them from the database.')) {
            return;
        }
        try {
            await apiCall(`/players/${playerId}`, {
                method: 'DELETE'
            });
            alert('Player deleted successfully.');
            loadPlayers();
        } catch (err) {
            alert(err.message);
        }
    };

    const getRoleClass = (role = '') => {
        const r = role.toLowerCase();
        if (r.includes('batsman')) return 'batsman';
        if (r.includes('bowler')) return 'bowler';
        if (r.includes('all-rounder')) return 'all-rounder';
        if (r.includes('keeper')) return 'wicket-keeper';
        return '';
    };

    // Get unique nationalities for the filter dropdown
    const nationalities = [...new Set(players.map(p => p.nationality).filter(Boolean))];

    // Filter Logic
    const filteredPlayers = players.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole ? p.role.toLowerCase() === selectedRole.toLowerCase() : true;
        const matchesNationality = selectedNationality ? (p.nationality && p.nationality.toLowerCase() === selectedNationality.toLowerCase()) : true;
        return matchesSearch && matchesRole && matchesNationality;
    });

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <div className="flex-responsive" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.25rem', color: '#F4A01C', fontFamily: 'Outfit' }}>Player Database</h2>
                    <p className="text-muted" style={{ marginTop: '0.25rem' }}>
                        Browse, filter, and manage all players in the pool.
                    </p>
                </div>
            </div>

            {error && (
                <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--danger)', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {/* FILTER CONTROLS */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div className="grid-3" style={{ gap: '1.25rem', alignItems: 'center' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>Search Player Name</label>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Type to search..."
                            style={{ background: 'rgba(10, 22, 40, 0.5)', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>Filter by Role</label>
                        <select 
                            className="form-select"
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value)}
                            style={{ background: 'rgba(10, 22, 40, 0.5)', border: '1px solid var(--border)', color: 'white' }}
                        >
                            <option value="">All Roles</option>
                            <option value="Batsman">Batsman</option>
                            <option value="Bowler">Bowler</option>
                            <option value="All-Rounder">All-Rounder</option>
                            <option value="Wicket-Keeper">Wicket-Keeper</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>Filter by Nationality</label>
                        <select 
                            className="form-select"
                            value={selectedNationality}
                            onChange={e => setSelectedNationality(e.target.value)}
                            style={{ background: 'rgba(10, 22, 40, 0.5)', border: '1px solid var(--border)', color: 'white' }}
                        >
                            <option value="">All Nationalities</option>
                            {nationalities.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* PLAYERS TABLE */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Photo</th>
                                <th>Name</th>
                                <th>Nationality</th>
                                <th>Age</th>
                                <th>Role</th>
                                <th>Stats</th>
                                <th>Base Price</th>
                                <th>Status</th>
                                <th>Sold To</th>
                                <th>Price</th>
                                {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlayers.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                            {p.photo_url ? (
                                                <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '1.2rem' }}>👤</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600', color: 'white' }}>{p.name}</td>
                                    <td>{p.nationality || '-'}</td>
                                    <td>{p.age || '-'}</td>
                                    <td>
                                        <span className={`badge-role ${getRoleClass(p.role)}`}>
                                            {p.role}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.stats}>
                                        {p.stats || '-'}
                                    </td>
                                    <td style={{ color: 'var(--accent)', fontWeight: '500' }}>Rs {p.base_price?.toLocaleString()}</td>
                                    <td>
                                        <span className={`status ${p.status}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: '500', color: p.team_name ? '#F4A01C' : 'inherit' }}>
                                        {p.team_name || '-'}
                                    </td>
                                    <td style={{ fontWeight: p.final_price ? 'bold' : 'normal', color: p.final_price ? 'var(--secondary)' : 'inherit' }}>
                                        {p.final_price ? `Rs ${p.final_price.toLocaleString()}` : '-'}
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button 
                                                    className="btn btn-success" 
                                                    onClick={() => handleEditClick(p)} 
                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="btn btn-danger" 
                                                    onClick={() => handleDeleteClick(p.id)} 
                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredPlayers.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 11 : 10} className="text-center text-muted" style={{ padding: '3rem' }}>
                                        No players found matching the criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT OVERLAY MODAL */}
            {editingPlayer && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(10, 22, 40, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', border: '1px solid var(--primary)', background: '#101d30', padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', color: '#F4A01C', fontFamily: 'Outfit', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            Edit Player Information
                        </h3>
                        
                        <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Player Name</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required />
                            </div>
                            <div className="grid-2" style={{ gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role</label>
                                    <select className="form-select" value={editRole} onChange={e => setEditRole(e.target.value)} required>
                                        <option value="Batsman">Batsman</option>
                                        <option value="Bowler">Bowler</option>
                                        <option value="All-Rounder">All-Rounder</option>
                                        <option value="Wicket-Keeper">Wicket-Keeper</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Base Price (Rs )</label>
                                    <input type="number" value={editBasePrice} onChange={e => setEditBasePrice(e.target.value)} required />
                                </div>
                            </div>
                            <div className="grid-2" style={{ gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nationality</label>
                                    <input type="text" value={editNationality} onChange={e => setEditNationality(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Age</label>
                                    <input type="number" value={editAge} onChange={e => setEditAge(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stats Summary</label>
                                <input type="text" value={editStats} onChange={e => setEditStats(e.target.value)} placeholder="e.g. Runs: 5000, Wkts: 12" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Photo URL</label>
                                <input type="text" value={editPhotoUrl} onChange={e => setEditPhotoUrl(e.target.value)} placeholder="http://example.com/photo.jpg" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>Save Changes</button>
                                <button type="button" className="btn" onClick={() => setEditingPlayer(null)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
