import { useEffect, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import 'datatables.net-buttons-bs5';
import { Link, useNavigate } from "react-router-dom";
import { deleteModule, getModules } from "../../../../services/api/course";
import PageLoading from "../../../../components/Admin/PageLoading";

const Module = () => {
    const [module, setModule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const listModules = async () => {
        const data = await getModules();
        setModule(data);
        setLoading(false);
    }

    useEffect(() => {
        listModules().then(r => r);
    }, []);

    useEffect(() => {
        if (!loading) {
            const table = $('#module-table').DataTable({
                lengthChange: false,
                autoWidth: false,
                ordering: false,
                buttons: [
                    {
                        text: 'Create New',
                        action: function (e: any, dt: any, node: any, config: any) {
                            navigate("/admin/university/module/new");
                        },
                    },
                ],
            });
            table.buttons().container().appendTo('#module-table_wrapper .col-md-6:eq(0)');

            return () => {
                table.destroy();
            }
        }

    }, [loading]);

    const handleDelete = async (id: string) => {
        await deleteModule(id);
        await listModules();
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
                                Modules (EC)
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
                                <table id="module-table" className="table table-hover text-nowrap">
                                    <thead>
                                    <tr>
                                        <th className="col-2">ID Module</th>
                                        <th className="col-4">Nom du Module</th>
                                        <th className="col-3">Crédits</th>
                                        <th className="col-1"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        Array.isArray(module) && module.length > 0 ? (
                                            module.map((f: any) => (
                                                <tr key={f.id}>
                                                    <td><code>{f.codeEC}</code></td>
                                                    <td>
                                                        <Link to={`/admin/university/module/${f.id}/details`} className="font-weight-bold">
                                                            {f.name}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-info">{f.creditsEC || 0} crédits</span>
                                                    </td>
                                                    <td className="text-right">
                                                        <i className="fas fa-ellipsis-v button-cursor-pointer"
                                                           id={`dropdown-${f.id}`} data-toggle="dropdown"
                                                           aria-haspopup="true"></i>
                                                        <div className="dropdown-menu dropdown-menu-right"
                                                              aria-labelledby={`dropdown-${f.id}`}>
                                                            <Link className="dropdown-item"
                                                                to={`/admin/university/module/${f.id}/details`}>
                                                                <i className="fas fa-edit mr-2"></i> Modifier
                                                            </Link>
                                                            <div className="dropdown-divider"></div>
                                                            <button className="dropdown-item text-danger" type="button"
                                                                onClick={() => handleDelete(f.id)}>
                                                                <i className="fas fa-trash-alt mr-2"></i> Supprimer
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center text-muted py-4">
                                                    Aucun module trouvé
                                                </td>
                                            </tr>
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

export default Module;