import React, { useState, ReactNode, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, LifeBuoy, Sun, Moon, ArrowLeft, Menu, X, ChevronRight } from 'lucide-react';
import './Layout.css';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';

// Include AnnouncementBanner if it exists, otherwise skip
import AnnouncementBanner from '../common/AnnouncementBanner';

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
            <AnnouncementBanner />
            {impersonating && (
                <div className="impersonation-banner">
                    <div className="container banner-content">
                        <div className="banner-message">
                            <ShieldAlert size={18} />
                            <span>System Admin: Viewing as <strong>{profile?.full_name}</strong></span>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => {
                            stopImpersonating();
                            navigate('/admin');
                        }}>Stop Impersonation</Button>
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
                            <Link to="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ border: '1.5px solid var(--primary)', borderRadius: '50%', color: 'var(--primary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <GraduationCap size={18} strokeWidth={2.5} />
                                </div>
                                <span className="logo-text" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.15rem' }}>U.C.C (CoDE) Helpdesk</span>
                            </Link>
                        </div>
                        <nav className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
                            {/* Home link - only for students and non-logged-in users */}
                            {(!profile || profile?.role === 'student') && (
                                <>
                                    <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>{t('nav_home')}</Link>
                                    <Link to="/track-ticket" className="nav-link" onClick={() => setIsMenuOpen(false)}>Track Ticket</Link>
                                </>
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
                            <div className="nav-settings" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <span>EN</span> <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
                                </div>

                                <button onClick={toggleTheme} className="theme-toggle" title="Toggle Theme" style={{ color: '#64748b' }}>
                                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
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
                                        <Button variant="primary" size="sm" style={{ borderRadius: '100px', fontWeight: 700, padding: '0.6rem 1.25rem' }}>Student Login</Button>
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
                            <Link to="/privacy-portal" className="footer-link">Privacy Portal</Link>
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
