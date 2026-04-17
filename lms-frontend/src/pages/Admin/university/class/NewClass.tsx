import { useNavigate } from "react-router-dom";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import { createClass } from "../../../../services/api/usiversity";
import { CreateButton } from "../../../../components/Admin/ButtonIndicator";
import { useState } from "react";

const NewClass = () => {

    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false)

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsCreating(true);
        const create = createClass({
            name: e.target.name.value,
            description: e.target.description.value
        });

        if (create && await create.then((res) => res?.status) === 201) {
            e.target.reset();

            const id = await create.then((res) => res?.data.id);

            navigate(`/admin/university/class/${id}/details`);
        }
        setIsCreating(false);
    }

    return (
        <section className="content">
            < BreadCrumb page_name="Classe" parent_name="Université" />
            <div className="container-fluid">
                <div className="mb-4 d-flex align-items-center">
                    <button 
                        onClick={() => navigate("/admin/university/class")} 
                        className="btn btn-light shadow-sm d-flex align-items-center justify-content-center"
                        style={{ width: '42px', height: '42px', borderRadius: '50%', color: '#3b82f6', background: '#ffffff', border: '1px solid #e2e8f0', transition: 'all 0.2s', marginRight: '1rem' }}
                        title="Retour"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h3 className="mb-0 font-weight-bold">Nouvelle Classe</h3>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="card col-md-8">
                            <form className="form-horizontal" id="createRoleForm" onSubmit={handleSubmit}>
                                <div className="card-body">
                                    <div className="form-group row">
                                        <label htmlFor="name" className="col-sm-2 col-form-label">Nom de la classe <span className="text-danger">*</span></label>
                                        <div className="col-sm-10">
                                            <input type="text" className="form-control" id="name" name="name" required />
                                        </div>
                                    </div>
                                    <div className="form-group row">
                                        <label htmlFor="description" className="col-sm-2 col-form-label">Description</label>
                                        <div className="col-sm-10">
                                            <textarea className="form-control" id="description" name="description"></textarea>
                                        </div>
                                    </div>
                                    <div className="form-group row mt-4">
                                        <label className="col-sm-2 col-form-label"></label>
                                        <div className="col-sm-10 d-flex">
                                            <CreateButton isSaving={isCreating} />
                                            <button type="reset" className="btn btn-default float-right" onClick={() => navigate("/admin/university/class")}>Annuler</button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default NewClass;
