import { useEffect, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import { deleteDepartment, getDepartments } from "../../../../services/api/usiversity";
import { Link, useNavigate } from "react-router-dom";
import PageLoading from "../../../../components/Admin/PageLoading";


const Department = () => {

    const [department, setDepartment] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const listDepartments = async () => {
        const data = await getDepartments();
        setDepartment(data);
        setLoading(false);
    }

    useEffect(() => {
        listDepartments();
    }, []);

    useEffect(() => {
        if (!loading) {
            const table = $('#department-table').DataTable({
                lengthChange: false,
                autoWidth: false,
                ordering: false,
                buttons: [
                    {
                        text: 'Create New',
                        action: function (e: any, dt: any, node: any, config: any) {
                            navigate("/admin/university/department/new");
                        },
                    },
                ],
            });
            table.buttons().container().appendTo('#department-table_wrapper .col-md-6:eq(0)');

            return () => {
                table.destroy();
            }
        }

    }, [loading]);

    const handleDelete = async (id: string) => {
        await deleteDepartment(id);
        listDepartments();
    }

    if (loading) {
        return <PageLoading />
    }

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
                                Départements
                            </h1>
                        </div>
                        <div className="col-sm-5 text-right">
                            <BreadCrumb page_name="Liste" parent_name="Université" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-fluid mt-3">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <table id="department-table" className="table table-hover text-nowrap">
                                    <thead>
                                    <tr>
                                        <th className="col-2">ID Département</th>
                                        <th className="col-4">Nom du Département</th>
                                        <th className="col-3">Filières</th>
                                        <th className="col-1"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            Array.isArray(department) && department.length > 0 ? (
                                                department.map((f: any) => (
                                                    <tr key={f.id}>
                                                        <td>{f.did}</td>
                                                        <td><Link
                                                            to={`/admin/university/department/${f.id}/details`}>{f.name}</Link>
                                                        </td>
                                                        <td>{f.courses?.length || 0}</td>
                                                        <td>
                                                            <i className="fas fa-ellipsis-v button-cursor-pointer"
                                                               id="dropdownMenuButton1" data-toggle="dropdown"
                                                               aria-haspopup="true"></i>
                                                            <div className="dropdown-menu"
                                                                 aria-labelledby="dropdownMenuButton1">
                                                                <a className="dropdown-item"
                                                                   href={`/admin/university/department/${f.id}/details`}>Modifier</a>
                                                                <a className="dropdown-item text-danger" type="button"
                                                                   onClick={() => handleDelete(f.id)}>Supprimer</a>
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

export default Department;