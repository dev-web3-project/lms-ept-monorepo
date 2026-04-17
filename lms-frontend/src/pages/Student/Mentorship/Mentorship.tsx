import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    getMenteeRequests,
    getMentorRequests,
    requestMentorship,
    updateMentorshipStatus,
} from "../../../services/api/gamification";
import { getModulesByStudent, getStudentsByModule, getModules } from "../../../services/api/course";

const STATUS_COLORS: Record<string, string> = {
    PENDING:   '#ffaf00', // Amber
    ACCEPTED:  '#94a3b8', // Gray-400
    COMPLETED: '#22c55e', // Green-500
    REJECTED:  '#ef4444', // Red-500
    CANCELED:  '#ef4444', // Red-500
    CANCELLED: '#ef4444', // Red-500
};

const Mentorship = () => {
    const [username, setUsername]       = useState('');
    const [myRequests, setMyRequests]   = useState<any[]>([]);
    const [mentorOf, setMentorOf]       = useState<any[]>([]);
    const [loading, setLoading]         = useState(true);
    const [activeTab, setActiveTab]     = useState<'sent' | 'received'>('sent');

    /* New request form */
    const [form, setForm] = useState({ mentorUsername: '', moduleId: '', mentorRole: 'LECTURER' });
    const [sending, setSending]   = useState(false);
    const [formMsg, setFormMsg]   = useState('');

    /* Dynamic data */
    const [studentModules, setStudentModules] = useState<any[]>([]);
    const [allModules, setAllModules]       = useState<any[]>([]);
    const [moduleStudents, setModuleStudents]  = useState<any[]>([]);
    const [loadingModules, setLoadingModules]  = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        const uname = stored ? (JSON.parse(stored).username || '') : '';
        setUsername(uname);
        if (!uname) { setLoading(false); return; }

        // Independent fetches for better robustness
        const loadInitialData = async () => {
            try {
                const [sent, received, stdMods, all] = await Promise.allSettled([
                    getMenteeRequests(uname),
                    getMentorRequests(uname),
                    getModulesByStudent(uname),
                    getModules()
                ]);

                setMyRequests(sent.status === 'fulfilled' ? (Array.isArray(sent.value) ? sent.value : []) : []);
                setMentorOf(received.status === 'fulfilled' ? (Array.isArray(received.value) ? received.value : []) : []);
                setStudentModules(stdMods.status === 'fulfilled' ? (Array.isArray(stdMods.value) ? stdMods.value : []) : []);
                setAllModules(all.status === 'fulfilled' ? (Array.isArray(all.value) ? all.value : []) : []);
            } catch (err) {
                console.error("Initial mentorship data load failed", err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.moduleId) { setFormMsg('Veuillez sélectionner un module.'); return; }
        if (form.mentorRole === 'STUDENT' && !form.mentorUsername) { setFormMsg('Veuillez sélectionner un étudiant mentor.'); return; }
        setSending(true); setFormMsg('');
        try {
            await requestMentorship({
                mentorUsername: form.mentorUsername,
                menteeUsername: username,
                moduleId: Number(form.moduleId),
                mentorRole: form.mentorRole,
            });
            setFormMsg('✅ Demande envoyée avec succès !');
            setForm({ mentorUsername: '', moduleId: '', mentorRole: 'LECTURER' });
            setModuleStudents([]);
            const updated = await getMenteeRequests(username);
            setMyRequests(Array.isArray(updated) ? updated : []);
        } catch {
            setFormMsg('❌ Erreur lors de l\'envoi.');
        } finally { setSending(false); }
    };

    /* Core helper: load students or auto-fill lecturer for a given moduleId + role,
       without relying on potentially-stale form state. */
    const applyModuleAndRole = async (moduleId: string, role: string) => {
        setModuleStudents([]);
        if (!moduleId) return;

        const selectedModule = studentModules.find((m: any) => m.id === Number(moduleId));
        if (!selectedModule) return;

        if (role === 'LECTURER') {
            // Auto-fill the assigned lecturer (read-only)
            setForm(p => ({ ...p, mentorUsername: selectedModule.lecturerUsername || '' }));
        } else if (role === 'STUDENT') {
            // Load students of this module so the user can pick one
            setLoadingStudents(true);
            try {
                const students = await getStudentsByModule(moduleId);
                // Exclude self from the list
                const others = Array.isArray(students)
                    ? students.filter((s: any) => s.username !== username)
                    : [];
                setModuleStudents(others);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingStudents(false);
            }
        }
    };

    const handleModuleChange = async (moduleId: string) => {
        setForm(p => ({ ...p, moduleId, mentorUsername: '' }));
        await applyModuleAndRole(moduleId, form.mentorRole);
    };

    const handleRoleChange = async (role: string) => {
        setForm(p => ({ ...p, mentorRole: role, mentorUsername: '' }));
        setModuleStudents([]);
        // Use current form.moduleId directly (not from state update above which is async)
        if (form.moduleId) {
            await applyModuleAndRole(form.moduleId, role);
        }
    };

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
                        <p style={S.breadcrumb}><Link to="/student" style={S.breadLink}>Accueil</Link> / Mentorat</p>
                        <h1 style={S.headerTitle}>Mentorat</h1>
                    </div>
                    <p style={S.headerSub}>Demandez de l'aide ou devenez mentor pour un autre étudiant.</p>
                </div>
            </div>

            <div style={S.content}>
                <div style={S.grid}>
                    {/* Left : New request form */}
                    <div style={S.card}>
                        <div style={S.cardHeader}>
                            Nouvelle demande de mentorat
                        </div>
                        <form onSubmit={handleSend} style={S.form}>
                            <label style={S.label}>Module</label>
                            <select
                                id="mentor-module"
                                style={S.input}
                                value={form.moduleId}
                                onChange={e => handleModuleChange(e.target.value)}
                            >
                                <option value="">Sélectionner un module</option>
                                {studentModules.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name || m.title} ({m.codeEC})</option>
                                ))}
                            </select>

                            <label style={S.label}>Type de mentor</label>
                            <select
                                id="mentor-role"
                                style={S.input}
                                value={form.mentorRole}
                                onChange={e => handleRoleChange(e.target.value)}
                            >
                                <option value="LECTURER">Professeur</option>
                                <option value="STUDENT">Étudiant du module</option>
                            </select>

                            {form.mentorRole === 'LECTURER' && form.moduleId && (
                                <div style={{ marginTop: '.5rem' }}>
                                    <label style={S.label}>Professeur assigné</label>
                                    <input
                                        id="mentor-username"
                                        style={{ ...S.input, background: '#1a2332', cursor: 'not-allowed' }}
                                        type="text"
                                        readOnly
                                        value={form.mentorUsername || 'Aucun professeur assigné'}
                                    />
                                </div>
                            )}

                            {form.mentorRole === 'STUDENT' && form.moduleId && (
                                <div style={{ marginTop: '.5rem' }}>
                                    <label style={S.label}>Choisir l'étudiant mentor</label>
                                    {loadingStudents ? (
                                        <div style={S.loadingRow}>
                                            Chargement des étudiants…
                                        </div>
                                    ) : moduleStudents.length === 0 ? (
                                        <p style={{ color: '#556987', fontSize: '.8rem', margin: 0 }}>
                                            Aucun autre étudiant disponible pour ce module.
                                        </p>
                                    ) : (
                                        <select
                                            id="mentor-student"
                                            style={S.input}
                                            value={form.mentorUsername}
                                            onChange={e => setForm(p => ({ ...p, mentorUsername: e.target.value }))}
                                        >
                                            <option value="">— Sélectionner un étudiant —</option>
                                            {moduleStudents.map((s: any) => (
                                                <option key={s.username} value={s.username}>
                                                    {s.firstName} {s.lastName}  ·  @{s.username}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {formMsg && <p style={{ color: formMsg.startsWith('✅') ? '#9fef00' : '#ff3e3e', fontSize: '.85rem', margin: '.5rem 0 0' }}>{formMsg}</p>}
                            <button id="mentor-submit" type="submit" style={S.submitBtn} disabled={sending || !form.moduleId || (form.mentorRole === 'STUDENT' && !form.mentorUsername)}>
                                {sending ? 'Envoi...' : 'Envoyer la demande'}
                            </button>
                        </form>
                    </div>

                    {/* Right : Request lists */}
                    <div style={S.card}>
                        <div style={S.tabs}>
                            <button
                                id="tab-sent"
                                style={{ ...S.tab, ...(activeTab === 'sent' ? S.tabActive : {}) }}
                                onClick={() => setActiveTab('sent')}
                            >
                                Mes demandes ({myRequests.length})
                            </button>
                            <button
                                id="tab-received"
                                style={{ ...S.tab, ...(activeTab === 'received' ? S.tabActive : {}) }}
                                onClick={() => setActiveTab('received')}
                            >
                                Je suis mentor ({mentorOf.length})
                            </button>
                        </div>

                        {loading ? (
                            <p style={{ color: '#556987', padding: '1.5rem' }}>Chargement...</p>
                        ) : activeTab === 'sent' ? (
                            myRequests.length === 0 ? (
                                <EmptyState msg="Aucune demande envoyée." />
                            ) : (
                                <div style={{ padding: '1rem', maxHeight: '550px', overflowY: 'auto' }}>
                                    {myRequests.map((r: any) => (
                                        <RequestCard key={r.id} req={r} role="mentee" allModules={allModules} />
                                    ))}
                                </div>
                            )
                        ) : (
                            mentorOf.length === 0 ? (
                                <EmptyState msg="Aucune demande reçue." />
                            ) : (
                                <div style={{ padding: '1rem', maxHeight: '550px', overflowY: 'auto' }}>
                                    {mentorOf.map((r: any) => (
                                        <RequestCard key={r.id} req={r} role="mentor" onAction={handleStatus} allModules={allModules} />
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

/* Request card component */
const RequestCard = ({ req, role, onAction, allModules }: { req: any; role: 'mentor' | 'mentee'; onAction?: (id: number, status: string) => void, allModules: any[] }) => {
    const statusColor = STATUS_COLORS[req.status] || '#94a3b8';
    const mentorRoleLabel = req.mentorRole === 'LECTURER' ? 'Professeur' : req.mentorRole === 'STUDENT' ? 'Étudiant' : req.mentorRole || '—';
    
    // Attempt to find module name
    const moduleName = allModules.find(m => String(m.id) === String(req.moduleId))?.name || `Module #${req.moduleId}`;

    return (
        <div style={{ ...S.reqCard, borderLeft: `4px solid ${statusColor}` }}>
            <div style={S.reqTop}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a2332', border: '1px solid #2a3f5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', color: '#94a3b8', fontWeight: 700 }}>
                        {role === 'mentee' ? 'M' : 'S'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#94a3b8', fontSize: '.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.5px' }}>
                            {role === 'mentee' ? 'Mentor' : 'Mentee'}
                        </span>
                        <span style={{ color: '#e5eaf3', fontWeight: 600, fontSize: '.95rem' }}>
                            {role === 'mentee' 
                                ? (req.mentorName || req.mentorUsername) 
                                : (req.menteeName || req.menteeUsername)}
                        </span>
                        {(role === 'mentee' ? req.mentorName : req.menteeName) && (
                            <span style={{ color: '#556987', fontSize: '.7rem' }}>@{role === 'mentee' ? req.mentorUsername : req.menteeUsername}</span>
                        )}
                    </div>
                </div>
                <span style={{ ...S.badge, background: statusColor + '15', color: statusColor, borderColor: statusColor + '30' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: statusColor, marginRight: 6 }} />
                    {req.status}
                </span>
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem' }}>
                    <span style={{ color: '#556987', fontWeight: 600 }}>Module:</span>
                    <span style={{ color: '#8ba3c7' }}>{moduleName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem' }}>
                    <span style={{ color: '#556987', fontWeight: 600 }}>Type:</span>
                    <span style={{ color: '#8ba3c7' }}>{mentorRoleLabel}</span>
                </div>
            </div>

            {role === 'mentor' && req.status === 'PENDING' && onAction && (
                <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a3f5f' }}>
                    <button id={`accept-${req.id}`} style={S.acceptBtn} onClick={() => onAction(req.id, 'ACCEPTED')}>Accepter</button>
                    <button id={`refuse-${req.id}`} style={S.refuseBtn} onClick={() => onAction(req.id, 'REJECTED')}>Refuser</button>
                </div>
            )}
            {role === 'mentor' && req.status === 'ACCEPTED' && onAction && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a3f5f' }}>
                    <button id={`complete-${req.id}`} style={S.completeBtn} onClick={() => onAction(req.id, 'COMPLETED')}>Marquer terminé</button>
                </div>
            )}
        </div>
    );
};

const EmptyState = ({ msg }: { msg: string }) => (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#556987' }}>
        <p style={{ marginTop: '.5rem' }}>{msg}</p>
    </div>
);

const S: Record<string, React.CSSProperties> = {
    header: { background: '#1a2332', borderBottom: '1px solid #2a3f5f', padding: '1.5rem 0' },
    headerInner: { maxWidth: 960, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' },
    breadcrumb: { color: '#556987', fontSize: '.875rem', margin: '0 0 .25rem' },
    breadLink: { color: '#556987', textDecoration: 'none' },
    headerTitle: { color: '#e5eaf3', fontSize: '1.5rem', fontWeight: 800, margin: 0 },
    headerSub: { color: '#556987', fontSize: '.8rem', maxWidth: 280, textAlign: 'right' },
    content: { padding: '1.5rem', maxWidth: 960, margin: '0 auto' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' },
    card: { background: '#1a2332', border: '1px solid #2a3f5f', borderRadius: 12, overflow: 'hidden' },
    cardHeader: { background: '#111927', borderBottom: '1px solid #2a3f5f', padding: '1rem 1.25rem', color: '#e5eaf3', fontWeight: 700, fontSize: '.95rem', display: 'flex', alignItems: 'center', gap: '.5rem' },
    cardHeaderIcon: { fontSize: '1.1rem' },
    form: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' },
    label: { color: '#8ba3c7', fontSize: '.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' },
    input: { background: '#111927', border: '1px solid #2a3f5f', borderRadius: 6, color: '#e5eaf3', padding: '.55rem .85rem', fontSize: '.9rem', outline: 'none', transition: 'border-color .15s', width: '100%', boxSizing: 'border-box' as const },
    loadingRow: { display: 'flex', alignItems: 'center', gap: '.5rem', color: '#556987', fontSize: '.85rem', padding: '.4rem 0' },
    spinner: { display: 'inline-block', width: 14, height: 14, border: '2px solid #2a3f5f', borderTopColor: '#2cb5e8', borderRadius: '50%', animation: 'spin .7s linear infinite' } as React.CSSProperties,
    submitBtn: { background: 'rgba(159,239,0,.15)', border: '1px solid rgba(159,239,0,.45)', color: '#9fef00', borderRadius: 8, padding: '.65rem 1rem', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', marginTop: '.25rem', transition: 'background .15s' },
    tabs: { display: 'flex', borderBottom: '1px solid #2a3f5f' },
    tab: { flex: 1, padding: '.85rem 1rem', background: 'transparent', border: 'none', color: '#556987', fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', transition: 'color .15s, border-bottom .15s', borderBottom: '2px solid transparent' },
    tabActive: { color: '#9fef00', borderBottom: '2px solid #9fef00' },
    reqCard: { background: '#111927', border: '1px solid #2a3f5f', borderRadius: 8, padding: '.9rem 1rem', marginBottom: '.75rem' },
    reqTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.35rem', flexWrap: 'wrap', gap: '.5rem' },
    reqMeta: { color: '#556987', fontSize: '.82rem', margin: 0 },
    badge: { fontSize: '.7rem', fontWeight: 700, padding: '.2em .65em', borderRadius: 20, border: '1px solid' },
    acceptBtn: { background: 'rgba(159,239,0,.15)', border: '1px solid rgba(159,239,0,.45)', color: '#9fef00', borderRadius: 6, padding: '.35rem .75rem', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' },
    refuseBtn: { background: 'rgba(255,62,62,.12)', border: '1px solid rgba(255,62,62,.4)', color: '#ff3e3e', borderRadius: 6, padding: '.35rem .75rem', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' },
    completeBtn: { background: 'rgba(44,181,232,.12)', border: '1px solid rgba(44,181,232,.4)', color: '#2cb5e8', borderRadius: 6, padding: '.35rem .75rem', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' },
};

export default Mentorship;
