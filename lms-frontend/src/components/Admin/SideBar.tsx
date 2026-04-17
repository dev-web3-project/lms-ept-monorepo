import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getCycles, getDepartmentsByCycleId } from "../../services/api/usiversity";
import UnreadBadge from "../UnreadBadge";

type Department = { id: number; name: string };

const Sidebar = () => {
    const [username, setUsername] = useState("");
    const [openMenus, setOpenMenus] = useState({ tc: false, cycle: false });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [cycleIngId, setCycleIngId] = useState<number | null>(null);
    const location = useLocation();

    useEffect(() => {
        fetchUser();
        loadIngenieurDepartments();
    }, []);

    useEffect(() => {
        // Auto-open the menu whose content matches the current URL
        const params = new URLSearchParams(location.search);
        const dep = params.get('department');
        const q = params.get('q');
        if (q === 'TC1' || q === 'TC2') setOpenMenus(prev => ({ ...prev, tc: true }));
        if (dep) setOpenMenus(prev => ({ ...prev, cycle: true }));
    }, [location]);

    const loadIngenieurDepartments = async () => {
        try {
            const cycles = await getCycles();
            const list = Array.isArray(cycles) ? cycles : [];
            const ing = list.find((c: any) => (c.name || '').toLowerCase().includes('ingénieur') || (c.name || '').toLowerCase().includes('ingenieur'));
            if (!ing) return;
            setCycleIngId(ing.id);
            const deps = await getDepartmentsByCycleId(String(ing.id));
            setDepartments(Array.isArray(deps) ? deps : []);
        } catch { /* silent */ }
    };

    const toggleMenu = (menu: 'tc' | 'cycle') => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    const fetchUser = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const user = JSON.parse(stored);
                setUsername(user.username || user.email || 'Admin');
            } catch {
                setUsername('Admin');
            }
        }
    };

    // Extract short label (use abbreviation field if available)
    const shortLabel = (dep: any) => {
        return dep.abbreviation || dep.name;
    };

    const isTcActive = (q: string) =>
        location.pathname === '/admin/university/class' && location.search === `?q=${q}`;
    
    const isDeptActive = (id: number) => {
        const params = new URLSearchParams(location.search);
        return location.pathname === '/admin/university/class' && params.get('department') === String(id);
    };

    const isTcParentActive = useMemo(() => {
        const q = new URLSearchParams(location.search).get('q');
        return location.pathname === '/admin/university/class' && (q === 'TC1' || q === 'TC2');
    }, [location]);

    const isCycleParentActive = useMemo(() => {
        const dep = new URLSearchParams(location.search).get('department');
        return location.pathname === '/admin/university/class' && !!dep;
    }, [location]);

    return (
        <aside className="main-sidebar sidebar-dark-primary elevation-4">
            <a href="/admin/index" className="brand-link">
                <img src="/dist/img/main-logo.png" alt="LMS Logo" className="brand-image img-circle elevation-3" style={{ opacity: 0.9, width: '38px', height: '38px' }} />
                <span className="brand-text">ADMINISTRATION</span>
            </a>

            <div className="sidebar">
                <div className="user-panel mt-3 pb-3 mb-3 d-flex">
                    <div className="image">
                        <img src="/dist/img/default-user.png" className="img-circle elevation-2" alt="User" />
                    </div>
                    <div className="info">
                        <NavLink to="/profile" className="d-block">{username}</NavLink>
                    </div>
                </div>

                <nav className="mt-2">
                    <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">

                        <li className="nav-item">
                            <NavLink to="/admin/index" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-th-large"></i>
                                <p>Tableau de bord</p>
                            </NavLink>
                        </li>

                        <li className="nav-header">ACADÉMIQUE</li>

                        {/* Tronc Commun */}
                        <li className={`nav-item ${openMenus.tc ? 'menu-open' : ''}`}>
                            <a
                                href="#"
                                className={`nav-link ${isTcParentActive ? 'active' : ''}`}
                                onClick={(e) => { e.preventDefault(); toggleMenu('tc'); }}
                            >
                                <i className="nav-icon fas fa-book"></i>
                                <p>
                                    Tronc Commun
                                    <i className={`right fas fa-angle-left ${openMenus.tc ? 'rotate-90' : ''}`}></i>
                                </p>
                            </a>
                            <ul className="nav nav-treeview" style={{ display: openMenus.tc ? 'block' : 'none' }}>
                                <li className="nav-item">
                                    <NavLink
                                        to="/admin/university/class?q=TC1"
                                        className={() => `nav-link child-link ${isTcActive('TC1') ? 'active' : ''}`}
                                    >
                                        <i className="far fa-circle nav-icon"></i>
                                        <p>TC1</p>
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink
                                        to="/admin/university/class?q=TC2"
                                        className={() => `nav-link child-link ${isTcActive('TC2') ? 'active' : ''}`}
                                    >
                                        <i className="far fa-circle nav-icon"></i>
                                        <p>TC2</p>
                                    </NavLink>
                                </li>
                            </ul>
                        </li>

                        {/* Cycle Ingénieur — lists departments dynamically */}
                        <li className={`nav-item ${openMenus.cycle ? 'menu-open' : ''}`}>
                            <a
                                href="#"
                                className={`nav-link ${isCycleParentActive ? 'active' : ''}`}
                                onClick={(e) => { e.preventDefault(); toggleMenu('cycle'); }}
                            >
                                <i className="nav-icon fas fa-cogs"></i>
                                <p>
                                    Cycle Ingénieur
                                    <i className={`right fas fa-angle-left ${openMenus.cycle ? 'rotate-90' : ''}`}></i>
                                </p>
                            </a>
                            <ul className="nav nav-treeview" style={{ display: openMenus.cycle ? 'block' : 'none' }}>
                                {departments.length === 0 ? (
                                    <li className="nav-item">
                                        <span className="nav-link text-muted"><small>Chargement...</small></span>
                                    </li>
                                ) : departments.map(dep => (
                                    <li key={dep.id} className="nav-item">
                                            <NavLink
                                                to={`/admin/university/class?department=${dep.id}`}
                                                className={() => `nav-link child-link ${isDeptActive(dep.id) ? 'active' : ''}`}
                                                title={dep.name}
                                            >
                                                <i className="far fa-circle nav-icon"></i>
                                                <p>{shortLabel(dep)}</p>
                                            </NavLink>
                                        </li>
                                    ))}
                                    {cycleIngId && (
                                        <li className="nav-item">
                                            <NavLink
                                                to={`/admin/university/cycle/${cycleIngId}/details`}
                                                className="nav-link child-link"
                                            >
                                                <i className="far fa-circle nav-icon text-muted"></i>
                                                <p><small className="text-muted">Gérer le cycle</small></p>
                                            </NavLink>
                                        </li>
                                    )}
                                </ul>
                            </li>

                            <li className="nav-header">UTILISATEURS</li>

                            <li className="nav-item">
                                <NavLink to="/admin/student/enrolled" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                    <i className="nav-icon fas fa-user-graduate"></i>
                                    <p>Gestion des Étudiants</p>
                                </NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/admin/lecturer/all" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                    <i className="nav-icon fas fa-chalkboard-teacher"></i>
                                    <p>Corps Enseignant</p>
                                </NavLink>
                            </li>

                            <li className="nav-header">COMMUNICATION</li>

                            <li className="nav-item">
                                <NavLink to="/admin/announcements" className="nav-link">
                                    <i className="nav-icon fas fa-bullhorn"></i>
                                    <p>Annonces</p>
                                </NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/admin/messages" className="nav-link">
                                    <i className="nav-icon fas fa-envelope"></i>
                                    <p>
                                        Messagerie
                                        <UnreadBadge username={username} style={{ float: 'right' }} />
                                    </p>
                                </NavLink>
                            </li>

                            <li className="nav-header">SYSTÈME</li>

                            <li className="nav-item">
                                <NavLink to="/admin/settings" className="nav-link">
                                    <i className="nav-icon fas fa-sliders-h"></i>
                                    <p>Configuration</p>
                                </NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/admin/support" className="nav-link">
                                    <i className="nav-icon fas fa-life-ring"></i>
                                    <p>Assistance</p>
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                </div>
                <style>{`
                    .rotate-90 {
                        transform: rotate(-90deg);
                        transition: transform 0.3s ease;
                    }
                    .nav-sidebar .child-link {
                        padding-left: 2rem !important;
                        font-size: 0.9rem;
                    }
                    .nav-header {
                        padding: 1.5rem 1rem 0.5rem !important;
                        font-weight: 700;
                        letter-spacing: 1px;
                        color: rgba(255,255,255,0.4) !important;
                    }
                `}</style>
            </aside>
        );
    };

export default Sidebar;
