import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div style={S.page}>
            <div style={S.card}>
                <div style={S.iconWrap}>
                    <i className="fas fa-shield-alt" style={S.icon} />
                </div>
                <div style={S.codeWrap}>
                    <span style={S.code}>401</span>
                </div>
                <h1 style={S.title}>Accès refusé</h1>
                <p style={S.subtitle}>Vous n'avez pas les permissions requises pour accéder à cette ressource.</p>
                <button style={S.btn} onClick={() => navigate('/login')}>
                    <i className="fas fa-sign-in-alt" style={{ marginRight: '.5rem' }} />
                    Se connecter
                </button>
            </div>
        </div>
    );
};

const S: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#141d2b', fontFamily: "'Inter', sans-serif", padding: '2rem',
    },
    card: {
        background: '#1a2332', border: '1px solid #2a3f5f',
        borderRadius: 10, padding: '3rem', textAlign: 'center',
        maxWidth: 420, width: '100%',
    },
    iconWrap: {
        width: 60, height: 60, borderRadius: 8,
        background: 'rgba(255,62,62,.1)', border: '1px solid rgba(255,62,62,.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.25rem',
    } as any,
    icon: { color: '#ff3e3e', fontSize: '1.5rem' },
    codeWrap: { marginBottom: '.75rem' },
    code: { fontSize: '3.5rem', fontWeight: 900, color: '#ff3e3e', lineHeight: 1, fontFamily: "'Courier New', monospace" },
    title: { fontSize: '1.35rem', fontWeight: 700, color: '#e5eaf3', margin: '0 0 .6rem' },
    subtitle: { color: '#556987', fontSize: '.9rem', marginBottom: '2rem', lineHeight: 1.6 },
    btn: {
        padding: '.65rem 1.75rem',
        background: 'transparent',
        color: '#ff3e3e',
        border: '1px solid #ff3e3e',
        borderRadius: 4, fontWeight: 700, fontSize: '.875rem',
        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
        transition: 'background .18s, color .18s',
    },
};

export default Unauthorized;