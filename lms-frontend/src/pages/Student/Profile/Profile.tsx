import {Link} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {getStudentDetailsByUsername} from "../../../services/api/user";
import {getCourseById} from "../../../services/api/course";
import {getDepartmentById} from "../../../services/api/usiversity";
import {getGamificationProfile} from "../../../services/api/gamification";

import PageLoading from "../../../components/Admin/PageLoading";

const Profile = () => {

    const [userDetails, setUserDetails] = useState<any>({});
    const [academicInfo, setAcademicInfo] = useState<any>({
        course: "Loading...",
        department: "Loading...",
        faculty: "Loading..."
    });
    const [gamificationInfo, setGamificationInfo] = useState<any>({
        xpPoints: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        badges: []
    });
    const [loading, setLoading] = useState(true);

    const fetchUser = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const user = JSON.parse(stored);
            return user.username || user.email || '';
        }
        return null;
    };

    useEffect(() => {
        const fetchAndSetUserDetails = async () => {
            try {
                const username = fetchUser();
                const student = await getStudentDetailsByUsername(username);
                setUserDetails(student);

                // Fetch Academic Details
                if (student.courseId) {
                    const course = await getCourseById(student.courseId);
                    if (course) {
                        const dept = await getDepartmentById(course.departmentId);
                        if (dept) {
                            setAcademicInfo({
                                course: course.title,
                                department: dept.name,
                                faculty: "École Polytechnique de Thiès"
                            });
                        } else {
                            setAcademicInfo((prev: any) => ({...prev, course: course.title, department: "Not Assigned", faculty: "École Polytechnique de Thiès"}));
                        }

                    }
                } else {
                    setAcademicInfo({
                        course: "Not Enrolled",
                        department: "N/A",
                        faculty: "N/A"
                    });
                }
                
                // Fetch Gamification Details
                try {
                    const gamification = await getGamificationProfile(username);
                    setGamificationInfo(gamification);
                } catch (e) {
                    console.log("Could not load gamification details");
                }

            } catch (error) {
                console.log("Error fetching user details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndSetUserDetails();
    }, []);

    const handleResetSubmit = async (e: any) => {
        e.preventDefault();
        alert("Password reset functionality is not implemented in this local version.");
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <>
            <div className="content-header">
                <div className="container">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Profil de {userDetails.fullName || userDetails.firstName || 'Étudiant'}</h1>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item"><Link to={"/student"}>Étudiant</Link></li>
                                <li className="breadcrumb-item active">Profil</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
            <div className="content">
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="card card-primary card-outline card-outline-tabs">
                                <div className="card-header p-0 border-bottom-0">
                                    <ul className="nav nav-tabs" id="custom-tabs-four-tab" role="tablist">
                                        <li className="nav-item">
                                            <a className="nav-link active" id="custom-tabs-four-details-tab"
                                               data-toggle="pill" href={"#custom-tabs-four-details"} role="tab"
                                               aria-controls="custom-tabs-four-details" aria-selected="true">Général</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link" id="custom-tabs-four-guardian-tab"
                                               data-toggle="pill"
                                               href={"#custom-tabs-four-guardian"} role="tab"
                                               aria-controls="custom-tabs-four-guardian"
                                               aria-selected="false">Tuteur</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link" id="custom-tabs-four-academic-tab"
                                               data-toggle="pill"
                                               href={"#custom-tabs-four-academic"} role="tab"
                                               aria-controls="custom-tabs-four-academic"
                                               aria-selected="false">Académique</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link" id="custom-tabs-four-credentials-tab"
                                               data-toggle="pill"
                                               href={"#custom-tabs-four-credentials"} role="tab"
                                               aria-controls="custom-tabs-four-credentials"
                                               aria-selected="false">Identifiants</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link text-success" id="custom-tabs-four-gamification-tab"
                                               data-toggle="pill"
                                               href={"#custom-tabs-four-gamification"} role="tab"
                                               aria-controls="custom-tabs-four-gamification"
                                               aria-selected="false">🎮 Gamification</a>
                                        </li>
                                    </ul>
                                </div>
                                <div className="card-body">
                                    <div className="tab-content" id="custom-tabs-four-tabContent">
                                        <div className="tab-pane fade show active" id="custom-tabs-four-details"
                                             role="tabpanel" aria-labelledby="custom-tabs-four-details-tab">
                                            <form className="form-horizontal">
                                                <div className="card-body">
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Matricule</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={userDetails.studentId} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Date d'inscription</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={new Date(userDetails.joiningDate).toLocaleDateString()} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Nom complet</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={userDetails.fullName} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Téléphone</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={userDetails.phone} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Email</label>
                                                        <div className="col-sm-10">
                                                            <input type="email" className="form-control" value={userDetails.email} disabled/>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="tab-pane fade" id="custom-tabs-four-guardian" role="tabpanel">
                                            <form className="form-horizontal">
                                                <div className="card-body">
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Nom du tuteur</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={userDetails.guardianName} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Relation</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={userDetails.guardianRelationship} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Téléphone</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={userDetails.guardianPhone} disabled/>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="tab-pane fade" id="custom-tabs-four-academic" role="tabpanel">
                                            <form className="form-horizontal">
                                                <div className="card-body">
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Faculté</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={academicInfo.faculty} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Département</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={academicInfo.department} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Niveau</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={userDetails.intake || 'DIC2'} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Filière / Cours</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={academicInfo.course} disabled/>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="tab-pane fade" id="custom-tabs-four-credentials" role="tabpanel">
                                            <form className="form-horizontal" onSubmit={handleResetSubmit}>
                                                <div className="card-body">
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Nom d'utilisateur</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" value={userDetails.username} disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row mt-4">
                                                        <label className="col-sm-2 col-form-label"></label>
                                                        <div className="col-sm-10">
                                                            <button type="submit" className="btn btn-primary">Demander la réinitialisation du mot de passe</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        
                                        <div className="tab-pane fade" id="custom-tabs-four-gamification" role="tabpanel">
                                            <div className="card-body">
                                                {/* Stats row */}
                                                <div className="row text-center mb-4">
                                                    <div className="col-4">
                                                        <h3 style={{color: '#9fef00', fontWeight: 900}}>{gamificationInfo.level}</h3>
                                                        <p className="text-muted text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>Niveau</p>
                                                    </div>
                                                    <div className="col-4">
                                                        <h3 style={{color: '#2cb5e8', fontWeight: 900}}>{gamificationInfo.xpPoints}</h3>
                                                        <p className="text-muted text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>Points XP</p>
                                                    </div>
                                                    <div className="col-4">
                                                        <h3 style={{color: '#ffaf00', fontWeight: 900}}>🔥 {gamificationInfo.currentStreak}</h3>
                                                        <p className="text-muted text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>Série (max {gamificationInfo.longestStreak})</p>
                                                    </div>
                                                </div>

                                                {/* XP Progress bar */}
                                                <h5 className="mb-2" style={{borderBottom: '1px solid #2a3f5f', paddingBottom: '8px', fontSize: '.9rem'}}>
                                                    Progression → Niveau {gamificationInfo.level + 1}
                                                </h5>
                                                <div className="progress mb-4" style={{backgroundColor: '#111927', height: '16px', borderRadius: 99}}>
                                                    <div
                                                        className="progress-bar"
                                                        style={{width: `${gamificationInfo.xpPoints % 100}%`, backgroundColor: '#9fef00', borderRadius: 99, transition: 'width .6s ease'}}
                                                        role="progressbar"
                                                        aria-valuenow={gamificationInfo.xpPoints % 100}
                                                        aria-valuemin={0} aria-valuemax={100}
                                                    >
                                                        {gamificationInfo.xpPoints % 100} / 100 XP
                                                    </div>
                                                </div>

                                                {/* Badges */}
                                                <h5 className="mb-3" style={{borderBottom: '1px solid #2a3f5f', paddingBottom: '8px', fontSize: '.9rem'}}>
                                                    Badges ({gamificationInfo.badges?.length || 0})
                                                </h5>
                                                {(!gamificationInfo.badges || gamificationInfo.badges.length === 0) ? (
                                                    <div style={{background: '#111927', border: '1px solid #2a3f5f', borderRadius: 8, padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem'}}>
                                                        <span style={{fontSize: '2rem'}}>🏅</span>
                                                        <p className="text-muted mt-2 mb-0" style={{fontSize: '.85rem'}}>Aucun badge pour le moment. Complétez des quiz et participez au forum !</p>
                                                    </div>
                                                ) : (
                                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '.75rem', marginBottom: '1.5rem'}}>
                                                        {gamificationInfo.badges.map((badge: any) => (
                                                            <div key={badge.id} style={{background: '#111927', border: '1px solid rgba(159,239,0,.3)', borderRadius: 10, padding: '.9rem', textAlign: 'center', boxShadow: '0 0 12px rgba(159,239,0,.08)'}}>
                                                                <div style={{fontSize: '1.8rem', marginBottom: '.3rem'}}>{badge.icon || '🏅'}</div>
                                                                <div style={{color: '#9fef00', fontWeight: 700, fontSize: '.8rem'}}>{badge.name}</div>
                                                                {badge.description && <div style={{color: '#556987', fontSize: '.7rem', marginTop: '.2rem'}}>{badge.description}</div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Mentorship shortcut */}
                                                <h5 className="mb-3" style={{borderBottom: '1px solid #2a3f5f', paddingBottom: '8px', fontSize: '.9rem'}}>Mentorat</h5>
                                                <Link to="/student/mentorship" style={{display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.55rem 1.1rem', background: 'rgba(44,181,232,.1)', border: '1px solid rgba(44,181,232,.4)', borderRadius: 8, color: '#2cb5e8', fontWeight: 700, fontSize: '.85rem', textDecoration: 'none'}}>
                                                    🤝 Gérer mes demandes de mentorat
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Profile;