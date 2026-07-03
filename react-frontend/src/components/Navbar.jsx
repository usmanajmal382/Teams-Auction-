import { Link, useLocation } from 'react-router-dom';
import { getUser, logout } from '../utils/api';

export default function Navbar() {
    const location = useLocation(); 
    const user = getUser();

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="nav-container animate-fade-in">
            <Link to="/" className="brand animate-float">PCL Auction</Link>
            <div className="nav-links">
                {/* Public links always shown */}
                <Link to="/" className={isActive('/') ? 'active-link' : ''}>Home</Link>
                
                {user ? (
                    <>
                        {user.role === 'admin' && (
                            <>
                                <Link to="/admin" className={isActive('/admin') ? 'active-link' : ''}>Admin Panel</Link>
                                <Link to="/admin/budget" className={isActive('/admin/budget') ? 'active-link' : ''} style={{ fontSize: '0.88rem' }}>💰 Budget</Link>
                                <Link to="/admin/retained" className={isActive('/admin/retained') ? 'active-link' : ''} style={{ fontSize: '0.88rem' }}>🏅 Retained</Link>
                                <Link to="/admin/password" className={isActive('/admin/password') ? 'active-link' : ''} style={{ fontSize: '0.88rem' }}>🔑 Password</Link>
                            </>
                        )}
                        {user.role === 'owner' && (
                            <Link to="/auction" className={isActive('/auction') ? 'active-link' : ''}>Live Auction</Link>
                        )}
                        {/* Logged in users can view Players & Teams */}
                        <Link to="/players" className={isActive('/players') ? 'active-link' : ''}>Players</Link>
                        <Link to="/teams" className={isActive('/teams') ? 'active-link' : ''}>Teams</Link>
                        
                        <button onClick={handleLogout} className="btn-logout" style={{ marginLeft: '1rem' }}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '0.4rem' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout ({user.sub})
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className={isActive('/login') ? 'active-link' : ''}>Login</Link>
                        <Link to="/register" className={isActive('/register') ? 'active-link' : ''} style={{ color: '#F4A01C', fontWeight: 'bold' }}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
