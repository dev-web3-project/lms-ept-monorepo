import React, { useEffect, useMemo, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import { Link, useParams } from "react-router-dom";
import {
    getClassById,
    updateClass,
} from "../../../../services/api/usiversity";
import { getTeachingUnitsByClassId, getModulesByTeachingUnit } from "../../../../services/api/course";
import { SaveButton } from "../../../../components/Admin/ButtonIndicator";
import PageLoading from "../../../../components/Admin/PageLoading";
import { getLecturers } from "../../../../services/api/user";

type ModuleStatus = 'completed' | 'in_progress' | 'not_started';

const computeModuleStatus = (m: any): ModuleStatus => {
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

const computeModuleProgress = (m: any): number => {
    if (m.isValidated) return 100;
    
    const total = m.totalCH || 0;
    const done = m.completedHours || 0;
    
    if (total > 0) {
        return Math.min(100, Math.round((done / total) * 100));
    }

    const start = m.startDate ? new Date(m.startDate).getTime() : null;
    const end = m.endDate ? new Date(m.endDate).getTime() : null;
    const now = Date.now();
    if (!start || !end) return 0;
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
};

const STATUS_BADGE: Record<ModuleStatus, { label: string; cls: string }> = {
    completed: { label: 'Terminé', cls: 'badge-success' },
    in_progress: { label: 'En cours', cls: 'badge-warning' },
    not_started: { label: 'À venir', cls: 'badge-secondary' },
};

const ClassDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [classData, setClassData] = useState<any>({
        id: '', clid: '', name: '', description: '', createdDate: ''
    });
    const [teachingUnits, setTeachingUnits] = useState<any[]>([]);
    const [modulesByUE, setModulesByUE] = useState<Record<string, any[]>>({});
    const [modulesLoading, setModulesLoading] = useState(true);
    const [lecturersMap, setLecturersMap] = useState<Record<string, string>>({});

    useEffect(() => {
        getLecturers().then(data => {
            if (Array.isArray(data)) {
                const map: Record<string, string> = {};
                data.forEach(l => map[l.username] = `${l.firstName} ${l.lastName}`);
                setLecturersMap(map);
            }
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!id) return;
        getClassById(id).then((data) => {
            setClassData(data);
            setLoading(false);
        });
    }, [id]);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            setModulesLoading(true);
            try {
                const tus = await getTeachingUnitsByClassId(id);
                const tusList = Array.isArray(tus) ? tus : [];
                if (cancelled) return;
                setTeachingUnits(tusList);
                const moduleEntries = await Promise.all(
                    tusList.map(async (tu: any) => {
                        const mods = await getModulesByTeachingUnit(tu.id);
                        return [String(tu.id), Array.isArray(mods) ? mods : []] as [string, any[]];
                    })
                );
                if (cancelled) return;
                setModulesByUE(Object.fromEntries(moduleEntries));
            } finally {
                if (!cancelled) setModulesLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setClassData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        if (id) await updateClass(id, classData);
        setTimeout(() => setIsSaving(false), 1000);
    };

    const allModules = useMemo(() => Object.values(modulesByUE).flat(), [modulesByUE]);

    const stats = useMemo(() => {
        let completed = 0, inProgress = 0, notStarted = 0;
        let totalCH = 0, totalCredits = 0;
        allModules.forEach((m: any) => {
            const s = computeModuleStatus(m);
            if (s === 'completed') completed++;
            else if (s === 'in_progress') inProgress++;
            else notStarted++;
            totalCH += m.totalCH || 0;
            totalCredits += m.creditsEC || 0;
        });
        const total = allModules.length;
        const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, inProgress, notStarted, totalCH, totalCredits, progressPct };
    }, [allModules]);

    if (loading) return <PageLoading />;

    return (
        <section className="content">
            <BreadCrumb title={classData.name || 'Classe'} page_name="Classe" parent_name="Université" />
            <div className="container-fluid">
                {/* Navigation and Title */}


                {/* Hero header */}
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
                            <small className="text-white-50 text-uppercase">Classe académique</small>
                            <h2 className="mb-1 mt-1" style={{ color: '#fff' }}>{classData.name}</h2>
                            {classData.department && (
                                <small className="text-white-50">
                                    <i className="fas fa-sitemap mr-1"></i>{classData.department.name}
                                </small>
                            )}
                            {classData.description && <p className="mb-0 mt-2 text-white-50">{classData.description}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <div style={{ width: 120, height: 120, borderRadius: '50%', border: '6px solid rgba(255,255,255,.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <h2 className="mb-0" style={{ color: '#fff' }}>{stats.progressPct}%</h2>
                                <small className="text-white-50">avancement</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stat strip */}
                <div className="row">
                    {[
                        { label: 'Modules', value: stats.total, icon: 'fas fa-layer-group', color: '#8b5cf6' },
                        { label: 'Terminés', value: stats.completed, icon: 'fas fa-check-circle', color: '#10b981' },
                        { label: 'En cours', value: stats.inProgress, icon: 'fas fa-spinner', color: '#f59e0b' },
                        { label: 'À venir', value: stats.notStarted, icon: 'fas fa-hourglass-start', color: '#64748b' },
                        { label: 'UE', value: teachingUnits.length, icon: 'fas fa-book', color: '#3b82f6' },
                        { label: 'Crédits', value: stats.totalCredits, icon: 'fas fa-award', color: '#ef4444' },
                    ].map((s, i) => (
                        <div key={i} className="col-md-2 col-6 mb-3">
                            <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${s.color}` }}>
                                <div className="card-body p-3 d-flex justify-content-between align-items-center">
                                    <div>
                                        <small className="text-muted text-uppercase">{s.label}</small>
                                        <h4 className="mb-0 font-weight-bold">{s.value}</h4>
                                    </div>
                                    <i className={`${s.icon}`} style={{ color: s.color, fontSize: 22 }}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="card card-primary card-outline card-outline-tabs">
                    <div className="card-header p-0 border-bottom-0">
                        <ul className="nav nav-tabs" id="class-tabs" role="tablist">
                            <li className="nav-item">
                                <a className="nav-link active" data-toggle="pill" href="#tab-modules" role="tab">Modules &amp; Avancement</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-toggle="pill" href="#tab-details" role="tab">Détails de la classe</a>
                            </li>
                        </ul>
                    </div>
                    <div className="card-body">
                        <div className="tab-content">
                            {/* ── Modules ── */}
                            <div className="tab-pane fade show active" id="tab-modules" role="tabpanel">
                                {modulesLoading ? (
                                    <div className="text-center py-4"><i className="fas fa-spinner fa-spin"></i> Chargement des modules...</div>
                                ) : teachingUnits.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        <i className="fas fa-info-circle fa-2x mb-2"></i>
                                        <p className="mb-0">Aucune Unité d'Enseignement n'est assignée à cette classe.</p>
                                    </div>
                                ) : (
                                    teachingUnits.map((tu: any) => {
                                        const modules = modulesByUE[String(tu.id)] || [];
                                        return (
                                            <div key={tu.id} className="mb-4">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <div>
                                                        <h4 className="mb-0">
                                                            <span className="badge badge-primary mr-2">{tu.codeUE}</span>
                                                            {tu.name}
                                                        </h4>
                                                        <small className="text-muted">
                                                            {tu.semester && <span className="mr-3"><i className="far fa-calendar mr-1"></i>{tu.semester}</span>}
                                                            <span className="mr-3"><i className="fas fa-award mr-1"></i>{tu.creditsUE} crédits UE</span>
                                                            <span><i className="fas fa-layer-group mr-1"></i>{modules.length} module{modules.length > 1 ? 's' : ''}</span>
                                                        </small>
                                                    </div>
                                                </div>
                                                {modules.length === 0 ? (
                                                    <p className="text-muted small ml-3 mb-0">Aucun module dans cette UE.</p>
                                                ) : (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover table-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>Code EC</th>
                                                                    <th>Module</th>
                                                                    <th>Enseignant</th>
                                                                    <th className="text-center">CH (CM/TD/TP)</th>
                                                                    <th className="text-center">Crédits</th>
                                                                    <th>Période</th>
                                                                    <th>Statut</th>
                                                                    <th style={{ minWidth: 140 }}>Avancement</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {modules.map((m: any) => {
                                                                    const status = computeModuleStatus(m);
                                                                    const pct = computeModuleProgress(m);
                                                                    const badge = STATUS_BADGE[status];
                                                                    return (
                                                                        <tr key={m.id}>
                                                                            <td><code>{m.codeEC}</code></td>
                                                                            <td>
                                                                                <Link to={`/admin/university/module/${m.id}/details`} className="font-weight-bold text-decoration-none">{m.name}</Link>
                                                                            </td>
                                                                            <td>{m.lecturerUsername ? <span><i className="fas fa-user mr-1"></i>{lecturersMap[m.lecturerUsername] || m.lecturerUsername}</span> : <span className="text-muted">non assigné</span>}</td>
                                                                            <td className="text-center small">
                                                                                {(m.cmHours || 0)}/{(m.tdHours || 0)}/{(m.tpHours || 0)} <span className="text-muted">({m.totalCH || 0}h)</span>
                                                                            </td>
                                                                            <td className="text-center">{m.creditsEC || 0}</td>
                                                                            <td className="small">
                                                                                {m.startDate && m.endDate ? (
                                                                                    <>
                                                                                        {new Date(m.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                                                        {' → '}
                                                                                        {new Date(m.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                                                    </>
                                                                                ) : <span className="text-muted">non planifié</span>}
                                                                            </td>
                                                                            <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                                                                            <td>
                                                                                <div className="progress" style={{ height: 6 }}>
                                                                                    <div className={`progress-bar ${status === 'completed' ? 'bg-success' : status === 'in_progress' ? 'bg-warning' : 'bg-secondary'}`} style={{ width: `${pct}%` }}></div>
                                                                                </div>
                                                                                <small className="text-muted">{pct}%</small>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* ── Détails ── */}
                            <div className="tab-pane fade" id="tab-details" role="tabpanel">
                                <form className="form-horizontal" onSubmit={handleUpdate}>
                                    <div className="form-group row">
                                        <label className="col-sm-2 col-form-label">ID Classe</label>
                                        <div className="col-sm-10">
                                            <input className="form-control" value={classData.clid || ''} disabled />
                                        </div>
                                    </div>
                                    <div className="form-group row">
                                        <label className="col-sm-2 col-form-label">Créé le</label>
                                        <div className="col-sm-10">
                                            <input className="form-control" value={classData.createdDate ? new Date(classData.createdDate).toLocaleString() : ''} disabled />
                                        </div>
                                    </div>
                                    <div className="form-group row">
                                        <label htmlFor="name" className="col-sm-2 col-form-label">Nom</label>
                                        <div className="col-sm-10">
                                            <input type="text" className="form-control" id="name" name="name" value={classData.name || ''} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="form-group row">
                                        <label htmlFor="description" className="col-sm-2 col-form-label">Description</label>
                                        <div className="col-sm-10">
                                            <textarea className="form-control" id="description" name="description" value={classData.description || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-group row mt-4">
                                        <label className="col-sm-2 col-form-label" />
                                        <div className="col-sm-10 d-flex">
                                            <SaveButton isSaving={isSaving} onClick={handleUpdate} />
                                            <button type="reset" className="btn btn-default ml-2">Annuler</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ClassDetails;
