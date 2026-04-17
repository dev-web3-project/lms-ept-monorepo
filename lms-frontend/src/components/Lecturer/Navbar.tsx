import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getLecturerDetailsByUsername } from "../../services/api/user";
import NotificationBell from "../NotificationBell";
import UnreadBadge from "../UnreadBadge";

const Navbar = () => {
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const user = JSON.parse(stored);
            const uname = user.username || user.email || '';
            setUsername(uname);
            
            try {
                const details = await getLecturerDetailsByUsername(uname);
                if (details) {
                    const fName = details.firstName || '';
                    const lName = (details.lastName || '').toUpperCase();
                    setFullName(`${fName} ${lName}`.trim() || uname);
                } else {
                    setFullName(uname);
                }
            } catch (err) {
                console.error("Erreur details", err);
                setFullName(uname);
            }
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate("/login");
    };

    const onClickProfile = () => {
        navigate("/lecturer/profile");
    }

    const isActive = (path: string) => location.pathname === path;

    const navLinkStyle = (path: string) => ({
        color: isActive(path) ? 'var(--green)' : 'var(--text-secondary)',
        fontWeight: isActive(path) ? 600 : 500,
        padding: '0.4rem 0.8rem',
        borderRadius: 'var(--radius)',
        transition: 'var(--t)',
        background: isActive(path) ? 'var(--green-dim)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        textDecoration: 'none',
        fontSize: '0.85rem'
    });

    return (
        <nav className="main-header navbar navbar-expand-xl" style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            padding: '0.5rem 1rem',
            marginLeft: 0
        }}>
            <div className="container-fluid px-2 px-md-4">
                <Link to={"/lecturer"} className="navbar-brand d-flex align-items-center mr-4" style={{ gap: '0.75rem' }}>
                    <img src="/dist/img/main-logo.png" alt="LMS Logo" className="brand-image img-circle elevation-3" style={{ opacity: 0.9, width: '44px', height: '44px' }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '1px', fontSize: '1.1rem' }}>
                        <span style={{ color: 'var(--green)', fontWeight: 400, opacity: 0.9 }}>PROFESSEUR</span>
                    </span>
                </Link>

                <button className="navbar-toggler border-0" type="button" data-toggle="collapse" data-target="#navbarCollapse">
                    <i className="fas fa-bars" style={{ color: 'var(--green)' }}></i>
                </button>

                <div className="collapse navbar-collapse order-3" id="navbarCollapse">
                    <ul className="navbar-nav mx-auto" style={{ gap: '0.2rem' }}>
                        <li className="nav-item">
                            <Link to={"/lecturer"} style={navLinkStyle("/lecturer")} className="nav-link-htb">
                                <i className="fas fa-home" style={{ width: 16, textAlign: 'center' }}></i> Accueil
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/lecturer/announcements"} style={navLinkStyle("/lecturer/announcements")} className="nav-link-htb">
                                <i className="fas fa-bullhorn" style={{ width: 16, textAlign: 'center' }}></i> Annonces
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/lecturer/messages"} style={{ ...navLinkStyle("/lecturer/messages"), position: 'relative' }} className="nav-link-htb">
                                <i className="fas fa-envelope" style={{ width: 16, textAlign: 'center' }}></i> Messages
                                <UnreadBadge username={username} style={{ fontSize: '0.65rem', padding: '1px 5px' }} />
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to={"/lecturer/mentorship"} style={navLinkStyle("/lecturer/mentorship")} className="nav-link-htb">
                                <i className="fas fa-hands-helping" style={{ width: 16, textAlign: 'center' }}></i> Mentorat
                            </Link>
                        </li>
                    </ul>

                    {/* Search Bar */}
                    <form className="form-inline ml-0 ml-xl-3 my-2 my-xl-0">
                        <div className="input-group search-group-htb" style={{
                            background: '#111927',
                            border: '1px solid #2a3f5f',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            width: '240px',
                            transition: 'all 0.2s ease',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            <input className="form-control shadow-none border-0 text-white" 
                                   style={{ background: 'transparent', fontSize: '0.85rem', height: '36px', paddingRight: 0 }} 
                                   type="search" placeholder="Rechercher..."/>
                            <div className="input-group-append">
                                <span className="input-group-text border-0 bg-transparent" style={{ color: '#556987' }}>
                                    <i className="fas fa-search" style={{ fontSize: '0.9rem' }}></i>
                                </span>
                            </div>
                        </div>
                    </form>
                </div>

                <ul className="order-1 order-md-3 navbar-nav navbar-no-expand ml-auto d-flex align-items-center" style={{ gap: '1.25rem' }}>
                    
                    {/* Notification Bell */}
                    <li className="nav-item">
                        <NotificationBell userId={username} variant="dark" />
                    </li>

                    {/* User Dropdown */}
                    <li className="nav-item dropdown d-flex align-items-center">
                        <a className="nav-link d-flex align-items-center" data-toggle="dropdown" href="#" style={{ padding: 0 }}>
                            <div style={{
                                width: '40px', height: '40px',
                                borderRadius: '50%',
                                background: '#111927',
                                border: '2px solid #2a3f5f',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden',
                                padding: '2px',
                                transition: 'all 0.2s ease'
                            }} className="user-avatar-wrap">
                                <img src="/dist/img/default-user.png" alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}/>
                            </div>
                        </a>
                        <div className="dropdown-menu dropdown-menu-right" style={{
                            background: '#1a2332',
                            border: '1px solid #2a3f5f',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            borderRadius: '12px',
                            marginTop: '0.75rem',
                            minWidth: '240px',
                            padding: '0.5rem'
                        }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid #2a3f5f', marginBottom: '0.5rem' }}>
                                <div style={{ color: '#e5eaf3', fontWeight: 700, fontSize: '1rem' }}>
                                    {fullName}
                                </div>
                            </div>
                            <button className="dropdown-item d-flex align-items-center" onClick={onClickProfile} 
                                    style={{ color: '#e5eaf3', gap: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.9rem', borderRadius: '8px' }}>
                                <i className="fas fa-user-circle" style={{ width: '18px', color: '#2cb5e8' }}></i> Mon Profil
                            </button>
                            <div className="dropdown-divider" style={{ borderColor: 'var(--border)' }}></div>
                            <button className="dropdown-item d-flex align-items-center text-danger" onClick={handleSignOut}
                                    style={{ gap: '0.75rem', padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
                                <i className="fas fa-sign-out-alt" style={{ width: '16px' }}></i> Déconnexion
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
            <style>{`
                .nav-link-htb:hover {
                    background: var(--bg-hover) !important;
                    color: var(--text-primary) !important;
                }
                .user-avatar-wrap:hover {
                    border-color: var(--green) !important;
                }
                .dropdown-item:hover {
                    background: var(--bg-hover) !important;
                }
                input[type="search"]::-webkit-search-cancel-button {
                    -webkit-appearance: none;
                }
                .search-group-htb:focus-within {
                    border-color: #9fef00 !important;
                    box-shadow: 0 0 10px rgba(159,239,0,0.15), inset 0 2px 4px rgba(0,0,0,0.2) !important;
                }
                .search-group-htb input::placeholder {
                    color: #556987;
                }
            `}</style>
        </nav>
    );
}

export default Navbar;