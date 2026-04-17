import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import {getGradesByStudentId} from "../../../services/api/course";
import {getStudentDetailsByUsername} from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";

const Grades = () => {
    const [grades, setGrades] = useState([]);
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
        const fetchAndSetGrades = async () => {
            try {
                const username = fetchUser();
                const student = await getStudentDetailsByUsername(username);
                if (student) {
                    const gradesData = await getGradesByStudentId(student.id);
                    setGrades(gradesData || []);
                }
            } catch (error) {
                console.log("Error fetching grades:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndSetGrades();
    }, []);

    if (loading) {
        return <PageLoading />
    }

    return (
        <>
            <div className="content-header">
                <div className="container">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Vos Notes</h1>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item"><Link to={"/student"}>Accueil</Link></li>
                                <li className="breadcrumb-item active">Notes</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content">
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="card card-outline card-primary">
                                <div className="card-header">
                                    <h3 className="card-title">Résultats Académiques</h3>
                                </div>
                                <div className="card-body p-0">
                                    {grades.length === 0 ? (
                                        <div className="p-5 text-center text-muted">
                                            <i className="fas fa-graduation-cap fa-3x mb-3"></i>
                                            <p>Aucune note publiée pour le moment.</p>
                                        </div>
                                    ) : (
                                        <table className="table table-striped projects">
                                            <thead>
                                            <tr>
                                                <th style={{width: "30%"}}>Module</th>
                                                <th style={{width: "15%"}}>Note</th>
                                                <th style={{width: "15%"}}>Mention</th>
                                                <th style={{width: "40%"}}>Commentaires du Professeur</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {grades.map((grade: any) => (
                                                <tr key={grade.id}>
                                                    <td>
                                                        <strong>{grade.module?.title}</strong><br/>
                                                        <small>{grade.module?.mid}</small>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${grade.score >= 12 ? 'badge-success' : 'badge-warning'}`} style={{fontSize: '1rem'}}>
                                                            {grade.score} / 20
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="h4 m-0 font-weight-bold">{grade.grade}</div>
                                                    </td>
                                                    <td>
                                                        <p className="m-0 text-muted small">{grade.comments || "Aucun commentaire."}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Grades;
