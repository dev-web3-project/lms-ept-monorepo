import React, { useEffect, useMemo, useState } from "react";
import { listForStudent } from "../../../services/api/announcement";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import { getClasses } from "../../../services/api/usiversity";
import PageLoading from "../../../components/Admin/PageLoading";

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
    assignment:  { icon: 'fas fa-tasks',         color: '#9fef00', label: 'Devoir'      },
    exam:        { icon: 'fas fa-file-alt',      color: '#ff3e3e', label: 'Examen'      },
    event:       { icon: 'fas fa-calendar-alt',  color: '#2cb5e8', label: 'Événement'   },
    maintenance: { icon: 'fas fa-tools',         color: '#ffaf00', label: 'Maintenance' },
};

const FILTERS = ['TOUS', 'assignment', 'exam', 'event', 'maintenance'] as const;

const fmtDate = (raw?: string) => {
    if (!raw) return '';
    try {
        return new Date(raw).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch { return raw; }
};

const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [filter, setFilter] = useState<string>('TOUS');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const stored = localStorage.getItem('user');
                const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';
                const details = await getStudentDetailsByUsername(uname);
                // The lecturer publishes announcements with the numeric Class.id as targetId.
                // The student's `intake` and `department` strings (e.g. "DIC1", "GIT") match the
                // Class.name pattern "DIC1-GIT". Resolve to the numeric class id so that the backend
                // filter on (CLASS, targetId) returns the announcements published by lecturers.
                let classId = '';
                if (details?.intake && details?.department) {
                    const expectedName = `${details.intake}-${details.department}`;
                    try {
                        const classes = await getClasses();
                        const match = Array.isArray(classes)
                            ? classes.find((c: any) => c.name === expectedName)
                            : null;
                        classId = match?.id != null ? String(match.id) : '';
                    } catch { /* noop */ }
                }
                const ann = await listForStudent('', classId);
                setAnnouncements(Array.isArray(ann) ? ann : []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        if (filter === 'TOUS') return announcements;
        return announcements.filter(a => (a.type || '').toLowerCase() === filter);
    }, [announcements, filter]);

    const getMeta = (rawType: string) => {
        const key = (rawType || '').toLowerCase();
        return TYPE_META[key] || { icon: 'fas fa-info-circle', color: '#2cb5e8', label: rawType };
    };

    if (loading) return <PageLoading />;

    return (
        <>
            <div style={S.header}>
                <div style={S.headerInner}>
                    <div>
                        <h1 style={S.headerTitle}>
                            <i className="fas fa-bullhorn" style={{ marginRight: '.5rem', color: '#9fef00' }} />
                            Annonces
                        </h1>
                        <p style={{ color: '#556987', fontSize: '.85rem', margin: '.25rem 0 0' }}>
                            {announcements.length} annonces — devoirs, examens, événements et maintenance
                        </p>
                    </div>
                </div>
            </div>

            <div style={S.content}>
                {/* ── Filtres ── */}
                <div style={S.filterBar}>
                    {FILTERS.map(f => {
                        const isActive = filter === f;
                        const meta = f === 'TOUS' ? null : TYPE_META[f];
                        const labelTxt = f === 'TOUS' ? 'TOUS' : (meta?.label || f).toUpperCase();
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    ...S.filterBtn,
                                    background: isActive ? (meta?.color || '#9fef00') + '22' : 'transparent',
                                    borderColor: isActive ? (meta?.color || '#9fef00') : 'transparent',
                                    color: isActive ? (meta?.color || '#9fef00') : '#556987',
                                }}
                            >
                                {meta && <i className={meta.icon} style={{ marginRight: '.4rem' }} />}
                                {labelTxt}
                            </button>
                        );
                    })}
                </div>

                {/* ── Liste ── */}
                {filtered.length === 0 ? (
                    <div style={S.emptyState}>
                        <i className="fas fa-bullhorn" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#2a3f5f' }} />
                        <p style={{ color: '#556987' }}>Aucune annonce dans cette catégorie.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                        {filtered.map((a: any) => {
                            const meta = getMeta(a.type);
                            const dueOrEvent = a.assignmentDueDate || a.examDate || a.eventDate || a.maintenanceStart;
                            return (
                                <div key={a.id} style={{ ...S.card, borderLeft: `3px solid ${meta.color}` }}>
                                    <div style={S.cardIcon}>
                                        <i className={meta.icon} style={{ color: meta.color, fontSize: '1.1rem' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={S.cardTopRow}>
                                            <span style={S.cardTitle}>{(a.title || '').replace(/^(Devoir|Info|Examen|Maintenance)\s*—\s*/i, '')}</span>
                                            <span style={{ ...S.badge, color: meta.color, borderColor: meta.color + '55', background: meta.color + '15' }}>
                                                {meta.label}
                                            </span>
                                        </div>
                                        <div style={S.cardDesc}>{a.description}</div>
                                        <div style={S.cardMeta}>
                                            {a.targetAudience && (
                                                <span><i className="fas fa-users" /> {a.targetAudience}{a.targetId ? ` · ${a.targetId}` : ''}</span>
                                            )}
                                            {dueOrEvent && (
                                                <span><i className="far fa-clock" /> {fmtDate(dueOrEvent)}</span>
                                            )}
                                            {a.examLocation && <span><i className="fas fa-map-marker-alt" /> {a.examLocation}</span>}
                                            {a.eventLocation && <span><i className="fas fa-map-marker-alt" /> {a.eventLocation}</span>}
                                            {a.assignmentInstructor && <span><i className="fas fa-user-tie" /> {a.assignmentInstructor}</span>}
                                            {a.examInstructor && <span><i className="fas fa-user-tie" /> {a.examInstructor}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

const S: Record<string, React.CSSProperties> = {
    header: { background: '#1a2332', borderBottom: '1px solid #2a3f5f', padding: '1.5rem 0' },
    headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' },
    headerTitle: { color: '#e5eaf3', fontSize: '1.5rem', fontWeight: 800, margin: 0 },
    content: { padding: '1.5rem', maxWidth: 1200, margin: '0 auto' },
    filterBar: { display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
    filterBtn: { border: '1px solid', borderRadius: 999, padding: '.4rem 1rem', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all .2s', textTransform: 'uppercase', letterSpacing: '.03em' },
    card: { display: 'flex', alignItems: 'flex-start', gap: '1rem', background: '#1a2332', border: '1px solid #2a3f5f', borderRadius: 10, padding: '1rem 1.25rem' },
    cardIcon: { flexShrink: 0, width: 38, height: 38, borderRadius: 8, background: '#111927', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cardTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', marginBottom: '.35rem', flexWrap: 'wrap' as const },
    cardTitle: { color: '#e5eaf3', fontWeight: 700, fontSize: '.95rem' },
    cardDesc: { color: '#8a9bb5', fontSize: '.85rem', marginBottom: '.5rem', lineHeight: 1.5 },
    cardMeta: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const, color: '#556987', fontSize: '.75rem' },
    badge: { fontSize: '.65rem', fontWeight: 700, border: '1px solid', borderRadius: 4, padding: '.2em .6em', whiteSpace: 'nowrap' as const },
    emptyState: { textAlign: 'center' as const, padding: '4rem 0', background: '#111927', borderRadius: 12, border: '1px dashed #2a3f5f' },
};

export default Announcements;
