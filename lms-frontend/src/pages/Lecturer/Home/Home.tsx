import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getModulesByLecturer } from "../../../services/api/course";
import { getLecturerDetailsByUsername } from "../../../services/api/user";
import { getAllAnnouncements } from "../../../services/api/announcement";
import PageLoading from "../../../components/Admin/PageLoading";

const ACCENT_COLORS = ['#9fef00','#2cb5e8','#ffaf00','#ff3e3e','#a855f7','#ec4899','#14b8a6','#f97316'];

const LecturerHome = () => {
    const [modules, setModules] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [lecturer, setLecturer] = useState<any>(null);

    useEffect(() => {
        const go = async () => {
            try {
                const stored = localStorage.getItem('user');
                const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';
                setUsername(uname);
                const [list, anns, details] = await Promise.all([
                    getModulesByLecturer(uname),
                    getAllAnnouncements().catch(() => []),
                    getLecturerDetailsByUsername(uname).catch(() => null),
                ]);
                setModules(Array.isArray(list) ? list : []);
                setAnnouncements(Array.isArray(anns) ? anns : []);
                setLecturer(details);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        go();
    }, []);

    const myRecentAnnouncements = useMemo(() => {
        const classIds = new Set<string>();
        const codes = new Set<string>();
        modules.forEach((m: any) => {
            if (m.teachingUnit?.classId) classIds.add(String(m.teachingUnit.classId));
            if (m.teachingUnit?.code) codes.add(m.teachingUnit.code);
        });
        return announcements
            .filter((a: any) => {
                if (a.targetAudience === 'CLASS' && classIds.has(String(a.targetId))) return true;
                if (a.targetAudience === 'COURSE' && codes.has(String(a.targetId))) return true;
                if (a.assignmentInstructor === username || a.eventOrganizer === username) return true;
                return false;
            })
            .sort((a: any, b: any) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime())
            .slice(0, 3);
    }, [announcements, modules, username]);

    if (loading) return <PageLoading />;

    return (
        <>
            <div style={S.header}>
                <div style={S.headerInner}>
                    <div>
                        <p style={S.headerGreet}>Prof. <span style={S.green}>{lecturer?.fullName || username}</span></p>
                        <h1 style={S.headerTitle}>Vos Modules</h1>
                    </div>
                    <div style={S.headerBadge}>
                        <span style={S.green}>{modules.length}</span>
                        <span style={S.headerBadgeLabel}>modules</span>
                    </div>
                </div>
            </div>

            <div style={S.content}>
                {modules.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-chalkboard-teacher" />
                        <p>Aucun module assigné pour le moment.</p>
                    </div>
                ) : (
                    <div style={S.grid}>
                        {modules.map((mod: any, i: number) => {
                            const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
                            return (
                                <div key={mod.id} style={S.card}>
                                    <div style={{ ...S.cardStripe, background: color }} />
                                    <div style={S.cardBody}>
                                        <div style={S.cardTop}>
                                            <span style={{ ...S.midTag, color, borderColor: color + '44', background: color + '11' }}>
                                                {mod.codeEC || mod.mid}
                                            </span>
                                            <span style={S.semTag}>{mod.semester}</span>
                                        </div>
                                        <h3 style={S.cardTitle}>{(mod.name || mod.title || '').replace(/^\[.*?\]\s*/, '')}</h3>
                                        <div style={S.cardFooter}>
                                            <Link to={`/lecturer/${mod.id}`} style={{ ...S.btn, color, borderColor: color + '55', background: color + '11' }}>
                                                Gérer <i className="fas fa-arrow-right" style={{ marginLeft: '.4rem', fontSize: '.75rem' }} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Mes annonces récentes ── */}
                <div style={S.annWrap}>
                    <div style={S.annHeader}>
                        <h3 style={S.annTitle}>
                            <i className="fas fa-bullhorn" style={{ color: '#ffaf00', marginRight: '.5rem' }} />
                            Mes annonces récentes
                        </h3>
                        <Link to="/lecturer/announcements" style={S.annAction}>
                            <i className="fas fa-plus" style={{ marginRight: '.35rem' }} />Publier / Voir tout
                        </Link>
                    </div>
                    {myRecentAnnouncements.length === 0 ? (
                        <div style={S.annEmpty}>
                            <i className="fas fa-bullhorn" style={{ fontSize: '1.5rem', color: '#556987', marginBottom: '.5rem' }} />
                            <p style={{ margin: 0, color: '#556987', fontSize: '.875rem' }}>
                                Aucune annonce. <Link to="/lecturer/announcements" style={{ color: '#9fef00' }}>Publier la première</Link>
                            </p>
                        </div>
                    ) : (
                        <div style={S.annList}>
                            {myRecentAnnouncements.map((a: any) => (
                                <Link key={a.id} to="/lecturer/announcements" style={S.annItem}>
                                    <span style={{
                                        ...S.annBadge,
                                        background: a.type === 'ASSIGNMENT' ? '#3b82f622' : '#10b98122',
                                        color: a.type === 'ASSIGNMENT' ? '#3b82f6' : '#10b981',
                                    }}>
                                        <i className={a.type === 'ASSIGNMENT' ? 'fas fa-tasks' : 'fas fa-calendar-alt'} />
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.15rem' }}>
                                            <span style={{ 
                                                fontSize: '.6rem', 
                                                fontWeight: 800, 
                                                textTransform: 'uppercase',
                                                padding: '.15rem .45rem',
                                                borderRadius: 4,
                                                background: a.type === 'ASSIGNMENT' ? '#3b82f6' : '#10b981',
                                                color: '#fff'
                                            }}>
                                                {a.type === 'ASSIGNMENT' ? 'Devoir' : 'Info'}
                                            </span>
                                            <div style={S.annItemTitle}>{(a.title || '').replace(/^(Devoir|Info|Examen|Maintenance|ASSIGNMENT|EVENT)\s*—\s*/i, '')}</div>
                                        </div>
                                        <small style={S.annItemMeta}>
                                            {a.createdDate ? new Date(a.createdDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                                            {a.assignmentDueDate && ` • échéance ${new Date(a.assignmentDueDate).toLocaleDateString('fr-FR')}`}
                                            {a.eventDate && ` • ${new Date(a.eventDate).toLocaleDateString('fr-FR')} ${a.eventTime || ''}`}
                                        </small>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const S: Record<string, React.CSSProperties> = {
    header: { background: '#1a2332', borderBottom: '1px solid #2a3f5f', padding: '1.5rem 0' },
    headerInner: { maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    headerGreet: { color: '#556987', fontSize: '.875rem', margin: '0 0 .25rem' },
    headerTitle: { color: '#e5eaf3', fontSize: '1.5rem', fontWeight: 800, margin: 0 },
    green: { color: '#9fef00' },
    headerBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
    headerBadgeLabel: { color: '#556987', fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' },
    content: { padding: '1.5rem', maxWidth: 1100, margin: '0 auto' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
    card: {
        background: '#1a2332', border: '1px solid #2a3f5f',
        borderRadius: 8, overflow: 'hidden', transition: 'border-color .18s',
        display: 'flex', flexDirection: 'column',
    },
    cardStripe: { height: 3 },
    cardBody: { padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1 },
    cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' },
    midTag: {
        fontSize: '.72rem', fontWeight: 700, borderRadius: 4,
        padding: '.2em .6em', border: '1px solid', fontFamily: "'Courier New', monospace",
    },
    semTag: {
        fontSize: '.72rem', fontWeight: 600, color: '#556987',
        background: '#111927', borderRadius: 4, padding: '.2em .6em', border: '1px solid #2a3f5f',
    },
    cardTitle: { color: '#e5eaf3', fontSize: '.95rem', fontWeight: 600, flex: 1, margin: '0 0 1rem', lineHeight: 1.45 },
    cardFooter: { borderTop: '1px solid #2a3f5f', paddingTop: '.85rem' },
    btn: {
        display: 'inline-flex', alignItems: 'center',
        padding: '.38rem .85rem', borderRadius: 4,
        fontWeight: 700, fontSize: '.8rem', border: '1px solid',
        textDecoration: 'none',
    },
    annWrap: {
        marginTop: '2rem', background: '#1a2332', border: '1px solid #2a3f5f',
        borderRadius: 8, padding: '1.25rem',
    },
    annHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    annTitle: { color: '#e5eaf3', fontSize: '1rem', fontWeight: 700, margin: 0 },
    annAction: {
        color: '#9fef00', background: '#9fef0011', border: '1px solid #9fef0044',
        padding: '.35rem .75rem', borderRadius: 4, fontSize: '.8rem', fontWeight: 700,
        textDecoration: 'none',
    },
    annEmpty: { textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    annList: { display: 'flex', flexDirection: 'column', gap: '.5rem' },
    annItem: {
        display: 'flex', alignItems: 'center', gap: '.75rem',
        background: '#111927', border: '1px solid #2a3f5f',
        borderRadius: 6, padding: '.75rem',
        textDecoration: 'none', transition: 'border-color .15s',
    },
    annBadge: {
        width: 34, height: 34, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '.85rem',
    },
    annItemTitle: {
        color: '#e5eaf3', fontSize: '.875rem', fontWeight: 600,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    annItemMeta: { color: '#556987', fontSize: '.72rem' },
};

export default LecturerHome;