import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getModulesByCourseIdForStudent } from "../../../services/api/course";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";

const ACCENT_COLORS = ['#9fef00','#2cb5e8','#ffaf00','#ff3e3e','#a855f7','#ec4899','#14b8a6','#f97316'];

const Home = () => {
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<any>(null);

    useEffect(() => {
        const go = async () => {
            try {
                const stored = localStorage.getItem('user');
                const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';
                const studentDetails = await getStudentDetailsByUsername(uname);
                setDetails(studentDetails);

                const list = await getModulesByCourseIdForStudent(
                    studentDetails.courseId || studentDetails.id,
                    studentDetails.intake
                );
                setModules(Array.isArray(list) ? list : []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        go();
    }, []);

    const stripCode = (title?: string) => (title || '').replace(/^\[.*?\]\s*/, '');

    if (loading) return <PageLoading />;

    return (
        <>
            <div style={S.header}>
                <div style={S.headerInner}>
                    <div>
                        <h1 style={S.headerTitle}>Mes Modules</h1>
                        <p style={{ color: '#556987', fontSize: '.85rem', margin: '.25rem 0 0' }}>
                            {details?.intake || ''} — {details?.department || ''}
                        </p>
                    </div>
                </div>
            </div>

            <div style={S.content}>
                <h2 style={{ color: '#e5eaf3', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    <i className="fas fa-layer-group" style={{ marginRight: '.5rem', color: '#9fef00' }} />
                    Modules ({modules.length})
                </h2>

                {modules.length === 0 ? (
                    <div style={S.emptyState}>
                        <i className="fas fa-layer-group" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#2a3f5f' }} />
                        <p style={{ color: '#556987' }}>Aucun module assigné.</p>
                    </div>
                ) : (
                    <div style={S.grid}>
                        {modules.map((mod: any, i: number) => {
                            const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
                            return (
                                <Link
                                    to={`/student/${mod.id}`}
                                    key={mod.id}
                                    style={S.card}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.borderColor = color;
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.borderColor = '#2a3f5f';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ ...S.cardStripe, background: color }} />
                                    <div style={S.cardBody}>
                                        <h3 style={S.cardTitle}>{stripCode(mod.name || mod.title)}</h3>
                                        <div style={S.cardMeta}>
                                            <span><i className="far fa-code" /> {mod.codeEC || '-'}</span>
                                            <span><i className="far fa-clock" /> {mod.totalCH ?? mod.duration ?? 0}h</span>
                                            <span><i className="far fa-star" /> {mod.creditsEC ?? mod.credits ?? 0} ECTS</span>
                                        </div>
                                    </div>
                                </Link>
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
    headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' },
    headerGreet: { color: '#556987', fontSize: '.875rem', margin: '0 0 .25rem' },
    headerTitle: { color: '#e5eaf3', fontSize: '1.5rem', fontWeight: 800, margin: 0 },
    green: { color: '#9fef00' },
    gamiBar: { display: 'flex', alignItems: 'center', gap: '1rem', background: '#111927', border: '1px solid #2a3f5f', borderRadius: 10, padding: '.75rem 1.25rem', flexWrap: 'wrap' },
    gamiStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
    gamiVal: { fontSize: '1rem', fontWeight: 800, lineHeight: 1 },
    gamiLabel: { color: '#556987', fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' },
    gamiDivider: { width: 1, height: 32, background: '#2a3f5f' },
    xpBarWrap: { width: 90, height: 5, background: '#2a3f5f', borderRadius: 99, overflow: 'hidden', marginTop: 3 },
    xpBarFill: { height: '100%', background: '#2cb5e8', borderRadius: 99, transition: 'width .4s ease' },
    leaderBtn: { display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.4rem .9rem', background: 'rgba(159,239,0,.1)', border: '1px solid rgba(159,239,0,.35)', borderRadius: 6, color: '#9fef00', fontWeight: 700, fontSize: '.8rem', textDecoration: 'none', whiteSpace: 'nowrap' },
    content: { padding: '1.5rem', maxWidth: 1200, margin: '0 auto' },
    filterBar: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #2a3f5f', paddingBottom: '.5rem' },
    filterBtn: { border: 'none', borderBottom: '2px solid transparent', padding: '.5rem 1rem', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all .2s', textTransform: 'uppercase' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
    card: { background: '#1a2332', border: '1px solid #2a3f5f', borderRadius: 12, overflow: 'hidden', transition: 'all .25s ease', display: 'flex', flexDirection: 'column', textDecoration: 'none' },
    cardStripe: { height: 4 },
    cardBody: { padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 },
    cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' },
    statusBadge: { display: 'flex', alignItems: 'center', gap: '.5rem' },
    statusText: { color: '#556987', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' },
    semTag: { fontSize: '.72rem', fontWeight: 600, color: '#9fef00', background: 'rgba(159,239,0,0.1)', borderRadius: 4, padding: '.2em .6em', border: '1px solid rgba(159,239,0,0.2)' },
    cardTitle: { color: '#e5eaf3', fontSize: '1.1rem', fontWeight: 700, flex: 1, margin: '0 0 1.25rem', lineHeight: 1.4 },
    cardMeta: { display: 'flex', gap: '1rem', color: '#556987', fontSize: '.8rem', fontWeight: 500 },
    emptyState: { textAlign: 'center', padding: '4rem 0', background: '#111927', borderRadius: 12, border: '1px dashed #2a3f5f' },
    annCard: { display: 'flex', alignItems: 'flex-start', background: '#1a2332', border: '1px solid #2a3f5f', borderRadius: 10, padding: '1rem 1.25rem' },
    annBadge: { fontSize: '.65rem', fontWeight: 700, color: '#2cb5e8', background: 'rgba(44,181,232,0.1)', border: '1px solid rgba(44,181,232,0.3)', borderRadius: 4, padding: '.2em .6em', whiteSpace: 'nowrap' as const, marginLeft: '.75rem' },
};

export default Home;