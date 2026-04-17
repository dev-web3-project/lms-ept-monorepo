import BreadCrumb from "../../../components/Admin/Breadcrumb";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCourses, getModules } from "../../../services/api/course";
import { getStudents, getLecturers } from "../../../services/api/user";
import { getCycles, getClasses, getDepartments } from "../../../services/api/usiversity";
import { getAllAnnouncements } from "../../../services/api/announcement";
import PageLoading from "../../../components/Admin/PageLoading";
import { useAuth } from "../../../services/AuthContext";

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const BAR_PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

type Stats = {
    students: number; lecturers: number; courses: number;
    cycles: number; classes: number; departments: number; modules: number;
};

const computeTrend = (items: any[], dateField = 'createdDate', months = 12) => {
    const trend = Array(months).fill(0);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    items.forEach((it: any) => {
        const raw = it[dateField] || it.createdAt || it.created_date;
        if (!raw) return;
        const dt = new Date(raw);
        if (dt < start) return;
        const idx = (dt.getFullYear() - start.getFullYear()) * 12 + (dt.getMonth() - start.getMonth());
        if (idx >= 0 && idx < months) trend[idx]++;
    });
    return trend;
};

const growthPct = (trend: number[]) => {
    const curr = trend[trend.length - 1];
    const prev = trend[trend.length - 2] ?? 0;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
};

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({ students: 0, lecturers: 0, courses: 0, cycles: 0, classes: 0, departments: 0, modules: 0 });
    const [students, setStudents] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [signupTrend, setSignupTrend] = useState<number[]>(Array(12).fill(0));
    const [lecturerTrend, setLecturerTrend] = useState<number[]>(Array(12).fill(0));
    const [deptDistribution, setDeptDistribution] = useState<{ name: string; count: number; pct: number }[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsData, lecturersData, coursesData, cyclesData, classesData, depsData, modulesData, annData] = await Promise.all([
                getStudents(), getLecturers(), getCourses(), getCycles(), getClasses(), getDepartments(), getModules(),
                getAllAnnouncements().catch(() => []),
            ]);
            const studentsArr = Array.isArray(studentsData) ? studentsData : [];
            const lecturersArr = Array.isArray(lecturersData) ? lecturersData : [];
            const annArr = Array.isArray(annData) ? annData : [];

            setStudents(studentsArr);
            setLecturers(lecturersArr);
            setAnnouncements(annArr);
            setStats({
                students: studentsArr.length,
                lecturers: lecturersArr.length,
                courses: Array.isArray(coursesData) ? coursesData.length : 0,
                cycles: Array.isArray(cyclesData) ? cyclesData.length : 0,
                classes: Array.isArray(classesData) ? classesData.length : 0,
                departments: Array.isArray(depsData) ? depsData.length : 0,
                modules: Array.isArray(modulesData) ? modulesData.length : 0,
            });

            setSignupTrend(computeTrend(studentsArr));
            setLecturerTrend(computeTrend(lecturersArr));

            // Department distribution
            const counts: Record<string, number> = {};
            studentsArr.forEach((s: any) => {
                const dept = (s.department && String(s.department).trim()) || 'Non assigné';
                counts[dept] = (counts[dept] || 0) + 1;
            });
            const total = studentsArr.length || 1;
            setDeptDistribution(
                Object.entries(counts)
                    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6)
            );
        } catch (error: any) {
            console.error("Dashboard data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const statCards = useMemo(() => {
        const studentGrowth = growthPct(signupTrend);
        const lecturerGrowth = growthPct(lecturerTrend);
        return [
            { label: "Étudiants", value: stats.students, icon: "fas fa-user-graduate", color: "#10b981", link: "/admin/student/enrolled", growth: studentGrowth },
            { label: "Professeurs", value: stats.lecturers, icon: "fas fa-chalkboard-teacher", color: "#f59e0b", link: "/admin/lecturer/all", growth: lecturerGrowth },
            { label: "Modules", value: stats.modules, icon: "fas fa-layer-group", color: "#8b5cf6", link: "/admin/university/module" },
            { label: "Classes", value: stats.classes, icon: "fas fa-school", color: "#3b82f6", link: "/admin/university/class" },
            { label: "Départements", value: stats.departments, icon: "fas fa-sitemap", color: "#0ea5e9", link: "/admin/university/department" },
        ];
    }, [stats, signupTrend, lecturerTrend]);

    const trendLabels = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
            return MONTH_LABELS[d.getMonth()];
        });
    }, []);

    const recentStudents = useMemo(() => {
        return [...students]
            .filter(s => s.createdDate)
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
            .slice(0, 5);
    }, [students]);

    const recentAnnouncements = useMemo(() => {
        return [...announcements]
            .sort((a, b) => {
                const dA = new Date(a.createdDate || a.createdAt || 0).getTime();
                const dB = new Date(b.createdDate || b.createdAt || 0).getTime();
                return dB - dA;
            })
            .slice(0, 5);
    }, [announcements]);

    if (loading) return <PageLoading />;

    const maxTrend = Math.max(...signupTrend, ...lecturerTrend, 1);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const username = user?.username || 'Admin';

    return (
        <section className="content">
            <BreadCrumb page_name="Tableau de bord" parent_name="" />

            <div className="container-fluid">
                {/* Hero */}
                <div className="card mb-4 border-0" style={{ background: 'linear-gradient(135deg, var(--primary, #3b82f6) 0%, #8b5cf6 100%)', color: '#fff' }}>
                    <div className="card-body py-4 px-4 d-flex flex-wrap justify-content-between align-items-center">
                        <div>
                            <small className="text-white-50 text-uppercase font-weight-bold">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small>
                            <h2 className="mb-1 mt-1" style={{ color: '#fff' }}>{greeting}, {username} 👋</h2>
                            <p className="mb-0 text-white-50">Vue d'ensemble de votre plateforme LMS en temps réel.</p>
                        </div>
                        <button onClick={fetchData} className="btn btn-light btn-sm mt-2 mt-md-0">
                            <i className="fas fa-sync-alt mr-1"></i> Actualiser
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="row">
                    {statCards.map((stat, idx) => (
                        <div key={idx} className="col-lg-2 col-md-4 col-6 mb-4">
                            <Link to={stat.link} className="text-decoration-none">
                                <div className="card h-100 border-0 shadow-sm stat-card" style={{ background: 'var(--bg-card)', borderLeft: `4px solid ${stat.color}`, transition: 'transform .15s ease' }}>
                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <span className="text-muted small text-uppercase font-weight-bold">{stat.label}</span>
                                                <h3 className="mb-0 mt-1 font-weight-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</h3>
                                                {typeof stat.growth === 'number' && (
                                                    <small className={stat.growth >= 0 ? 'text-success' : 'text-danger'}>
                                                        <i className={`fas fa-arrow-${stat.growth >= 0 ? 'up' : 'down'} mr-1`}></i>
                                                        {Math.abs(stat.growth)}% vs mois -1
                                                    </small>
                                                )}
                                            </div>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                                                <i className={stat.icon}></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Dept distribution (Full width after removing trend) */}
                <div className="row">
                    <div className="col-lg-12 mb-4">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-header bg-transparent border-0 py-3">
                                <h3 className="card-title mb-0 font-weight-bold">Répartition par département</h3>
                                <small className="text-muted">Top {deptDistribution.length} — {stats.students} étudiants</small>
                            </div>
                            <div className="card-body pt-0">
                                {deptDistribution.length === 0 ? (
                                    <p className="text-muted small mb-0">Aucun étudiant enregistré.</p>
                                ) : (
                                    <div className="row">
                                        {deptDistribution.map((d, idx) => (
                                            <div key={d.name} className="col-md-4 mb-3">
                                                <div className="d-flex justify-content-between mb-1 small">
                                                    <span className="text-truncate" style={{ maxWidth: '70%' }} title={d.name}>{d.name}</span>
                                                    <span className="font-weight-bold">{d.count} <span className="text-muted">({d.pct}%)</span></span>
                                                </div>
                                                <div className="progress" style={{ height: '6px', background: 'var(--bg-elevated, #f1f5f9)' }}>
                                                    <div className="progress-bar" style={{ width: `${d.pct}%`, background: BAR_PALETTE[idx % BAR_PALETTE.length] }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent activity */}
                <div className="row">
                    <div className="col-lg-7">
                        <div className="card shadow-sm border-0">
                            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                                <h3 className="card-title mb-0 font-weight-bold"><i className="fas fa-bullhorn mr-2 text-warning"></i>Annonces récentes</h3>
                                <Link to="/admin/announcements" className="btn btn-sm btn-outline-primary">Voir tout</Link>
                            </div>
                            <div className="card-body p-0">
                                {recentAnnouncements.length === 0 ? (
                                    <p className="text-muted small p-3 mb-0">Aucune annonce pour le moment.</p>
                                ) : (
                                    <ul className="list-group list-group-flush">
                                        {recentAnnouncements.map((a: any) => (
                                            <li key={a.id} className="list-group-item d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1 mr-3">
                                                    <div className="d-flex align-items-center mb-1">
                                                        <span className={`badge badge-${a.type === 'EXAM' ? 'danger' : a.type === 'ASSIGNMENT' ? 'primary' : a.type === 'EVENT' ? 'success' : 'secondary'} mr-2`}>{a.type || 'ANNONCE'}</span>
                                                        <strong className="text-truncate">{a.title || 'Sans titre'}</strong>
                                                    </div>
                                                    {a.content && <small className="text-muted d-block text-truncate" style={{ maxWidth: '500px' }}>{a.content}</small>}
                                                </div>
                                                <small className="text-muted text-nowrap">
                                                    {a.createdDate ? new Date(a.createdDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                                                </small>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-5">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                                <h3 className="card-title mb-0 font-weight-bold"><i className="fas fa-user-plus mr-2 text-success"></i>Nouveaux étudiants</h3>
                                <Link to="/admin/student/enrolled" className="btn btn-sm btn-outline-primary">Voir tout</Link>
                            </div>
                            <div className="card-body p-0">
                                {recentStudents.length === 0 ? (
                                    <p className="text-muted small p-3 mb-0">Aucun étudiant récent.</p>
                                ) : (
                                    <ul className="list-group list-group-flush">
                                        {recentStudents.map((s: any) => {
                                            const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.username || s.email || '—';
                                            const initials = name.split(' ').map((p: string) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
                                            return (
                                                <li key={s.id || s.username} className="list-group-item d-flex align-items-center">
                                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#10b98122', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, marginRight: 12 }}>{initials}</div>
                                                    <div className="flex-grow-1">
                                                        <div className="font-weight-bold">{name}</div>
                                                        <small className="text-muted">{s.department || 'Département non assigné'}</small>
                                                    </div>
                                                    <small className="text-muted">
                                                        {s.createdDate ? new Date(s.createdDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                                                    </small>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Dashboard;
