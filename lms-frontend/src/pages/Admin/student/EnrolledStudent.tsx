import { useEffect, useState } from "react";
import BreadCrumb from "../../../components/Admin/Breadcrumb";
import 'datatables.net-buttons-bs5';
import { Link, useNavigate } from "react-router-dom";
import { deleteStudent, getStudents } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";

const EnrolledStudent = () => {
    const [student, setStudent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const listStudents = async () => {
        try {
            const data = await getStudents();
            setStudent(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching students:", error);
            setStudent([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        listStudents().then(r => r);
    }, []);

    useEffect(() => {
        if (!loading && student) {
            const table = $('#student-table').DataTable({
                paging: (student?.length || 0) > 10,
                lengthChange: false,
                autoWidth: false,
                ordering: false,
                buttons: [
                    {
                        text: 'Create New',
                        action: function (e: any, dt: any, node: any, config: any) {
                            navigate("/admin/student/new");
                        },
                    },
                ],
            });
            table.buttons().container().appendTo('#student-table_wrapper .col-md-6:eq(0)');

            return () => {
                table.destroy();
            }
        }

    }, [loading]);

    const handleDelete = async (id: string) => {
        await deleteStudent(id);
        await listStudents();
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <section className="content p-0">
            <style>{`
                .dataTables_wrapper .dataTables_paginate .paginate_button.current, 
                .dataTables_wrapper .dataTables_paginate .paginate_button.current:hover {
                    background: #9fef00 !important;
                    border-color: #9fef00 !important;
                    color: #000 !important;
                    border-radius: 50px;
                    padding: 5px 15px;
                }
                .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
                    background: rgba(159, 239, 0, 0.1) !important;
                    border-color: #9fef00 !important;
                    color: #9fef00 !important;
                }
                .page-item.active .page-link {
                    background-color: #9fef00 !important;
                    border-color: #9fef00 !important;
                    color: #000 !important;
                }
                .btn-primary, .btn-info {
                    background-color: #9fef00 !important;
                    border-color: #9fef00 !important;
                    color: #000 !important;
                }
            `}</style>
            
            <div className="content-header p-0 pt-3">
                <div className="container-fluid">
                    <div className="row mb-2 align-items-center">

                        <div className="col-sm-6">
                            <h1 className="m-0 font-weight-bold ml-2" style={{ fontSize: '1.8rem', color: '#2c3e50' }}>
                                Étudiants Inscrits
                            </h1>
                        </div>
                        <div className="col-sm-5 text-right">
                            <BreadCrumb page_name="Inscrits" parent_name="Étudiants" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-fluid mt-3">
                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
                            <div className="card-body">
                                <table id="student-table" className="table table-hover text-nowrap">
                                    <thead>
                                    <tr>
                                        <th className="col-2">Matricule</th>
                                        <th className="col-3">Nom complet</th>
                                        <th className="col-2">Génie / Département</th>
                                        <th className="col-2">Niveau</th>
                                        <th className="col-2">Promotion</th>
                                        <th className="col-1"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        Array.isArray(student) && student.length > 0 ? (
                                            student.map((s: any) => (
                                                <tr key={s.id}>
                                                    <td className="font-weight-bold" style={{ color: '#9fef00' }}>{s.studentId}</td>
                                                    <td>
                                                        <Link to={`/admin/student/${s.username}/details`} className="text-white font-weight-medium text-decoration-none">
                                                            {s.fullName}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <span className="badge" style={{backgroundColor: 'rgba(159, 239, 0, 0.1)', color: '#9fef00', border: '1px solid #9fef00', padding: '5px 12px', borderRadius: '50px'}}>
                                                            {s.department || 'GIT'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-secondary" style={{ borderRadius: '50px', padding: '5px 12px' }}>{s.intake || 'DIC1'}</span>
                                                    </td>
                                                    <td className="text-muted small">2023-2024</td>
                                                    <td>
                                                        <i className="fas fa-ellipsis-v button-cursor-pointer text-muted"
                                                           id={`dropdownMenu-${s.id}`} data-toggle="dropdown"
                                                           aria-haspopup="true"></i>
                                                        <div className="dropdown-menu dropdown-menu-right shadow border-0">
                                                            <a className="dropdown-item py-2"
                                                               href={`/admin/student/${s.username}/details`}>
                                                                <i className="fas fa-eye mr-2 text-success"></i> Voir Détails
                                                            </a>
                                                            <div className="dropdown-divider"></div>
                                                            <a className="dropdown-item text-danger py-2" type="button"
                                                               onClick={() => handleDelete(s.username)}>
                                                                <i className="fas fa-trash mr-2"></i> Supprimer
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <></>
                                        )
                                    }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default EnrolledStudent;