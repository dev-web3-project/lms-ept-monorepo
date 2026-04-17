import {Link, useParams, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {getMaterialsByModuleId, getModuleById} from "../../../services/api/course";
import PageLoading from "../../../components/Admin/PageLoading";

const Materials = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [module, setModule] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (id) {
                    const moduleData = id && id !== 'modules' ? await getModuleById(id) : null;
                    setModule(moduleData);
                    const materialsData = await getMaterialsByModuleId(id);
                    setMaterials(materialsData || []);
                }
            } catch (error) {
                console.error("Error fetching materials:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const stripCode = (title: string) => {
        if (!title) return '';
        return title.replace(/^\[.*?\]\s*/, '');
    };

    if (loading) return <PageLoading />;

    return (
        <>
            <div className="content-header">
                <div className="container">
                    <div className="row mb-2">
                        <div className="col-sm-6 d-flex align-items-center">
                            <button 
                                onClick={() => navigate(`/student/${id}`)}
                                className="btn btn-tool mr-2"
                                style={{ fontSize: '1.2rem', color: '#6c757d' }}
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <h1 className="m-0">Supports de cours : {stripCode(module?.title)}</h1>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item"><Link to={"/student"}>Accueil</Link></li>
                                <li className="breadcrumb-item active">Supports</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content">
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="card card-primary card-outline">
                                <div className="card-header">
                                    <h3 className="card-title">Ressources disponibles</h3>
                                </div>
                                <div className="card-body p-0">
                                    {materials.length === 0 ? (
                                        <div className="p-5 text-center text-muted">
                                            <i className="fas fa-folder-open fa-3x mb-3"></i>
                                            <p>Aucun support disponible pour ce module pour le moment.</p>
                                        </div>
                                    ) : (
                                        <table className="table table-striped projects">
                                            <thead>
                                            <tr>
                                                <th style={{width: "20%"}}>Type</th>
                                                <th style={{width: "40%"}}>Titre</th>
                                                <th style={{width: "30%"}}>Description</th>
                                                <th style={{width: "10%"}} className="text-center">Action</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {materials.map((material: any) => (
                                                <tr key={material.id}>
                                                    <td>
                                                        {material.type === 'PDF' && <span className="badge badge-danger"><i className="fas fa-file-pdf mr-1"></i> PDF</span>}
                                                        {material.type === 'VIDEO' && <span className="badge badge-primary"><i className="fas fa-video mr-1"></i> VIDEO</span>}
                                                        {material.type === 'LINK' && <span className="badge badge-info"><i className="fas fa-link mr-1"></i> LINK</span>}
                                                        {material.type === 'DOCUMENT' && <span className="badge badge-success"><i className="fas fa-file-word mr-1"></i> DOC</span>}
                                                    </td>
                                                    <td>
                                                        <strong>{material.title}</strong>
                                                    </td>
                                                    <td>
                                                        <small>{material.description}</small>
                                                    </td>
                                                    <td className="text-center">
                                                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                                                            <i className="fas fa-external-link-alt"></i> Ouvrir
                                                        </a>
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

export default Materials;