import {Link} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {getLecturerDetailsByUsername} from "../../../services/api/user";

import PageLoading from "../../../components/Admin/PageLoading";

const LecturerProfile = () => {

    const [userDetails, setuserDetails] = useState<any>({});
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
                const userDetails = await getLecturerDetailsByUsername(username);
                setuserDetails(userDetails);
            } catch (error) {
                console.log("Error fetching user details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndSetUserDetails().then(r => r);
    }, []);

    const handleResetSubmit = async (e: any) => {
        e.preventDefault();
        console.log("Resetting password");
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
                            <h1 className="m-0">Profil</h1>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item"><Link to={"/lecturer"}>Professeur</Link></li>
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
                                    </ul>
                                </div>
                                <div className="card-body">
                                    {loading ? (
                                        <div>Loading...</div>
                                    ) : (
                                        <div className="tab-content" id="custom-tabs-four-tabContent">
                                            <div className="tab-pane fade show active" id="custom-tabs-four-details"
                                                 role="tabpanel" aria-labelledby="custom-tabs-four-details-tab">
                                                <form className="form-horizontal">
                                                    <div className="card-body">
                                                        <div className="form-group row">
                                                            <label className="col-sm-2 col-form-label">ID Professeur</label>
                                                            <div className="col-sm-10">
                                                                <input type="text" className="form-control" value={userDetails.lecturerId} disabled/>
                                                            </div>
                                                        </div>
                                                        <div className="form-group row">
                                                            <label className="col-sm-2 col-form-label">Date d'arrivée</label>
                                                            <div className="col-sm-10">
                                                                <input type="text" className="form-control" value={userDetails.joiningDate ? new Date(userDetails.joiningDate).toLocaleDateString() : ''} disabled/>
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
                                                            <label htmlFor="email"
                                                                   className="col-sm-2 col-form-label">Email</label>
                                                            <div className="col-sm-10">
                                                                <input type="email" className="form-control" id="email"
                                                                       name="email" value={userDetails.email} disabled/>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>

                                            <div className="tab-pane fade" id="custom-tabs-four-academic"
                                                 role="tabpanel"
                                                 aria-labelledby="custom-tabs-four-academic-tab">
                                                <form className="form-horizontal" id="createAcademicForm">
                                                    <div className="card-body">
                                                        <div className="form-group row">
                                                            <label htmlFor="faculty"
                                                                   className="col-sm-2 col-form-label">Faculté</label>
                                                            <div className="col-sm-10">
                                                                <input type="text" className="form-control"
                                                                       id="faculty"
                                                                       name="faculty"
                                                                       value={userDetails.faculty || ''}
                                                                       disabled/>
                                                            </div>
                                                        </div>
                                                        <div className="form-group row">
                                                            <label htmlFor="department"
                                                                   className="col-sm-2 col-form-label">Département</label>
                                                            <div className="col-sm-10">
                                                                <input type="text" className="form-control"
                                                                       id="department"
                                                                       name="department"
                                                                       value={userDetails.department || ''}
                                                                       disabled/>
                                                            </div>
                                                        </div>
                                                        <div className="form-group row">
                                                            <label htmlFor="course"
                                                                   className="col-sm-2 col-form-label">Cours</label>
                                                            <div className="col-sm-10">
                                                                <input type="text" className="form-control"
                                                                       id="course"
                                                                       name="course"
                                                                       value={userDetails.course || ''}
                                                                       disabled/>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>

                                            <div className="tab-pane fade" id="custom-tabs-four-credentials"
                                                 role="tabpanel"
                                                 aria-labelledby="custom-tabs-four-credentials-tab">
                                                <form className="form-horizontal" id="createRoleForm"
                                                      onSubmit={handleResetSubmit}>
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
                                                                <button type="submit" className="btn btn-primary">Réinitialiser le mot de passe</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                        {/* /.col */}
                    </div>
                </div>
            </div>
        </>
    );
}

export default LecturerProfile;