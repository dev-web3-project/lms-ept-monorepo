import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    getMentorRequests,
    updateMentorshipStatus,
} from "../../../services/api/gamification";
import { getModules } from "../../../services/api/course";

const STATUS_COLORS: Record<string, string> = {
    PENDING:   '#ffaf00', // Amber
    ACCEPTED:  '#94a3b8', // Gray-400
    COMPLETED: '#22c55e', // Green-500
    REJECTED:  '#ef4444', // Red-500
    CANCELED:  '#ef4444', // Red-500
    CANCELLED: '#ef4444', // Red-500
};

const LecturerMentorship = () => {
    const [username, setUsername] = useState('');
    const [mentorOf, setMentorOf] = useState<any[]>([]);
    const [modules, setModules]   = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        const uname = stored ? (JSON.parse(stored).username || '') : '';
        setUsername(uname);
        if (!uname) { setLoading(false); return; }

        const loadData = async () => {
            try {
                const [reqs, mods] = await Promise.allSettled([
                    getMentorRequests(uname),
                    getModules()
                ]);

                if (reqs.status === 'fulfilled') setMentorOf(Array.isArray(reqs.value) ? reqs.value : []);
                else setError('Impossible de charger les demandes.');

                if (mods.status === 'fulfilled') setModules(Array.isArray(mods.value) ? mods.value : []);
            } catch (err) {
                console.error(err);
                setError('Une erreur est survenue.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleStatus = async (id: number, status: string) => {
        try {
            await updateMentorshipStatus(id, status);
            const updated = await getMentorRequests(username);
            setMentorOf(Array.isArray(updated) ? updated : []);
        } catch { alert('Erreur lors de la mise à jour.'); }
    };

    return (
        <>
            <div style={S.header}>
                <div style={S.headerInner}>
                    <div>
                        <p style={S.breadcrumb}><Link to="/lecturer" style={S.breadLink}>Accueil</Link> / Mentorat</p>
                        <h1 style={S.headerTitle}>Demandes de Mentorat</h1>
                    </div>
                    <p style={S.headerSub}>Gérez les demandes d'aide des étudiants sur vos modules.</p>
                </div>
            </div>

            <div style={S.content}>
                <div style={S.card}>
                    <div style={S.cardHeader}>
                        Demandes reçues ({mentorOf.length})
                    </div>
                    
                    <div style={S.list}>
                        {loading ? (
                            <div style={S.loadingRow}>Chargement…</div>
                        ) : mentorOf.length === 0 ? (
                            <div style={S.emptyState}>
                                <p>Aucune demande de mentorat reçue.</p>
                            </div>
                        ) : (
                            mentorOf.map(req => (
                                <div key={req.id} style={{ ...S.item, borderLeft: `4px solid ${STATUS_COLORS[req.status] || '#94a3b8'}` }}>
                                    <div style={S.itemInfo}>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                                             <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f172a', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', color: '#94a3b8', fontWeight: 700 }}>
                                                 E
                                             </div>
                                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                 <span style={{ color: '#94a3b8', fontSize: '.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.5px' }}>Étudiant</span>
                                                 <h4 style={S.itemName}>{req.menteeName || req.menteeUsername}</h4>
                                                 {req.menteeName && <span style={{ color: '#64748b', fontSize: '.75rem' }}>@{req.menteeUsername}</span>}
                                             </div>
                                         </div>
                                         <div style={{ marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem' }}>
                                                 <span style={{ color: '#64748b', fontWeight: 600 }}>Module:</span>
                                                 <span style={{ color: '#cbd5e1' }}>
                                                     {modules.find(m => String(m.id) === String(req.moduleId))?.name || `ID #${req.moduleId}`}
                                                 </span>
                                             </div>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem', color: '#64748b' }}>
                                                 <span style={{ fontWeight: 600 }}>Date:</span>
                                                 <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                             </div>
                                         </div>
                                     </div>
                                     <div style={S.itemActions}>
                                         <span style={{...S.badge, color: STATUS_COLORS[req.status] || '#94a3b8', borderColor: (STATUS_COLORS[req.status] || '#94a3b8') + '30', background: (STATUS_COLORS[req.status] || '#94a3b8') + '15'}}>
                                             <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[req.status] || '#94a3b8', marginRight: 6 }} />
                                             {req.status}
                                         </span>
                                        {req.status === 'PENDING' && (
                                            <div style={S.actionBtns}>
                                                <button style={S.btnAccept} onClick={() => handleStatus(req.id, 'ACCEPTED')}>Accepter</button>
                                                <button style={S.btnReject} onClick={() => handleStatus(req.id, 'REJECTED')}>Refuser</button>
                                            </div>
                                        )}
                                        {req.status === 'ACCEPTED' && (
                                            <button style={S.btnComplete} onClick={() => handleStatus(req.id, 'COMPLETED')}>Marquer Terminé</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LecturerMentorship;

const S: Record<string, React.CSSProperties> = {
    header: {
        background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
        borderBottom: '1px solid #334155',
        padding: '2rem 3rem',
    },
    headerInner: {
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
    },
    breadcrumb: {
        color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem',
    },
    breadLink: {
        color: '#3b82f6', textDecoration: 'none',
    },
    headerTitle: {
        color: '#fff', fontSize: '2rem', fontWeight: 700, margin: 0,
    },
    headerSub: {
        color: '#94a3b8', margin: 0, fontSize: '1rem'
    },
    content: {
        padding: '2rem 3rem', maxWidth: 1200, margin: '0 auto'
    },
    card: {
        background: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        overflow: 'hidden',
    },
    cardHeader: {
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid #334155',
        color: '#fff', fontWeight: 600, fontSize: '1.1rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem'
    },
    cardHeaderIcon: { fontSize: '1.2rem' },
    list: {
        display: 'flex', flexDirection: 'column',
        maxHeight: '600px', overflowY: 'auto'
    },
    item: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 1.5rem', borderBottom: '1px solid #334155',
        flexWrap: 'wrap', gap: '1rem'
    },
    itemInfo: {
        display: 'flex', flexDirection: 'column', gap: '0.25rem'
    },
    itemName: {
        color: '#f8fafc', margin: 0, fontSize: '1rem', fontWeight: 600
    },
    itemSub: {
        color: '#94a3b8', margin: 0, fontSize: '0.875rem'
    },
    itemActions: {
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
    },
    badge: {
        padding: '0.25rem 0.75rem', borderRadius: '9999px',
        fontSize: '0.75rem', fontWeight: 600, border: '1px solid',
        background: 'rgba(0,0,0,0.2)',
    },
    actionBtns: {
        display: 'flex', gap: '0.5rem'
    },
    btnAccept: {
        background: 'rgba(159,239,0,0.1)', color: '#9fef00', border: '1px solid #9fef00',
        padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer',
        fontWeight: 600, transition: 'all 0.2s'
    },
    btnReject: {
        background: 'rgba(255,62,62,0.1)', color: '#ff3e3e', border: '1px solid #ff3e3e',
        padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer',
        fontWeight: 600, transition: 'all 0.2s'
    },
    btnComplete: {
        background: 'rgba(44,181,232,0.1)', color: '#2cb5e8', border: '1px solid #2cb5e8',
        padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer',
        fontWeight: 600, transition: 'all 0.2s'
    },
    emptyState: {
        padding: '4rem 2rem', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '1rem', color: '#64748b'
    },
    emptyIcon: { fontSize: '2.5rem', opacity: 0.5 },
    loadingRow: {
        padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem', color: '#94a3b8'
    },
    spinner: {
        width: 16, height: 16, borderRadius: '50%', border: '2px solid #3b82f6',
        borderTopColor: 'transparent', animation: 'spin 1s linear infinite'
    }
};
