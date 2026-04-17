import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import apiPublic from '../../services/api/api-public';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await apiPublic.post('/user/auth/login', { username, password });
            const { token, user, role } = response.data;
            signIn(token, user, role);
            if (role === 'ADMIN') navigate('/admin/index');
            else if (role === 'STUDENT') navigate('/student');
            else if (role === 'LECTURER') navigate('/lecturer');
            else navigate('/unauthorized');
        } catch (err: any) {
            if (err.response) {
                const status = err.response.status;
                const msg = err.response.data?.message || err.response.data;
                if (status === 401) setError('Identifiants ou mot de passe invalides.');
                else if (status === 403) setError('Accès refusé. Compte non autorisé ou bloqué.');
                else if (status >= 500) setError('Erreur serveur (500). Le service utilisateur est peut-être hors-ligne.');
                else setError(msg || `Erreur ${status} lors de la connexion.`);
            } else if (err.request) {
                setError('Le serveur ne répond pas. Vérifiez que les microservices sont lancés.');
            } else {
                setError('Une erreur est survenue lors de la connexion.');
            }
        } finally {
            setLoading(false);
        }
    };

    const S = styles;

    return (
        <div style={S.page}>
            {/* Left panel */}
            <div style={S.left}>
                <div style={S.leftInner}>
                    <div style={S.logo}>
                        <span style={S.logoIcon}><i className="fas fa-terminal" /></span>
                        <span style={S.logoText}>EPT<span style={S.logoAccent}>LMS</span></span>
                    </div>
                    <p style={S.tagline}>Plateforme d'apprentissage numérique</p>

                    <div style={S.divider} />

                    <div style={S.features}>
                        {[
                            { icon: 'fa-book-open',    text: 'Cours et supports de cours' },
                            { icon: 'fa-comments',     text: 'Forums de discussion' },
                            { icon: 'fa-chart-bar',    text: 'Suivi des notes et résultats' },
                            { icon: 'fa-tasks',        text: 'Devoirs et évaluations' },
                        ].map((f, i) => (
                            <div key={i} style={S.feature}>
                                <i className={`fas ${f.icon}`} style={S.featureIcon} />
                                <span style={S.featureText}>{f.text}</span>
                            </div>
                        ))}
                    </div>

                    <div style={S.leftFooter}>
                        <span style={S.dot} />&nbsp;Système en ligne — {new Date().getFullYear()}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div style={S.right}>
                <div style={S.card}>
                    <div style={S.cardTop}>
                        <h2 style={S.title}>Connexion</h2>
                        <p style={S.subtitle}>Entrez vos identifiants pour continuer</p>
                    </div>

                    {error && (
                        <div style={S.errorBox}>
                            <i className="fas fa-exclamation-triangle" style={{ marginRight: '.5rem', color: '#ff3e3e' }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={S.field}>
                            <label style={S.label}>Adresse Email</label>
                            <div style={S.inputRow}>
                                <i className="fas fa-envelope" style={S.inputIco} />
                                <input
                                    type="text"
                                    style={S.input}
                                    placeholder="Identifiant ou email"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div style={S.field}>
                            <label style={S.label}>Mot de passe</label>
                            <div style={S.inputRow}>
                                <i className="fas fa-lock" style={S.inputIco} />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    style={S.input}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <button type="button" style={S.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                                    <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            style={{ ...S.submitBtn, ...(loading ? S.submitDisabled : {}) }}
                            disabled={loading}
                        >
                            {loading ? (
                                <><span style={S.spinner} /> Connexion...</>
                            ) : (
                                <><i className="fas fa-sign-in-alt" style={{ marginRight: '.5rem' }} />Se connecter</>
                            )}
                        </button>
                    </form>

                    <div style={S.footer}>
                        <a href="/student-application" style={S.footerLink}>
                            <i className="fas fa-user-plus" style={{ marginRight: '.4rem' }} />
                            Demande d'inscription
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: {
        display: 'flex', minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        background: '#141d2b',
    },
    left: {
        flex: '0 0 40%',
        background: '#111927',
        borderRight: '1px solid #2a3f5f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative',
    },
    leftInner: { width: '100%', maxWidth: 340 },
    logo: {
        display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem',
    },
    logoIcon: {
        width: 44, height: 44, borderRadius: 6,
        background: 'rgba(159,239,0,.1)',
        border: '1px solid rgba(159,239,0,.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9fef00', fontSize: '1.1rem',
    } as any,
    logoText: {
        fontSize: '1.5rem', fontWeight: 800, color: '#e5eaf3',
        letterSpacing: '.5px',
    },
    logoAccent: { color: '#9fef00', marginLeft: 4 },
    tagline: { color: '#556987', fontSize: '.875rem', margin: 0 },
    divider: { height: 1, background: '#2a3f5f', margin: '1.75rem 0' },
    features: { display: 'flex', flexDirection: 'column', gap: '.9rem', marginBottom: '2.5rem' },
    feature: { display: 'flex', alignItems: 'center', gap: '.85rem' },
    featureIcon: { color: '#9fef00', fontSize: '.85rem', width: 16, textAlign: 'center' },
    featureText: { color: '#a4b1cd', fontSize: '.875rem' },
    leftFooter: {
        position: 'absolute', bottom: '1.5rem', left: '3rem',
        color: '#556987', fontSize: '.75rem', display: 'flex', alignItems: 'center',
    } as any,
    dot: {
        width: 7, height: 7, borderRadius: '50%',
        background: '#9fef00', display: 'inline-block',
        boxShadow: '0 0 6px #9fef00',
    } as any,
    right: {
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: '#141d2b',
    },
    card: {
        background: '#1a2332',
        border: '1px solid #2a3f5f',
        borderRadius: 10,
        padding: '2.25rem',
        width: '100%', maxWidth: 400,
    },
    cardTop: { marginBottom: '1.75rem' },
    title: { fontSize: '1.5rem', fontWeight: 800, color: '#e5eaf3', margin: '0 0 .35rem' },
    subtitle: { color: '#556987', fontSize: '.875rem', margin: 0 },
    errorBox: {
        background: 'rgba(255,62,62,.08)',
        border: '1px solid rgba(255,62,62,.25)',
        borderLeft: '3px solid #ff3e3e',
        borderRadius: 6,
        padding: '.7rem 1rem',
        color: '#ff6b6b',
        fontSize: '.84rem',
        fontWeight: 500,
        marginBottom: '1.1rem',
        display: 'flex', alignItems: 'center',
    },
    field: { display: 'flex', flexDirection: 'column', marginBottom: '1rem' },
    label: {
        fontSize: '.72rem', fontWeight: 700, color: '#a4b1cd',
        textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '.4rem',
    } as any,
    inputRow: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIco: {
        position: 'absolute', left: '.85rem',
        color: '#556987', fontSize: '.8rem', pointerEvents: 'none',
    } as any,
    input: {
        width: '100%',
        padding: '.6rem .9rem .6rem 2.4rem',
        background: '#111927',
        border: '1px solid #2a3f5f',
        borderRadius: 4,
        color: '#e5eaf3',
        fontSize: '.875rem',
        fontFamily: "'Inter', sans-serif",
        outline: 'none',
        transition: 'border-color .18s',
    },
    eyeBtn: {
        position: 'absolute', right: '.85rem',
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#556987', padding: 0, fontSize: '.85rem',
    } as any,
    submitBtn: {
        width: '100%', marginTop: '.75rem',
        padding: '.65rem',
        background: '#9fef00',
        border: 'none',
        borderRadius: 4,
        color: '#141d2b',
        fontSize: '.9rem',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
        fontFamily: "'Inter', sans-serif",
        transition: 'background .18s, box-shadow .18s',
    },
    submitDisabled: { opacity: .7, cursor: 'not-allowed' },
    spinner: {
        width: 16, height: 16,
        border: '2px solid rgba(20,29,43,.3)',
        borderTopColor: '#141d2b',
        borderRadius: '50%',
        animation: 'spin .7s linear infinite',
        display: 'inline-block',
    },
    footer: { textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #2a3f5f' },
    footerLink: { color: '#9fef00', fontSize: '.84rem', fontWeight: 600, textDecoration: 'none' },
};

export default Login;
