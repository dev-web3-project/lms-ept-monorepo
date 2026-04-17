import { h } from 'gridjs';
import { Grid } from 'gridjs-react';
import { useEffect, useState } from 'react';
import BreadCrumb from "../../../components/Admin/Breadcrumb";
import { Link } from 'react-router-dom';
import { deleteAnnouncement, getAllAnnouncements } from '../../../services/api/announcement';
import PageLoading from '../../../components/Admin/PageLoading';

const AUDIENCE_BADGES: Record<string, string> = {
  ALL:       'badge-secondary',
  STUDENTS:  'badge-info',
  LECTURERS: 'badge-warning',
  COURSE:    'badge-primary',
  CLASS:     'badge-success',
};

const Announcements = () => {

    const [rows, setRows] = useState<(string | null)[][]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = async () => {
        const all = await getAllAnnouncements();
        if (Array.isArray(all)) {
            const mapped = all.map((a: any) => [
                String(a.id),
                a.title || '',
                a.description || '',
                (a.type || '').toUpperCase(),
                a.targetAudience || 'ALL',
                a.targetId || '—',
            ]);
            setRows(mapped);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cette annonce ?')) return;
        await deleteAnnouncement(id);
        fetchAnnouncements();
    };

    if (loading) return <PageLoading />;

    return (
        <section className="content">
            <div className="d-flex align-items-center mb-3">
                <button 
                    onClick={() => window.history.back()} 
                    className="btn btn-light shadow-sm d-flex align-items-center justify-content-center"
                    style={{ width: '42px', height: '42px', borderRadius: '50%', color: '#3b82f6', background: '#ffffff', border: '1px solid #e2e8f0', transition: 'all 0.2s', marginRight: '1rem' }}
                    title="Retour"
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
            </div>
            <BreadCrumb page_name="Liste" parent_name="Annonces" />
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card card-primary card-outline shadow-lg">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <Link to="/admin/announcements/new" className="btn btn-primary">
                                    <i className="fas fa-plus mr-1" /> Nouvelle annonce
                                </Link>
                            </div>
                            <div className="card-body">
                                <Grid
                                    data={rows}
                                    columns={[
                                        { name: 'ID', hidden: true },
                                        { name: 'Titre' },
                                        { name: 'Description' },
                                        { name: 'Type', width: '12%' },
                                        {
                                            name: 'Audience',
                                            width: '13%',
                                            formatter: (cell: any) => {
                                                const cls = AUDIENCE_BADGES[cell] || 'badge-secondary';
                                                return h('span', { className: `badge ${cls}` }, cell);
                                            }
                                        },
                                        { name: 'Cible', width: '12%' },
                                        {
                                            name: 'Actions',
                                            width: '12%',
                                            formatter: (_: any, row: any) => {
                                                return h(
                                                    'div',
                                                    { className: 'action-buttons' },
                                                    h('button', {
                                                        className: 'btn btn-danger btn-flat btn-sm ml-1',
                                                        onClick: () => handleDelete(`${row.cells[0].data}`)
                                                    }, h('i', { className: 'fas fa-trash' }))
                                                );
                                            }
                                        }
                                    ]}
                                    search={true}
                                    pagination={{ limit: 10 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};


const gridStyles = `
  .gridjs-container {
    color: var(--text-primary);
    padding: 0;
  }
  .gridjs-wrapper {
    box-shadow: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .gridjs-table {
    background-color: var(--bg-card) !important;
    width: 100%;
  }
  .gridjs-th {
    background-color: var(--bg-elevated) !important;
    color: var(--text-muted) !important;
    border: 1px solid var(--border) !important;
    padding: 12px 15px !important;
    font-weight: 700;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.7px;
  }
  .gridjs-td {
    background-color: var(--bg-card) !important;
    border: 1px solid var(--border-light) !important;
    color: var(--text-primary) !important;
    padding: 12px 15px !important;
  }
  .gridjs-tr:hover .gridjs-td {
    background-color: var(--bg-hover) !important;
  }
  .gridjs-search {
    float: right;
    margin-bottom: 15px;
  }
  .gridjs-search-input {
    background-color: var(--bg-input) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-primary) !important;
    border-radius: var(--radius-sm);
    padding: 8px 12px;
  }
  .gridjs-search-input:focus {
    border-color: var(--green) !important;
    box-shadow: 0 0 0 2px var(--green-dim) !important;
  }
  .gridjs-footer {
    background-color: var(--bg-card) !important;
    border: none;
    padding: 15px 0 0 0;
  }
  .gridjs-pagination .gridjs-summary {
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .gridjs-pagination .gridjs-pages button {
    background-color: var(--bg-elevated) !important;
    color: var(--text-secondary) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-sm);
    padding: 5px 12px;
    margin-left: 5px;
  }
  .gridjs-pagination .gridjs-pages button:hover {
    background-color: var(--bg-hover) !important;
    color: var(--green) !important;
  }
  .gridjs-pagination .gridjs-pages button.gridjs-currentPage {
    background-color: var(--green) !important;
    color: var(--bg-base) !important;
    font-weight: 700;
  }
  .gridjs-pagination .gridjs-pages button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export default function AnnouncementsWithStyle() {
  return (
    <>
      <style>{gridStyles}</style>
      <Announcements />
    </>
  );
}