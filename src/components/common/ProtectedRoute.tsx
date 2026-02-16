import React, { ReactNode } from 'react';
import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Home, LogIn, RefreshCw, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    adminOnly?: boolean;
    requiredRole?: string | null;
}

const ProtectedRoute = ({ children, adminOnly = false, requiredRole = null }: ProtectedRouteProps) => {
    const { user, profile, signOut, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // While checking authentication, show a loading state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--bg-color)',
                color: 'var(--primary)'
            }}>
                <RefreshCw className="animate-spin" size={40} />
                <p style={{ marginTop: '1rem', fontWeight: '500' }}>Verifying your session...</p>
            </div>
        );
    }

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected.
        return <Navigate to={adminOnly ? "/login" : "/student-login"} state={{ from: location }} replace />;
    }

    // If user exists but profile is still loading/missing
    if (user && !profile) {
        const handleLogout = async () => {
            await signOut();
            navigate('/student-login');
        };

        const handleRetry = () => {
            window.location.reload();
        };

        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Profile Loading</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', maxWidth: '500px' }}>
                    Your profile is being initialized. This usually takes a few seconds.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button onClick={handleRetry} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}>
                        <RefreshCw size={18} /> Refresh Page
                    </button>
                    <button onClick={handleLogout} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}>
                        <LogOut size={18} /> Logout & Retry
                    </button>
                </div>
                <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Logged in as: <strong>{user?.email}</strong>
                </p>
            </div>
        );
    }

    // Role-based check
    if (adminOnly) {
        const isAdmin = profile?.role === 'agent' || profile?.role === 'super_admin';
        if (!isAdmin) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <AlertCircle size={48} style={{ color: '#dc2626', marginBottom: '1rem' }} />
                    <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Access Denied</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        This area is restricted to administrators only.
                    </p>
                    <Link to="/" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none'
                    }}>
                        <Home size={18} /> Go Home
                    </Link>
                </div>
            );
        }
    }

    if (requiredRole && profile?.role !== requiredRole && profile?.role !== 'super_admin') {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <AlertCircle size={48} style={{ color: '#dc2626', marginBottom: '1rem' }} />
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    You do not have the required permissions to view this page.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none'
                    }}>
                        <Home size={18} /> Go Home
                    </Link>
                    {profile?.role !== 'student' && (
                        <Link to="/student-login" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            color: 'var(--primary)',
                            border: '1px solid var(--primary)',
                            borderRadius: '6px',
                            textDecoration: 'none'
                        }}>
                            <LogIn size={18} /> Login as Student
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
