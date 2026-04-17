import React, { useEffect, useMemo, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import { Link, useParams } from "react-router-dom";
import {
    assignCourseToDepartment,
    getCoursesByDepartmentId,
    getCoursesWithoutAssigned,
    unassignCourseFromDepartment,
    getTeachingUnitsByClassId,
    getModulesByTeachingUnit
} from "../../../../services/api/course";
import { AssignButton, SaveButton } from "../../../../components/Admin/ButtonIndicator";
import PageLoading from "../../../../components/Admin/PageLoading";
import { notifyError, notifySuccess } from "../../../../components/notify";
import { getDepartmentById, updateDepartment, getClassesByDepartmentId, deleteClass } from "../../../../services/api/usiversity";

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

const DepartmentDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [courseLoading, setCourseLoading] = useState(true);
    const [departmentCourseLoading, setDepartmentCourseLoading] = useState(true);
    const [classesLoading, setClassesLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAssign, setIsAssign] = useState(false);
    const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
    
    const [department, setDepartment] = useState<any>({
        id: '', did: '', name: '', description: '', phone: '', email: '', createdDate: ''
    });
    
    const [courses, setCourses] = useState<any[]>([]);
    const [departmentCourses, setDepartmentCourses] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [statsMap, setStatsMap] = useState<Record<string, ClassStats>>({});

    // Fetch department details
    useEffect(() => {
        if (!id) return;
        getDepartmentById(id).then(data => {
            setDepartment(data);
            setLoading(false);
        });
    }, [id]);

    // Fetch classes and their stats (synchronized with Class.tsx logic)
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            setClassesLoading(true);
            try {
                const data = await getClassesByDepartmentId(id);
                const list = Array.isArray(data) ? data : [];
                if (cancelled) return;
                setClasses(list);
                
                // Fetch stats for each class
                await Promise.all(list.map(async (c: any) => {
                    try {
                        const tus = await getTeachingUnitsByClassId(c.id);
                        const tusList = Array.isArray(tus) ? tus : [];
                        const moduleLists = await Promise.all(tusList.map((tu: any) => getModulesByTeachingUnit(tu.id)));
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
            } finally {
                if (!cancelled) setClassesLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const fetchCourses = async () => {
        const coursesData = await getCoursesWithoutAssigned();
        setCourses(coursesData);
        setCourseLoading(false);
    };

    const fetchCoursesByDepartment = async () => {
        const departmentCoursesData = await getCoursesByDepartmentId(id || '');
        setDepartmentCourses(departmentCoursesData);
        setDepartmentCourseLoading(false);
    };

    useEffect(() => {
        fetchCourses();
        fetchCoursesByDepartment();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDepartment((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        if (id) await updateDepartment(id, department);
        setTimeout(() => setIsSaving(false), 1000);
    };

    const handleDeleteClass = async (classId: string) => {
        if (!window.confirm('Supprimer cette classe ?')) return;
        await deleteClass(classId);
        setClasses(prev => prev.filter(c => c.id !== classId));
    };

    const handleUnassign = async (cid: string) => {
        await unassignCourseFromDepartment(id || '', cid);
        await fetchCoursesByDepartment();
        await fetchCourses();
    };

    if (loading) return <PageLoading />;

    return (
        <section className="content p-0">
            <div className="content-header p-0 pt-3">
                <div className="container-fluid">
                    <div className="row mb-2 align-items-center">
                        <div className="col-sm-auto pr-0">
                            <button 
                                onClick={() => window.history.back()} 
                                className="btn btn-light shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: '42px', height: '42px', borderRadius: '50%', color: '#3b82f6', background: '#ffffff', border: '1px solid #e2e8f0', transition: 'all 0.2s', marginRight: '1rem' }}
                                title="Retour"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                        </div>
                        <div className="col-sm-6">
                            <h1 className="m-0 font-weight-bold ml-2" style={{ fontSize: '1.8rem', color: '#2c3e50' }}>
                                {department.name} <span className="text-muted" style={{ fontSize: '1.2rem' }}>({department.did})</span>
                            </h1>
                        </div>
                        <div className="col-sm-5 text-right">
                            <ol className="breadcrumb float-sm-right bg-transparent p-0 m-0">
                                <li className="breadcrumb-item"><a href="/admin/university/department">Départements</a></li>
                                <li className="breadcrumb-item active">Détails</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-fluid mt-3">
                <div className="card card-primary card-outline card-outline-tabs shadow-sm border-0" style={{ borderRadius: 12 }}>
                    <div className="card-header p-0 border-bottom-0">
                        <ul className="nav nav-tabs" id="dept-tabs" role="tablist">
                            <li className="nav-item">
                                <a className="nav-link active" data-toggle="pill" href="#tab-classes" role="tab">Classes</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-toggle="pill" href="#tab-details" role="tab">Infos Département</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-toggle="pill" href="#tab-subjects" role="tab">Matières / EC</a>
                            </li>
                        </ul>
                    </div>
                    <div className="card-body">
                        <div className="tab-content">
                            {/* ── Tab Classes (Synchronized with Class.tsx) ── */}
                            <div className="tab-pane fade show active" id="tab-classes" role="tabpanel">
                                {classesLoading ? (
                                    <div className="text-center py-5"><i className="fas fa-spinner fa-spin fa-2x text-primary"></i></div>
                                ) : classes.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="fas fa-school fa-3x text-muted mb-3"></i>
                                        <p>Aucune classe n'est rattachée à ce département.</p>
                                        <Link to="/admin/university/class/new" className="btn btn-primary btn-sm rounded-pill px-4">Créer une classe</Link>
                                    </div>
                                ) : (
                                    (() => {
                                        const groups: Record<string, any[]> = { 'TC': [], 'DIC 1': [], 'DIC 2': [], 'DIC 3': [], 'Autres': [] };
                                        classes.forEach((c: any) => {
                                            const name = (c.name || '').toUpperCase();
                                            if (name.startsWith('TC')) groups['TC'].push(c);
                                            else if (name.startsWith('DIC1')) groups['DIC 1'].push(c);
                                            else if (name.startsWith('DIC2')) groups['DIC 2'].push(c);
                                            else if (name.startsWith('DIC3')) groups['DIC 3'].push(c);
                                            else groups['Autres'].push(c);
                                        });

                                        return (
                                            <div className="row">
                                                {Object.entries(groups).map(([groupName, groupClasses]) => {
                                                    if (groupClasses.length === 0) return null;
                                                    return (
                                                        <div key={groupName} className="col-lg-4 mb-4">
                                                            <h5 className="mb-3 font-weight-bold d-flex align-items-center">
                                                                <span style={{ width: 3, height: 18, background: '#3b82f6', borderRadius: 2, marginRight: 10 }}></span>
                                                                {groupName}
                                                            </h5>
                                                            {groupClasses.map(cls => {
                                                                const stats = statsMap[cls.id];
                                                                const pct = stats?.progressPct ?? 0;
                                                                return (
                                                                    <div key={cls.id} className="card shadow-sm mb-3 border-0" style={{ borderRadius: 10, background: 'var(--bg-card, #f8f9fa)' }}>
                                                                        <div className="card-body p-3">
                                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                <Link to={`/admin/university/class/${cls.id}/details`} className="font-weight-bold h6 mb-0 text-dark">{cls.name}</Link>
                                                                                <div className="dropdown">
                                                                                    <i className="fas fa-ellipsis-v text-muted btn-link" data-toggle="dropdown" style={{ cursor: 'pointer' }}></i>
                                                                                    <div className="dropdown-menu dropdown-menu-right shadow-sm border-0">
                                                                                        <Link className="dropdown-item py-2" to={`/admin/university/class/${cls.id}/details`}><i className="fas fa-cog mr-2 text-primary"></i> Gérer</Link>
                                                                                        <button className="dropdown-item py-2 text-danger" onClick={() => handleDeleteClass(cls.id)}><i className="fas fa-trash mr-2"></i> Supprimer</button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="progress mb-1" style={{ height: 6, borderRadius: 3 }}>
                                                                                <div className="progress-bar bg-primary" style={{ width: `${pct}%` }}></div>
                                                                            </div>
                                                                            <div className="d-flex justify-content-between small">
                                                                                <span className="text-muted">{stats?.moduleCount || 0} Modules</span>
                                                                                <span className="font-weight-bold">{pct}%</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()
                                )}
                            </div>

                            {/* ── Tab Infos ── */}
                            <div className="tab-pane fade" id="tab-details" role="tabpanel">
                                <form className="form-horizontal pt-3" onSubmit={handleUpdate}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group row">
                                                <label className="col-sm-4 col-form-label">ID Département</label>
                                                <div className="col-sm-8"><input className="form-control" value={department.did} disabled /></div>
                                            </div>
                                            <div className="form-group row">
                                                <label className="col-sm-4 col-form-label">Nom</label>
                                                <div className="col-sm-8"><input className="form-control" name="name" value={department.name} onChange={handleChange} required /></div>
                                            </div>
                                            <div className="form-group row">
                                                <label className="col-sm-4 col-form-label">Email</label>
                                                <div className="col-sm-8"><input className="form-control" name="email" value={department.email} onChange={handleChange} /></div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group row">
                                                <label className="col-sm-4 col-form-label">Téléphone</label>
                                                <div className="col-sm-8"><input className="form-control" name="phone" value={department.phone} onChange={handleChange} /></div>
                                            </div>
                                            <div className="form-group row">
                                                <label className="col-sm-4 col-form-label">Description</label>
                                                <div className="col-sm-8"><textarea className="form-control" name="description" value={department.description} onChange={handleChange} rows={3} /></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 d-flex">
                                        <SaveButton isSaving={isSaving} onClick={handleUpdate} />
                                        <button type="reset" className="btn btn-default ml-2">Annuler</button>
                                    </div>
                                </form>
                            </div>

                            {/* ── Tab Subjects (EC) ── */}
                            <div className="tab-pane fade" id="tab-subjects" role="tabpanel">
                                <div className="table-responsive pt-3">
                                    <table className="table table-hover table-sm">
                                        <thead>
                                            <tr>
                                                <th>Code EC</th>
                                                <th>Matière / EC</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(departmentCourses) && departmentCourses.map(c => (
                                                <tr key={c.id}>
                                                    <td><code>{c.cid}</code></td>
                                                    <td>{c.title}</td>
                                                    <td>
                                                        <button className="btn btn-sm text-danger" onClick={() => handleUnassign(c.id)}>Détacher</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DepartmentDetails;