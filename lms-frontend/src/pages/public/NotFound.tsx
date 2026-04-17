import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div style={S.page}>
            <div style={S.card}>
                <div style={S.codeWrap}>
                    <span style={S.code}>404</span>
                    <span style={S.caret}>_</span>
                </div>
                <h1 style={S.title}>Page introuvable</h1>
                <p style={S.subtitle}>La ressource demandée n'existe pas ou a été supprimée.</p>
                <div style={S.actions}>
                    <button style={S.btnPrimary} onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left" /> Retour
                    </button>
                    <button style={S.btnSecondary} onClick={() => navigate('/login')}>
                        <i className="fas fa-home" /> Accueil
                    </button>
                </div>
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
        maxWidth: 440, width: '100%',
    },
    codeWrap: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: '1.25rem' },
    code: { fontSize: '5rem', fontWeight: 900, color: '#9fef00', lineHeight: 1, fontFamily: "'Courier New', monospace" },
    caret: { fontSize: '4rem', color: '#9fef00', lineHeight: 1, animation: 'blink 1s step-end infinite', fontFamily: "'Courier New', monospace" },
    title: { fontSize: '1.35rem', fontWeight: 700, color: '#e5eaf3', margin: '0 0 .6rem' },
    subtitle: { color: '#556987', fontSize: '.9rem', marginBottom: '2rem', lineHeight: 1.6 },
    actions: { display: 'flex', gap: '.75rem', justifyContent: 'center' },
    btnPrimary: {
        padding: '.6rem 1.35rem', background: '#9fef00', color: '#141d2b',
        border: 'none', borderRadius: 4, fontWeight: 700, fontSize: '.875rem',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.5rem',
        fontFamily: "'Inter', sans-serif",
    },
    btnSecondary: {
        padding: '.6rem 1.35rem', background: 'transparent', color: '#a4b1cd',
        border: '1px solid #2a3f5f', borderRadius: 4, fontWeight: 700, fontSize: '.875rem',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.5rem',
        fontFamily: "'Inter', sans-serif",
    },
};

export default NotFound;