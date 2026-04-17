import { useEffect, useMemo, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { deleteClass, getClasses, getClassesByDepartmentId, getDepartmentById } from "../../../../services/api/usiversity";
import { getTeachingUnitsByClassId, getModulesByTeachingUnit } from "../../../../services/api/course";
import PageLoading from "../../../../components/Admin/PageLoading";

type ClassStats = {
    moduleCount: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    progressPct: number;
};

const computeStatus = (m: any): 'completed' | 'in_progress' | 'not_started' => {
    if (m.isValidated) return 'completed';
    const total = m.totalCH || 0;
    const done = m.completedHours || 0;
    if (total > 0 && done >= total) return 'completed';
    if (done > 0) return 'in_progress';

    const now = Date.now();
    const start = m.startDate ? new Date(m.startDate).getTime() : null;
    const end = m.endDate ? new Date(m.endDate).getTime() : null;
    if (end && now > end) return 'completed';
    if (start && now >= start) return 'in_progress';
    return 'not_started';
};

const Class = () => {
    const [classData, setClassData] = useState<any[]>([]);
    const [statsMap, setStatsMap] = useState<Record<string, ClassStats>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const levelFilter = (searchParams.get('q') || '').trim().toUpperCase();
    const departmentId = (searchParams.get('department') || '').trim();
    const [departmentInfo, setDepartmentInfo] = useState<any>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setStatsMap({});
            setDepartmentInfo(null);

            let all: any[] = [];
            if (departmentId) {
                const [deptClasses, deptInfo] = await Promise.all([
                    getClassesByDepartmentId(departmentId),
                    getDepartmentById(departmentId),
                ]);
                all = Array.isArray(deptClasses) ? deptClasses : [];
                if (!cancelled) setDepartmentInfo(deptInfo);
                // Attach department to each class for display
                all = all.map((c: any) => ({ ...c, department: deptInfo || c.department }));
            } else {
                const data = await getClasses();
                all = Array.isArray(data) ? data : [];
            }
            if (cancelled) return;
            setClassData(all);
            setLoading(false);

            const visible = levelFilter && !departmentId
                ? all.filter((c: any) => {
                    const name = (c.name || '').toUpperCase().trim();
                    return name === levelFilter || name.startsWith(levelFilter + ' ') || name.startsWith(levelFilter + '-');
                })
                : all;

            await Promise.all(visible.map(async (c: any) => {
                try {
                    const tus = await getTeachingUnitsByClassId(c.id);
                    const list = Array.isArray(tus) ? tus : [];
                    const moduleLists = await Promise.all(list.map((tu: any) => getModulesByTeachingUnit(tu.id)));
                    const modules = moduleLists.flat().filter(Boolean);
                    let completed = 0, inProgress = 0, notStarted = 0;
                    modules.forEach((m: any) => {
                        const s = computeStatus(m);
                        if (s === 'completed') completed++;
                        else if (s === 'in_progress') inProgress++;
                        else notStarted++;
                    });
                    const total = modules.length;
                    if (!cancelled) {
                        setStatsMap(prev => ({
                            ...prev,
                            [c.id]: {
                                moduleCount: total,
                                completed, inProgress, notStarted,
                                progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
                            }
                        }));
                    }
                } catch { /* silent */ }
            }));
        })();
        return () => { cancelled = true; };
    }, [levelFilter, departmentId]);

    const filteredClasses = useMemo(() => {
        let base = [];
        if (departmentId) base = classData;
        else if (!levelFilter) base = classData;
        else {
            base = classData.filter((c: any) => {
                const name = (c.name || '').toUpperCase().trim();
                return name === levelFilter || name.startsWith(levelFilter + ' ') || name.startsWith(levelFilter + '-');
            });
        }

        // Apply search filter
        if (searchTerm.trim()) {
            const lowSearch = searchTerm.toLowerCase().trim();
            base = base.filter((c: any) => 
                (c.name || '').toLowerCase().includes(lowSearch) ||
                (c.description || '').toLowerCase().includes(lowSearch)
            );
        }

        // Sorting logic: TC1, TC2, then DIC1, DIC2, DIC3 grouped
        return [...base].sort((a, b) => {
            const nameA = (a.name || '').toUpperCase().trim();
            const nameB = (b.name || '').toUpperCase().trim();

            if (nameA === 'TC1') return -1;
            if (nameB === 'TC1') return 1;
            if (nameA === 'TC2') return nameB === 'TC1' ? 1 : -1;
            if (nameB === 'TC2') return nameA === 'TC1' ? -1 : 1;

            const extractDICLevel = (name: string) => {
                const m = name.match(/DIC(\d)/);
                return m ? parseInt(m[1]) : 99;
            };

            const lvA = extractDICLevel(nameA);
            const lvB = extractDICLevel(nameB);

            if (lvA !== lvB) return lvA - lvB;
            return nameA.localeCompare(nameB);
        });
    }, [classData, levelFilter, departmentId, searchTerm]);

    const globalStats = useMemo(() => {
        let tot = 0, done = 0, inP = 0;
        filteredClasses.forEach((c: any) => {
            const s = statsMap[c.id];
            if (s) { tot += s.moduleCount; done += s.completed; inP += s.inProgress; }
        });
        return { tot, done, inP };
    }, [filteredClasses, statsMap]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cette classe ?')) return;
        await deleteClass(id);
        const data = await getClasses();
        setClassData(Array.isArray(data) ? data : []);
    };

    if (loading) return <PageLoading />;

    let heroTitle = 'Toutes les classes';
    let heroSubtitle = "Vue globale des classes de l'établissement";
    let breadcrumbPage = 'Classes';
    if (departmentId && departmentInfo) {
        heroTitle = departmentInfo.name;
        heroSubtitle = "Parcours Cycle Ingénieur — Suivi des classes et des modules";
        breadcrumbPage = departmentInfo.abbreviation || 'Département';
    } else if (levelFilter) {
        heroTitle = `Niveau ${levelFilter}`;
        heroSubtitle = `Classes de niveau ${levelFilter} (tous départements confondus)`;
        breadcrumbPage = levelFilter;
    }

    return (
        <section className="content">
            <BreadCrumb page_name={breadcrumbPage} parent_name="EPT - Gestion" />
            <div className="container-fluid">
                {/* Hero */}
                <div className="card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: '#fff' }}>
                    <div className="card-body py-4 d-flex flex-wrap justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <button 
                                onClick={() => window.history.back()} 
                                className="btn btn-light shadow-sm mr-4 d-flex align-items-center justify-content-center"
                                style={{ width: '42px', height: '42px', borderRadius: '50%', color: '#3b82f6', background: '#ffffff', border: 'none', transition: 'all 0.2s' }}
                                title="Retour"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <div>
                                <small className="text-white-50 text-uppercase">Navigation académique</small>
                                <h2 className="mb-1 mt-1" style={{ color: '#fff' }}>{heroTitle}</h2>
                                <p className="mb-0 text-white-50">{heroSubtitle}</p>
                            </div>
                        </div>
                        <div className="d-flex gap-3">
                            <div className="text-center mx-3">
                                <h3 className="mb-0" style={{ color: '#fff' }}>{filteredClasses.length}</h3>
                                <small className="text-white-50">Classes</small>
                            </div>
                            <div className="text-center mx-3">
                                <h3 className="mb-0" style={{ color: '#fff' }}>{globalStats.tot}</h3>
                                <small className="text-white-50">Modules</small>
                            </div>
                            <div className="text-center mx-3">
                                <h3 className="mb-0" style={{ color: '#fff' }}>{globalStats.done}</h3>
                                <small className="text-white-50">Terminés</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                {!departmentId && (
                    <div className="row mb-5 align-items-center">
                        <div className="col-md-8 col-lg-7">
                            <div className="position-relative" style={{ transition: 'all 0.3s ease' }}>
                                <div className="input-group rounded-pill overflow-hidden" style={{ 
                                    background: 'rgba(255, 255, 255, 0.04)', 
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '0px'
                                }}>
                                    <div className="input-group-prepend border-0">
                                        <span className="input-group-text border-0 bg-transparent pl-4 pr-1">
                                            <i className="fas fa-search" style={{ color: '#9fef00', fontSize: '1.1rem', opacity: 0.9 }}></i>
                                        </span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control border-0 py-4" 
                                        placeholder="Quelle classe recherchez-vous ?" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ 
                                            boxShadow: 'none', 
                                            fontSize: '1rem', 
                                            fontWeight: 500,
                                            background: 'transparent',
                                            color: '#fff'
                                        }}
                                    />
                                    {searchTerm && (
                                        <div className="input-group-append">
                                            <button className="btn btn-link text-muted pr-3" onClick={() => setSearchTerm("")} style={{ textDecoration: 'none' }}>
                                                <i className="fas fa-times-circle"></i>
                                            </button>
                                        </div>
                                    )}
                                    <div className="input-group-append">
                                        <button className="btn btn-success px-4" onClick={() => {}} style={{ fontWeight: 600, fontSize: '0.9rem', borderRadius: '0 30px 30px 0', background: '#9fef00', borderColor: '#9fef00', color: '#000' }}>
                                            Rechercher
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 col-lg-5 text-md-right mt-3 mt-md-0">
                            <button className="btn btn-success rounded-pill px-4 shadow-sm font-weight-bold" onClick={() => navigate("/admin/university/class/new")} style={{ background: '#9fef00', borderColor: '#9fef00', color: '#000' }}>
                                <i className="fas fa-plus mr-2"></i> Nouvelle classe
                            </button>
                        </div>
                    </div>
                )}
                {/* Class cards grouped by level */}
                {filteredClasses.length === 0 ? (
                    <div className="alert alert-info">
                        <i className="fas fa-info-circle mr-2"></i>
                        {levelFilter
                            ? `Aucune classe trouvée pour le niveau ${levelFilter}.`
                            : 'Aucune classe créée pour le moment.'}
                    </div>
                ) : (
                    (() => {
                        const groups: Record<string, any[]> = {
                            'Tronc Commun': [],
                            'DIC 1': [],
                            'DIC 2': [],
                            'DIC 3': [],
                            'Autres': []
                        };

                        filteredClasses.forEach((c: any) => {
                            const name = (c.name || '').toUpperCase();
                            if (name.startsWith('TC')) groups['Tronc Commun'].push(c);
                            else if (name.startsWith('DIC1')) groups['DIC 1'].push(c);
                            else if (name.startsWith('DIC2')) groups['DIC 2'].push(c);
                            else if (name.startsWith('DIC3')) groups['DIC 3'].push(c);
                            else groups['Autres'].push(c);
                        });

                        const renderedGroups = Object.entries(groups).map(([groupName, classes]) => {
                            if (classes.length === 0) return null;
                            
                            // If department selected, we make each group a column
                            const containerCls = departmentId ? "col-lg-4 mb-4" : "mb-5";
                            const rowCls = departmentId ? "row flex-column" : "row";
                            const cardColCls = departmentId ? "col-12 mb-4" : "col-lg-4 col-md-6 mb-4";

                            return (
                                <div key={groupName} className={containerCls}>
                                    <h3 className="mb-4 d-flex align-items-center" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: departmentId ? '1.15rem' : '1.5rem' }}>
                                        <span style={{ 
                                            width: 4, height: departmentId ? 20 : 24, 
                                            background: 'var(--blue)', 
                                            borderRadius: 2, 
                                            marginRight: 12 
                                        }}></span>
                                        {groupName}
                                    </h3>
                                    <div className={rowCls}>
                                        {classes.map((cls: any) => {
                                            const stats = statsMap[cls.id];
                                            const pct = stats?.progressPct ?? 0;
                                            const total = stats?.moduleCount ?? 0;
                                            const deptName = cls.department?.name;
                                            return (
                                                <div key={cls.id} className={cardColCls}>
                                                    <div className="card h-100 border-0 shadow-sm hover-card" style={{ transition: 'transform .15s, box-shadow .15s', borderRadius: 12, overflow: 'hidden' }}>
                                                        <div className="card-body p-4">
                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                <div>
                                                                    <Link to={`/admin/university/class/${cls.id}/details`} className="text-decoration-none">
                                                                        <h4 className="mb-1 font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                                                                            {cls.name}
                                                                        </h4>
                                                                    </Link>
                                                                </div>
                                                                <div className="dropdown">
                                                                    <button className="btn btn-link text-muted p-0" data-toggle="dropdown">
                                                                        <i className="fas fa-ellipsis-h"></i>
                                                                    </button>
                                                                    <div className="dropdown-menu dropdown-menu-right shadow-sm border-0">
                                                                        <Link className="dropdown-item py-2" to={`/admin/university/class/${cls.id}/details`}>
                                                                            <i className="fas fa-eye mr-2 text-primary"></i> Voir détails
                                                                        </Link>
                                                                        <div className="dropdown-divider"></div>
                                                                        <button className="dropdown-item py-2 text-danger" onClick={() => handleDelete(cls.id)}>
                                                                            <i className="fas fa-trash mr-2"></i> Supprimer
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mb-4">
                                                                <div className="d-flex justify-content-between align-items-center mb-2 small">
                                                                    <span className="text-muted font-weight-medium">Progression</span>
                                                                    <span className="font-weight-bold" style={{ color: pct === 100 ? '#10b981' : '#3b82f6' }}>{stats ? `${pct}%` : '...'}</span>
                                                                </div>
                                                                <div className="progress" style={{ height: 6, borderRadius: 3, background: '#f1f5f9' }}>
                                                                    <div className="progress-bar" style={{ 
                                                                        width: `${pct}%`, 
                                                                        transition: 'width .6s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                        background: pct === 100 ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #6366f1)'
                                                                    }}></div>
                                                                </div>
                                                            </div>

                                                            <div className="row no-gutters text-center py-2 bg-light rounded-lg mb-3">
                                                                <div className="col-6 border-right">
                                                                    <div className="font-weight-bold text-dark small">{total} Modules</div>
                                                                </div>
                                                                <div className="col-6">
                                                                    <div className="font-weight-bold text-success small">{stats?.completed ?? 0} Finis</div>
                                                                </div>
                                                            </div>

                                                            <Link to={`/admin/university/class/${cls.id}/details`} className="btn btn-primary btn-sm btn-block shadow-none" style={{ borderRadius: 8, fontWeight: 600, padding: '0.4rem' }}>
                                                                Gérer les modules
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        });

                        return departmentId ? <div className="row">{renderedGroups}</div> : renderedGroups;
                    })()
                )}

                {/* Bottom Action for Department View */}
                {departmentId && (
                    <div className="row mt-4 mb-5">
                        <div className="col-12 text-right">
                            <button className="btn btn-success rounded-pill px-4 shadow-sm font-weight-bold" onClick={() => navigate("/admin/university/class/new")} style={{ background: '#9fef00', borderColor: '#9fef00', color: '#000' }}>
                                <i className="fas fa-plus mr-2"></i> Nouvelle classe
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Class;
