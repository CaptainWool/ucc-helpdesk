import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ShieldCheck, Lock, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import './Login.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [studentId, setStudentId] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (newPassword.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);

        try {
            const res = await api.auth.forgotPassword({
                email,
                student_id: studentId,
                new_password: newPassword
            });
            setSuccess(res.message);
            // Clear form
            setEmail('');
            setStudentId('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.error || 'Failed to reset password. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="login-header">
                    <div className="login-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h1>Reset Password</h1>
                    <p>Verify your student identity to set a new password.</p>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="error-alert" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                        <CheckCircle size={18} />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        label="Registered Email"
                        placeholder="your-email@ucc.edu.gh"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={18} />}
                        required
                    />

                    <Input
                        id="studentId"
                        name="studentId"
                        type="text"
                        label="Student ID Number"
                        placeholder="e.g. 10224055"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        icon={<ShieldCheck size={18} />}
                        required
                    />

                    <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        label="New Password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        icon={<Lock size={18} />}
                        required
                    />

                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        label="Confirm New Password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={<Lock size={18} />}
                        required
                    />

                    <Button type="submit" disabled={loading} size="lg">
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>

                <div className="login-footer">
                    <Link to="/student-login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default ForgotPassword;
