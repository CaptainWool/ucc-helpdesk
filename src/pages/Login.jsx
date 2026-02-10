import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signOut, masterLogin, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/admin';

    // Auto-redirect if already logged in as Staff/Admin
    React.useEffect(() => {
        if (user && !authLoading && user.role !== 'student') {
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // MASTER BYPASS: Immediate login for master admin
        if (email.toLowerCase() === 'master@ucc.edu.gh' && password === 'israel_chelsea') {
            masterLogin();
            navigate('/admin', { replace: true });
            return;
        }

        try {
            const { data, error: loginError } = await signIn({ email, password });

            if (loginError) {
                setError(loginError.message || 'Invalid credentials');
                setLoading(false);
            } else {
                // Check if the user is a staff/admin
                const loggedInUser = data.user || data;
                if (loggedInUser.role === 'student') {
                    // This is a student account, kick them out of this portal
                    await signOut();
                    setError('Student accounts must use the Student Login portal.');
                    setLoading(false);
                } else {
                    navigate(from, { replace: true });
                }
            }
        } catch (err) {
            console.error('Unexpected admin login error:', err);
            setError('A system error occurred. Please try again later.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="login-header">
                    <div className="login-icon">
                        <Lock size={32} />
                    </div>
                    <h1>Admin Access</h1>
                    <p>Enter your credentials to access the coordinator dashboard.</p>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        label="Email Address"
                        placeholder="admin@ucc.edu.gh"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={18} />}
                        required
                        autoComplete="email"
                    />

                    <Input
                        id="password"
                        name="password"
                        type="password"
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Lock size={18} />}
                        required
                        autoComplete="current-password"
                    />

                    <Button type="submit" className="login-btn" disabled={loading} size="lg">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>Issues logging in? Contact your system administrator.</p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
