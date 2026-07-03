import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, getUser } from '../utils/api';

export default function ChangePassword() {
    const navigate = useNavigate();
    
    useEffect(() => {
        const user = getUser();
        if (!user || user.role !== 'admin') {
            navigate('/');
        }
    }, [navigate]);

    const [pwCurrent, setPwCurrent] = useState('');
    const [pwNew, setPwNew] = useState('');
    const [pwMsg, setPwMsg] = useState('');
    const [pwError, setPwError] = useState('');

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="card" style={{ marginTop: '2rem', border: '1px solid rgba(244,160,28,0.2)', borderLeft: '4px solid #F4A01C' }}>
                <h3 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔑 Change Admin Password
                </h3>
                {pwMsg && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--secondary)', borderRadius: '8px', padding: '0.6rem 1rem', color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>✅ {pwMsg}</div>}
                {pwError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '0.6rem 1rem', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>❌ {pwError}</div>}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Password</label>
                        <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)}
                            placeholder="Enter current password"
                            style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(244,160,28,0.2)' }} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>New Password</label>
                        <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)}
                            placeholder="Min 6 characters"
                            style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(244,160,28,0.2)' }} />
                    </div>
                    <button className="btn btn-primary" style={{ padding: '0.6rem 1.4rem', whiteSpace: 'nowrap' }}
                        onClick={async () => {
                            setPwMsg(''); setPwError('');
                            if (!pwCurrent || !pwNew) { setPwError('Both fields required'); return; }
                            try {
                                const res = await apiCall('/auth/change-password', {
                                    method: 'PUT',
                                    body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew })
                                });
                                setPwMsg(res.message);
                                setPwCurrent(''); setPwNew('');
                            } catch (err) { setPwError(err.message); }
                        }}>
                        Update Password
                    </button>
                </div>
            </div>
        </div>
    );
}
