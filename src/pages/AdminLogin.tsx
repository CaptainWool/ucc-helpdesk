import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import './Login.css';

const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signOut, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/admin';

    useEffect(() => {
        if (user && !authLoading && user.role !== 'student') {
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, from]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);



        try {
            const { data, error: loginError } = await signIn({ email, password });

            if (loginError) {
                setError(loginError.message || 'Invalid credentials');
                setLoading(false);
            } else {
                const loggedInUser = data.user || data;
                if (loggedInUser.role === 'student') {
                    await signOut();
                    setError('Student accounts must use the Student Login portal.');
                    setLoading(false);
                } else {
                    navigate(from, { replace: true });
                }
            }
        } catch (err: any) {
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

export default AdminLogin;
