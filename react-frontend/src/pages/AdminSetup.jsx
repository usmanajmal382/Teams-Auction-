import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiCall } from '../utils/api';

export default function AdminSetup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [locked, setLocked] = useState(false);
    const [checking, setChecking] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        apiCall('/auth/admin-exists')
            .then(data => { if (data.exists) setLocked(true); })
            .catch(() => {})
            .finally(() => setChecking(false));
    }, []);

    const handleSetup = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await apiCall('/auth/setup-admin', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    if (checking) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <p style={{ color: 'var(--text-muted)' }}>Checking...</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
            <div className="card login-container animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', border: '1px solid rgba(244,160,28,0.3)' }}>
                <h3 style={{ fontSize: '1.75rem', textAlign: 'center', color: '#F4A01C', fontFamily: 'Outfit', fontWeight: '800', marginBottom: '0.5rem' }}>
                    🔐 ADMIN SETUP
                </h3>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {locked ? 'Admin already configured.' : 'One-time admin account creation'}
                </p>

                {locked && (
                    <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--danger)', textAlign: 'center', marginBottom: '1.5rem' }}>
                        🔒 Registration is permanently closed.<br/>
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Admin account has already been created.</span>
                    </div>
                )}

                {success && (
                    <div style={{ color: 'var(--secondary)', background: 'rgba(16,185,129,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                        ✅ Admin account created! Redirecting to login...
                    </div>
                )}

                {error && (
                    <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--danger)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {!locked && !success && (
                    <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Admin Username</label>
                            <input
                                type="text" value={username}
                                onChange={e => setUsername(e.target.value)}
                                required placeholder="Choose admin username"
                                style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(244,160,28,0.2)' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Password</label>
                            <input
                                type="password" value={password}
                                onChange={e => setPassword(e.target.value)}
                                required placeholder="Create strong password"
                                style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(244,160,28,0.2)' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.5rem' }}>
                            Create Admin Account
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <Link to="/login" style={{ color: '#F4A01C', fontWeight: '600', textDecoration: 'none' }}>← Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
