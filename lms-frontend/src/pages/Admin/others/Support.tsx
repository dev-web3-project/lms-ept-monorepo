import React from 'react';
import BreadCrumb from "../../../components/Admin/Breadcrumb";

const Support = () => {
    const S = styles;
    return (
        <section className="content" style={{ padding: '1rem' }}>
            <BreadCrumb page_name="Assistance" parent_name="Autres" />
            <div className="container-fluid">
                <div style={S.hero}>
                    <div style={S.heroContent}>
                        <h1 style={S.heroTitle}>Centre d'Assistance <span style={S.accent}>LMS EPT</span></h1>
                        <p style={S.heroText}>Nous sommes là pour vous accompagner dans votre expérience d'apprentissage numérique.</p>
                    </div>
                    <div style={S.heroIcon}><i className="fas fa-headset" /></div>
                </div>

                <div className="row">
                    <div className="col-md-5">
                        <div style={S.card}>
                            <h3 style={S.cardTitle}><i className="fas fa-info-circle" style={{ color: '#9fef00', marginRight: '.8rem' }} />Informations de contact</h3>
                            <div style={S.contactGrid}>
                                <div style={S.contactItem}>
                                    <div style={S.iconBox}><i className="fas fa-book-reader" /></div>
                                    <div>
                                        <div style={S.contactLabel}>Documentation</div>
                                        <div style={S.contactValue}>Guide d'utilisation interactif</div>
                                    </div>
                                </div>
                                <div style={S.contactItem}>
                                    <div style={S.iconBox}><i className="fas fa-envelope-open-text" /></div>
                                    <div>
                                        <div style={S.contactLabel}>Support Email</div>
                                        <div style={S.contactValue}>support@ept.sn</div>
                                    </div>
                                </div>
                                <div style={S.contactItem}>
                                    <div style={S.iconBox}><i className="fas fa-phone-alt" /></div>
                                    <div>
                                        <div style={S.contactLabel}>Ligne Directe (EPT)</div>
                                        <div style={S.contactValue}>+221 33 951 13 06</div>
                                    </div>
                                </div>
                            </div>
                            <div style={S.availability}>
                                <span style={S.pulse} /> Disponible du Lundi au Vendredi, 8h - 18h
                            </div>
                        </div>
                    </div>

                    <div className="col-md-7">
                        <div style={S.card}>
                            <h3 style={S.cardTitle}><i className="fas fa-ticket-alt" style={{ color: '#9fef00', marginRight: '.8rem' }} />Soumettre un Ticket</h3>
                            <p style={{ color: '#a4b1cd', fontSize: '.875rem', marginBottom: '1.5rem' }}>
                                Vous rencontrez un problème technique ou pédagogique ? Décrivez-le nous en détail.
                            </p>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={S.label}>Sujet de la demande</label>
                                <input type="text" style={S.input} placeholder="Ex: Problème d'accès à un cours..." />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={S.label}>Description détaillée</label>
                                <textarea style={S.textarea} rows={4} placeholder="Veuillez préciser le module concerné et la nature du problème..."></textarea>
                            </div>
                            <button style={S.submitBtn}>
                                <i className="fas fa-paper-plane" style={{ marginRight: '.5rem' }} /> Envoyer la demande
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const styles: Record<string, React.CSSProperties> = {
    hero: {
        background: 'linear-gradient(135deg, #1a2332 0%, #111927 100%)',
        border: '1px solid #2a3f5f',
        borderRadius: 12,
        padding: '2.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    heroContent: { position: 'relative', zIndex: 2 },
    heroTitle: { color: '#e5eaf3', fontSize: '2rem', fontWeight: 800, margin: '0 0 .5rem' },
    accent: { color: '#9fef00' },
    heroText: { color: '#a4b1cd', fontSize: '1.1rem', maxWidth: 500, margin: 0 },
    heroIcon: {
        fontSize: '6rem', color: 'rgba(159,239,0,.05)', position: 'absolute', right: '2rem',
        transform: 'rotate(15deg)', zIndex: 1
    },
    card: {
        background: '#1a2332',
        border: '1px solid #2a3f5f',
        borderRadius: 10,
        padding: '1.75rem',
        height: '100%',
        boxShadow: '0 4px 12px rgba(0,0,0,.1)',
    },
    cardTitle: { color: '#e5eaf3', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center' },
    contactGrid: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    contactItem: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
    iconBox: {
        width: 42, height: 42, borderRadius: 8,
        background: 'rgba(159,239,0,.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9fef00', fontSize: '1.1rem',
    },
    contactLabel: { color: '#556987', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' },
    contactValue: { color: '#e5eaf3', fontSize: '.95rem', fontWeight: 500 },
    availability: {
        marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #2a3f5f',
        color: '#a4b1cd', fontSize: '.84rem', display: 'flex', alignItems: 'center', gap: '.6rem'
    },
    pulse: {
        width: 8, height: 8, borderRadius: '50%', background: '#9fef00',
        boxShadow: '0 0 0 rgba(159,239,0, 0.4)',
        animation: 'pulse 2s infinite'
    } as any,
    label: { color: '#a4b1cd', fontSize: '.8rem', fontWeight: 600, marginBottom: '.5rem', display: 'block' },
    input: {
        width: '100%', padding: '.75rem 1rem', background: '#111927', border: '1px solid #2a3f5f',
        borderRadius: 6, color: '#e5eaf3', fontSize: '.9rem', outline: 'none'
    },
    textarea: {
        width: '100%', padding: '.75rem 1rem', background: '#111927', border: '1px solid #2a3f5f',
        borderRadius: 6, color: '#e5eaf3', fontSize: '.9rem', outline: 'none', resize: 'none'
    } as any,
    submitBtn: {
        background: '#9fef00', color: '#141d2b', padding: '.75rem 1.5rem', border: 'none',
        borderRadius: 6, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', transition: 'transform .2s, box-shadow .2s'
    },
};

export default Support;
