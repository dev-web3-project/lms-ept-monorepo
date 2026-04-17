
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NotificationBell from "../NotificationBell";

const Navbar = () => {

    const navigate = useNavigate();
    const [username, setUsername] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUsername(parsed.username || parsed.sub || '');
        }
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate("/login");
    };
    return (
        <nav className="main-header navbar navbar-expand navbar-white navbar-light">
            {/* Right navbar links */}
            <ul className="navbar-nav ml-auto">
                {/* Notifications */}
                <li className="nav-item" style={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationBell userId={username} variant="light" />
                </li>
                <li className="nav-item">
                    <button className="nav-link border-0 bg-transparent" data-widget="fullscreen">
                        <i className="fas fa-expand-arrows-alt"></i>
                    </button>
                </li>
                <li className="nav-item">
                    <button className="nav-link border-0 bg-transparent" onClick={handleSignOut}>
                        <i className="fas fa-sign-out-alt fa-lg text-danger"></i>
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar;