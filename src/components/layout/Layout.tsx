import React, { useState, ReactNode, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, LifeBuoy, Sun, Moon, ArrowLeft, Menu, X } from 'lucide-react';
import './Layout.css';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';

// Include AnnouncementBanner if it exists, otherwise skip
// import AnnouncementBanner from '../common/AnnouncementBanner';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, profile, signOut, impersonating, stopImpersonating, loading } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    // const { settings } = useSettings(); // settings might be unused or used for banner
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const isHomePage = location.pathname === '/';
    const isDashboard = location.pathname === '/dashboard';
    const isAdmin = location.pathname.startsWith('/admin');
    const isCompactPage = !isHomePage && !isDashboard && !isAdmin;

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/', { replace: true });
            window.location.reload();
        } catch (err) {
            console.error("Logout failed:", err);
            navigate('/');
        }
    }

    return (
        <div className={`layout-wrapper ${isCompactPage ? 'ui-compact' : ''}`}>
            {/* <AnnouncementBanner /> */}
            {impersonating && (
                <div className="impersonation-banner">
                    <div className="container banner-content">
                        <span>Viewing as <strong>{profile?.full_name}</strong> ({profile?.role})</span>
                        <Button variant="danger" size="sm" onClick={() => {
                            stopImpersonating();
                            navigate('/admin');
                        }}>Stop Impersonating</Button>
                    </div>
                </div>
            )}
            {!isAdmin && ( // Conditionally render header
                <header className="header">
                    <div className="container header-container">
                        <div className="header-left">
                            {!isHomePage && (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="back-button"
                                    title="Go Back"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <Link to="/" className="logo">
                                <GraduationCap className="logo-icon" size={28} />
                                <span className="logo-text">U.C.C (CoDE) Helpdesk</span>
                            </Link>
                        </div>
                        <nav className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
                            {/* Home link - only for students and non-logged-in users */}
                            {(!profile || profile?.role === 'student') && (
                                <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>{t('nav_home')}</Link>
                            )}

                            {/* Student Dashboard */}
                            {user && profile?.role === 'student' && (
                                <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                            )}

                            {/* Admin Dashboard */}
                            {(profile?.role === 'agent' || profile?.role === 'super_admin') && (
                                <Link to="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>Admin</Link>
                            )}

                            {/* Settings Row */}
                            <div className="nav-settings">
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as any)}
                                    className="lang-select"
                                >
                                    <option value="en">EN</option>
                                    <option value="fr">FR</option>
                                    <option value="tw">TW</option>
                                </select>

                                <button onClick={toggleTheme} className="theme-toggle" title="Toggle Theme">
                                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                </button>
                            </div>

                            {!loading && (
                                user ? (
                                    <div className="user-nav-info">
                                        <span className="user-name-inline">
                                            {profile?.full_name || user?.full_name || user?.email?.split('@')[0]}
                                        </span>
                                        <Button variant="ghost" size="sm" onClick={handleLogout}>{t('nav_logout')}</Button>
                                    </div>
                                ) : (
                                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="primary" size="sm">Student Login</Button>
                                    </Link>
                                )
                            )}
                        </nav>

                        <button className="mobile-menu-toggle" onClick={toggleMenu}>
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </header>
            )}

            <main className="main-content">
                {children}
                {/* Note: In router v6, passing children to Layout typically means using it as a wrapper in App.tsx. 
                    However, Router logic might use <Outlet/> if Layout is a Route element. 
                    Here Layout wraps Routes in App.tsx manually, so children is correct. */}
            </main>

            {!isAdmin && ( // Conditionally render footer
                <footer className="footer">
                    <div className="container footer-container">
                        <p className="footer-text">&copy; {new Date().getFullYear()} U.C.C College of Distance Education. All rights reserved.</p>
                        <div className="footer-links">
                            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                            <Link to="/terms" className="footer-link">Terms of Service</Link>
                            <Link to="/faq" className="footer-link">FAQ</Link>
                            <a href="mailto:support@ucc.edu.gh" className="footer-link"><LifeBuoy size={16} /> Support</a>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default Layout;
