import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiCall, getUser } from '../utils/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            const res = await apiCall('/login', {
                method: 'POST',
                body: formData
            });
            
            localStorage.setItem('token', res.access_token);
            
            const loggedInUser = getUser();
            if (loggedInUser.role === 'admin') navigate('/admin');
            else if (loggedInUser.role === 'owner') navigate('/auction');
            else navigate('/players');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
            <div className="card login-container animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.75rem', textAlign: 'center', color: '#F4A01C', fontFamily: 'Outfit', fontWeight: '800', marginBottom: '0.5rem' }}>
                    ARENA LOGIN
                </h3>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Sign in to enter the PCL Auction Arena
                </p>
                
                {error && (
                    <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--danger)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="Enter username"
                            style={{ background: 'rgba(10, 22, 40, 0.6)', border: '1px solid rgba(244, 160, 28, 0.2)' }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="Enter password"
                            style={{ background: 'rgba(10, 22, 40, 0.6)', border: '1px solid rgba(244, 160, 28, 0.2)' }}
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.5rem' }}>
                        Enter Arena
                    </button>
                </form>
                
                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#F4A01C', fontWeight: '600', textDecoration: 'none' }}>Register here</Link>
                </div>
            </div>
        </div>
    );
}
