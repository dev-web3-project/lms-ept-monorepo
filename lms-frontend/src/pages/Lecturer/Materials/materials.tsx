import {Link, useParams, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {getMaterialsByModuleId, getModuleById, createMaterial, deleteMaterial, uploadFile} from "../../../services/api/course";
import PageLoading from "../../../components/Admin/PageLoading";

const LecturerMaterials = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [module, setModule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [newMaterial, setNewMaterial] = useState({
        title: '',
        description: '',
        type: 'PDF',
        fileUrl: '',
        moduleId: id
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            if (id) {
                const moduleData = await getModuleById(id);
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

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAddMaterial = async (e: any) => {
        e.preventDefault();
        const isFileType = newMaterial.type === 'PDF' || newMaterial.type === 'DOCUMENT';
        try {
            setUploading(true);
            let fileUrl = newMaterial.fileUrl;
            if (isFileType && selectedFile) {
                const result = await uploadFile(selectedFile);
                fileUrl = result.url;
            }
            if (!fileUrl) {
                console.error("No file or URL provided");
                return;
            }
            await createMaterial({ ...newMaterial, fileUrl });
            setNewMaterial({
                title: '',
                description: '',
                type: 'PDF',
                fileUrl: '',
                moduleId: id
            });
            setSelectedFile(null);
            fetchData();
        } catch (error) {
            console.error("Error creating material:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (materialId: string) => {
        if (window.confirm("Are you sure you want to delete this material?")) {
            try {
                await deleteMaterial(materialId);
                fetchData();
            } catch (error) {
                console.error("Error deleting material:", error);
            }
        }
    };

    if (loading && !module) return <PageLoading />;

    return (
        <>
            <div className="content-header">
                <div className="container">
                    <div className="row mb-2">
                        <div className="col-sm-6 d-flex align-items-center">
                            <button 
                                onClick={() => navigate(`/lecturer/${id}`)}
                                className="btn btn-tool mr-2"
                                style={{ fontSize: '1.2rem', color: '#6c757d' }}
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <h1 className="m-0">Gérer les supports : {module?.title}</h1>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item"><Link to={"/lecturer"}>Accueil</Link></li>
                                <li className="breadcrumb-item active">Supports</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content">
                <div className="container">
                    <div className="row">
                        <div className="col-md-4">
                            <div className="card card-primary">
                                <div className="card-header">
                                    <h3 className="card-title">Ajouter une ressource</h3>
                                </div>
                                <form onSubmit={handleAddMaterial}>
                                    <div className="card-body">
                                        <div className="form-group">
                                            <label>Titre</label>
                                            <input type="text" className="form-control" required
                                                value={newMaterial.title}
                                                onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                                                placeholder="Entrez le titre"/>
                                        </div>
                                        <div className="form-group">
                                            <label>Description</label>
                                            <textarea className="form-control" rows={3}
                                                value={newMaterial.description}
                                                onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                                                placeholder="Entrez la description"></textarea>
                                        </div>
                                        <div className="form-group">
                                            <label>Type</label>
                                            <select className="form-control"
                                                value={newMaterial.type}
                                                onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}>
                                                <option value="PDF">Document PDF</option>
                                                <option value="VIDEO">Lien Vidéo</option>
                                                <option value="LINK">Site Web Externe</option>
                                                <option value="DOCUMENT">Autre Document</option>
                                            </select>
                                        </div>
                                        {(newMaterial.type === 'PDF' || newMaterial.type === 'DOCUMENT') ? (
                                            <div className="form-group">
                                                <label>Fichier {newMaterial.type === 'PDF' ? '(PDF)' : ''}</label>
                                                <input type="file" className="form-control"
                                                    accept={newMaterial.type === 'PDF' ? 'application/pdf' : undefined}
                                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                    required={!newMaterial.fileUrl}/>
                                                {selectedFile && (
                                                    <small className="text-muted d-block mt-1">
                                                        <i className="fas fa-file mr-1"></i>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                                    </small>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="form-group">
                                                <label>URL / Lien de la ressource</label>
                                                <input type="url" className="form-control" required
                                                    value={newMaterial.fileUrl}
                                                    onChange={(e) => setNewMaterial({...newMaterial, fileUrl: e.target.value})}
                                                    placeholder="https://..."/>
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-footer">
                                        <button type="submit" className="btn btn-primary btn-block" disabled={uploading}>
                                            {uploading ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Envoi...</>) : 'Mettre en ligne'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="col-md-8">
                            <div className="card card-outline card-primary">
                                <div className="card-header">
                                    <h3 className="card-title">Supports actuels</h3>
                                </div>
                                <div className="card-body p-0">
                                    {materials.length === 0 ? (
                                        <div className="p-5 text-center text-muted">
                                            <p>Aucun support n'a été mis en ligne pour ce module.</p>
                                        </div>
                                    ) : (
                                        <table className="table table-hover">
                                            <thead>
                                            <tr>
                                                <th>Ressource</th>
                                                <th>Type</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {materials.map((material: any) => (
                                                <tr key={material.id}>
                                                    <td>
                                                        <strong>{material.title}</strong><br/>
                                                        <small className="text-muted">{material.description}</small>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${material.type === 'PDF' ? 'badge-danger' : 'badge-info'}`}>
                                                            {material.type}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-info mr-1">
                                                            <i className="fas fa-eye"></i>
                                                        </a>
                                                        <button onClick={() => handleDelete(material.id)} className="btn btn-sm btn-danger">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
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

export default LecturerMaterials;