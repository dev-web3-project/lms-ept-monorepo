import { useEffect, useMemo, useState } from "react";
import { getModulesByLecturer } from "../../../services/api/course";
import {
    getAllAnnouncements,
    createAssignment,
    createEvent,
    deleteAnnouncement,
} from "../../../services/api/announcement";
import { notifyError } from "../../../components/notify";

type Module = {
    id: number;
    name: string;
    codeEC: string;
    teachingUnit?: { id: number; code: string; classId: number | null; name: string };
};

type AnnouncementType = 'ASSIGNMENT' | 'EVENT';

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
    ASSIGNMENT: { label: 'Devoir', icon: 'fas fa-tasks', color: '#3b82f6' },
    EVENT: { label: 'Séance / Info', icon: 'fas fa-calendar-alt', color: '#10b981' },
    EXAM: { label: 'Examen', icon: 'fas fa-file-alt', color: '#ef4444' },
    MAINTENANCE: { label: 'Maintenance', icon: 'fas fa-wrench', color: '#64748b' },
};

const LecturerAnnouncements = () => {
    const [username, setUsername] = useState('');
    const [modules, setModules] = useState<Module[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');
    const [type, setType] = useState<AnnouncementType>('ASSIGNMENT');
    const [message, setMessage] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const u = JSON.parse(stored);
                setUsername(u.username || u.email || '');
            } catch { /* noop */ }
        }
    }, []);

    useEffect(() => {
        if (!username) return;
        fetchAll();
    }, [username]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [mods, anns] = await Promise.all([
                getModulesByLecturer(username).catch(() => []),
                getAllAnnouncements().catch(() => []),
            ]);
            setModules(Array.isArray(mods) ? mods : []);
            setAnnouncements(Array.isArray(anns) ? anns : []);
        } finally {
            setLoading(false);
        }
    };

    // Class IDs and UE codes the lecturer teaches
    const myScope = useMemo(() => {
        const classIds = new Set<string>();
        const courseCodes = new Set<string>();
        modules.forEach(m => {
            if (m.teachingUnit?.classId) classIds.add(String(m.teachingUnit.classId));
            if (m.teachingUnit?.code) courseCodes.add(m.teachingUnit.code);
        });
        return { classIds, courseCodes };
    }, [modules]);

    // Keep only announcements that concern the lecturer's modules
    const myAnnouncements = useMemo(() => {
        return announcements
            .filter((a: any) => {
                const byClass = a.targetAudience === 'CLASS' && myScope.classIds.has(String(a.targetId));
                const byCourse = a.targetAudience === 'COURSE' && myScope.courseCodes.has(String(a.targetId));
                const byAuthor = a.assignmentInstructor === username || a.eventOrganizer === username || a.examInstructor === username;
                return byClass || byCourse || byAuthor;
            })
            .sort((a: any, b: any) => {
                const dA = new Date(a.createdDate || 0).getTime();
                const dB = new Date(b.createdDate || 0).getTime();
                return dB - dA;
            });
    }, [announcements, myScope, username]);

    const selectedModule = modules.find(m => String(m.id) === selectedModuleId);

    const resetForm = () => {
        setSelectedModuleId('');
        setType('ASSIGNMENT');
        setMessage('');
        setDueDate('');
        setEventDate('');
        setEventTime('');
        setEventLocation('');
    };

    const openModal = () => {
        resetForm();
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModule) {
            notifyError('Sélectionnez un module');
            return;
        }
        if (!selectedModule.teachingUnit?.classId) {
            notifyError('Ce module n\'est pas rattaché à une classe — configuration incomplète');
            return;
        }
        if (!message.trim()) {
            notifyError('Le message est requis');
            return;
        }
        setSubmitting(true);
        try {
            const title = selectedModule.name;

            if (type === 'ASSIGNMENT') {
                await createAssignment({
                    title,
                    description: message,
                    type: 'ASSIGNMENT',
                    targetAudience: 'CLASS',
                    targetId: String(selectedModule.teachingUnit.classId),
                    assignmentCourseCode: selectedModule.teachingUnit.code,
                    assignmentDueDate: dueDate || null,
                    assignmentInstructions: message,
                    assignmentInstructor: username,
                });
            } else {
                await createEvent({
                    title,
                    description: message,
                    type: 'EVENT',
                    targetAudience: 'CLASS',
                    targetId: String(selectedModule.teachingUnit.classId),
                    eventDate: eventDate || null,
                    eventTime: eventTime || null,
                    eventLocation: eventLocation || null,
                    eventOrganizer: username,
                });
            }
            setShowModal(false);
            resetForm();
            await fetchAll();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Supprimer cette annonce ?')) return;
        await deleteAnnouncement(String(id));
        await fetchAll();
    };

    // Class label helper
    const classLabelForTargetId = (targetId: string) => {
        const mod = modules.find(m => String(m.teachingUnit?.classId) === String(targetId));
        return mod?.teachingUnit?.name || `Classe #${targetId}`;
    };

    // Stats
    const stats = useMemo(() => {
        const byType: Record<string, number> = {};
        myAnnouncements.forEach((a: any) => {
            const t = a.type || 'UNKNOWN';
            byType[t] = (byType[t] || 0) + 1;
        });
        return { total: myAnnouncements.length, byType };
    }, [myAnnouncements]);

    return (
        <div className="container-fluid py-4" style={{ maxWidth: 1100 }}>
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 font-weight-bold" style={{ color: 'var(--text-primary)' }}>
                        <i className="fas fa-bullhorn mr-2 text-warning"></i>Mes annonces
                    </h2>
                    <p className="text-muted mb-0">Communiquez rapidement avec vos classes</p>
                </div>
                <button className="btn btn-primary" onClick={openModal} disabled={modules.length === 0}>
                    <i className="fas fa-plus mr-2"></i>Publier une annonce
                </button>
            </div>

            {/* Quick stats */}
            <div className="row mb-4">
                <div className="col-md-3 col-6 mb-2">
                    <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #3b82f6' }}>
                        <div className="card-body p-3">
                            <small className="text-muted text-uppercase">Total</small>
                            <h3 className="mb-0 font-weight-bold">{stats.total}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6 mb-2">
                    <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #3b82f6' }}>
                        <div className="card-body p-3">
                            <small className="text-muted text-uppercase">Devoirs</small>
                            <h3 className="mb-0 font-weight-bold">{stats.byType.ASSIGNMENT || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6 mb-2">
                    <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #10b981' }}>
                        <div className="card-body p-3">
                            <small className="text-muted text-uppercase">Séances / Infos</small>
                            <h3 className="mb-0 font-weight-bold">{stats.byType.EVENT || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6 mb-2">
                    <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #8b5cf6' }}>
                        <div className="card-body p-3">
                            <small className="text-muted text-uppercase">Mes modules</small>
                            <h3 className="mb-0 font-weight-bold">{modules.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-4"><i className="fas fa-spinner fa-spin"></i> Chargement...</div>
                    ) : myAnnouncements.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-bullhorn fa-3x text-muted mb-3"></i>
                            <h5 className="text-muted">Aucune annonce pour le moment</h5>
                            <p className="text-muted mb-0">Cliquez sur "Publier une annonce" pour informer vos classes.</p>
                        </div>
                    ) : (
                        <ul className="list-group list-group-flush">
                            {myAnnouncements.map((a: any) => {
                                const meta = TYPE_META[a.type] || { label: a.type, icon: 'fas fa-info', color: '#64748b' };
                                const mine = a.assignmentInstructor === username || a.eventOrganizer === username;
                                const targetLabel = a.targetAudience === 'CLASS'
                                    ? classLabelForTargetId(a.targetId)
                                    : a.targetAudience === 'COURSE'
                                        ? `Cours ${a.targetId}`
                                        : a.targetAudience;
                                return (
                                    <li key={a.id} className="list-group-item border-0 border-bottom px-0 py-3">
                                        <div className="d-flex align-items-start">
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}22`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <i className={meta.icon}></i>
                                            </div>
                                            <div className="ml-3 flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start flex-wrap">
                                                    <div>
                                                        <span className="badge mr-2" style={{ background: meta.color, color: '#fff' }}>{meta.label}</span>
                                                        <strong>{(a.title || '').replace(/^(Devoir|Info|Examen|Maintenance|ASSIGNMENT|EVENT)\s*—\s*/i, '')}</strong>
                                                    </div>
                                                    <small className="text-muted">
                                                        {a.createdDate ? new Date(a.createdDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </small>
                                                </div>
                                                {a.description && <p className="mb-1 mt-1 text-muted small">{a.description}</p>}
                                                <div className="d-flex flex-wrap align-items-center mt-1" style={{ gap: 12 }}>
                                                    <small className="text-muted"><i className="fas fa-users mr-1"></i>{targetLabel}</small>
                                                    {a.assignmentDueDate && (
                                                        <small className="text-muted"><i className="far fa-calendar mr-1"></i>Échéance : {new Date(a.assignmentDueDate).toLocaleDateString('fr-FR')}</small>
                                                    )}
                                                    {a.eventDate && (
                                                        <small className="text-muted"><i className="far fa-calendar mr-1"></i>{new Date(a.eventDate).toLocaleDateString('fr-FR')} {a.eventTime || ''}</small>
                                                    )}
                                                    {a.eventLocation && (
                                                        <small className="text-muted"><i className="fas fa-map-marker-alt mr-1"></i>{a.eventLocation}</small>
                                                    )}
                                                    {mine && (
                                                        <button className="btn btn-sm btn-link text-danger p-0 ml-auto" onClick={() => handleDelete(a.id)}>
                                                            <i className="fas fa-trash mr-1"></i>Supprimer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* Publish modal */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,.5)' }} onClick={() => !submitting && setShowModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <form onSubmit={handleSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title"><i className="fas fa-bullhorn mr-2"></i>Nouvelle annonce</h5>
                                    <button type="button" className="close" onClick={() => setShowModal(false)} disabled={submitting}>
                                        <span>&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {/* Module */}
                                    <div className="form-group">
                                        <label>Module concerné</label>
                                        <select className="form-control" value={selectedModuleId} onChange={e => setSelectedModuleId(e.target.value)} required>
                                            <option value="">— Choisir un module —</option>
                                            {modules.map(m => (
                                                <option key={m.id} value={m.id} disabled={!m.teachingUnit?.classId}>
                                                    {m.name} ({m.codeEC}) {!m.teachingUnit?.classId ? '— classe non assignée' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedModule?.teachingUnit?.classId && (
                                            <small className="text-muted">
                                                <i className="fas fa-info-circle mr-1"></i>
                                                L'annonce sera envoyée à la classe de l'UE <strong>{selectedModule.teachingUnit.code}</strong>
                                            </small>
                                        )}
                                    </div>

                                    {/* Type */}
                                    <div className="form-group">
                                        <label>Type</label>
                                        <div className="btn-group btn-group-toggle w-100" style={{ display: 'flex' }}>
                                            <label className={`btn btn-outline-primary ${type === 'ASSIGNMENT' ? 'active' : ''}`} style={{ flex: 1 }}>
                                                <input type="radio" checked={type === 'ASSIGNMENT'} onChange={() => setType('ASSIGNMENT')} />
                                                <i className="fas fa-tasks mr-2"></i>Devoir
                                            </label>
                                            <label className={`btn btn-outline-success ${type === 'EVENT' ? 'active' : ''}`} style={{ flex: 1 }}>
                                                <input type="radio" checked={type === 'EVENT'} onChange={() => setType('EVENT')} />
                                                <i className="fas fa-calendar-alt mr-2"></i>Séance / Info
                                            </label>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="form-group">
                                        <label>Message</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder={type === 'ASSIGNMENT' ? "Ex: Rendre l'exercice 3 du chapitre 2…" : "Ex: Cours reporté à la salle A102…"}
                                            required
                                        />
                                    </div>

                                    {/* Conditional fields */}
                                    {type === 'ASSIGNMENT' && (
                                        <div className="form-group">
                                            <label>Date limite <small className="text-muted">(optionnel)</small></label>
                                            <input type="date" className="form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                            <small className="text-muted">Laissez vide pour une simple consigne sans échéance.</small>
                                        </div>
                                    )}

                                    {type === 'EVENT' && (
                                        <div className="row">
                                            <div className="col-md-6 form-group">
                                                <label>Date <small className="text-muted">(optionnel)</small></label>
                                                <input type="date" className="form-control" value={eventDate} onChange={e => setEventDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                            </div>
                                            <div className="col-md-6 form-group">
                                                <label>Heure <small className="text-muted">(optionnel)</small></label>
                                                <input type="time" className="form-control" value={eventTime} onChange={e => setEventTime(e.target.value)} />
                                            </div>
                                            <div className="col-12 form-group">
                                                <label>Lieu / lien <small className="text-muted">(optionnel)</small></label>
                                                <input type="text" className="form-control" value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Ex: Salle A102, lien visio, ou laisser vide" />
                                            </div>
                                            <div className="col-12">
                                                <small className="text-muted"><i className="fas fa-info-circle mr-1"></i>Tous ces champs sont optionnels. Laissez vide pour une simple info.</small>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-default" onClick={() => setShowModal(false)} disabled={submitting}>Annuler</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Publication...</> : <><i className="fas fa-paper-plane mr-2"></i>Publier</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LecturerAnnouncements;
