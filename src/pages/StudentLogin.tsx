import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import './Login.css';

const StudentLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signOut, studentLogin, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    useEffect(() => {
        if (user && !authLoading && user.role === 'student') {
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, from]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Master Student Bypass
        if (email === 'student@ucc.edu.gh' && password === 'israel_student') {
            studentLogin();
            navigate('/dashboard', { replace: true });
            return;
        }

        try {
            const { data, error: loginError } = await signIn({ email, password });

            if (loginError) {
                setError(loginError.message || 'Invalid credentials');
                setLoading(false);
            } else {
                const loggedInUser = data.user || data;
                if (loggedInUser.role !== 'student') {
                    await signOut();
                    setError('Staff/Admin accounts must use the Coordinator Login portal.');
                    setLoading(false);
                } else {
                    navigate(from, { replace: true });
                }
            }
        } catch (err: any) {
            console.error('Unexpected login error:', err);
            setError('A system error occurred. Please try again later.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="login-header">
                    <div className="login-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                        <GraduationCap size={32} />
                    </div>
                    <h1>Student Login</h1>
                    <p>Access the helpdesk to submit and track issues.</p>
                </div>

                {error && (
                    <div className="error-alert error-message">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        label="Student Email"
                        placeholder="student@ucc.edu.gh"
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.75rem', marginBottom: '1rem' }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '500' }}>
                            Forgot Password?
                        </Link>
                    </div>

                    <Button type="submit" className="login-btn" disabled={loading} size="lg">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>New to the platform? <Link to="/student-signup">Create an Account</Link></p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        Admin? <Link to="/admin/login">Coordinator Login</Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default StudentLogin;
