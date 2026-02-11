import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ShieldCheck, Lock, AlertTriangle, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import './Login.css';

const ForgotPassword = () => {
    // Form state
    const [step, setStep] = useState(1); // 1: Email/ID, 2: Token, 3: New Password
    const [email, setEmail] = useState('');
    const [studentId, setStudentId] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError, showWarning, showInfo } = useToast();

    const navigate = useNavigate();

    // Step 1: Request token
    const handleRequestToken = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.auth.requestReset({
                email,
                student_id: studentId
            });

            showSuccess(res.message || 'Verification code sent to your email!');
            setStep(2); // Move to token verification step
        } catch (err) {
            showError(err.error || 'Failed to send verification code. Please check your details.');
            setError(err.error || 'Failed to send verification code.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify token
    const handleVerifyToken = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (token.length !== 6) {
            setError('Please enter the 6-digit verification code.');
            setLoading(false);
            return;
        }

        try {
            await api.auth.verifyToken({
                email,
                token
            });

            showSuccess('Code verified! Please set your new password.');
            setStep(3); // Move to password setting step
        } catch (err) {
            showError(err.error || 'Invalid verification code.');
            setError(err.error || 'Invalid verification code.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Complete password reset
    const handleCompleteReset = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            showWarning('Passwords do not match');
            return setError('Passwords do not match');
        }

        // Validate Password Complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return setError('Password must be at least 8 characters long and contain uppercase, lowercase, and special characters.');
        }

        setLoading(true);

        try {
            const res = await api.auth.completeReset({
                email,
                token,
                new_password: newPassword
            });

            showSuccess(res.message || 'Password reset successful!');
            setTimeout(() => navigate('/student-login'), 2000);
        } catch (err) {
            showError(err.error || 'Failed to reset password.');
            setError(err.error || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="login-header">
                    <div className="login-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                        {step === 1 && <ShieldCheck size={32} />}
                        {step === 2 && <KeyRound size={32} />}
                        {step === 3 && <Lock size={32} />}
                    </div>
                    <h1>Reset Password</h1>
                    <p>
                        {step === 1 && 'Enter your email and Student ID to receive a verification code.'}
                        {step === 2 && 'Enter the 6-digit code sent to your email.'}
                        {step === 3 && 'Create a new secure password for your account.'}
                    </p>

                    {/* Step Progress Indicator */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                style={{
                                    width: '2rem',
                                    height: '4px',
                                    borderRadius: '2px',
                                    background: s <= step ? 'var(--primary)' : '#e2e8f0',
                                    transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Step 1: Email & Student ID */}
                {step === 1 && (
                    <form onSubmit={handleRequestToken} className="login-form">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            label="Registered Email"
                            placeholder="student@ucc.edu.gh"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail size={18} />}
                            required
                            autoComplete="email"
                        />

                        <Input
                            id="studentId"
                            name="studentId"
                            type="text"
                            label="Student ID"
                            placeholder="10223..."
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            icon={<ShieldCheck size={18} />}
                            required
                            autoComplete="off"
                        />

                        <Button type="submit" className="login-btn" disabled={loading} size="lg">
                            {loading ? 'Sending Code...' : 'Send Verification Code'}
                        </Button>
                    </form>
                )}

                {/* Step 2: Token Verification */}
                {step === 2 && (
                    <form onSubmit={handleVerifyToken} className="login-form">
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                A 6-digit code was sent to <strong>{email}</strong>
                            </p>
                        </div>

                        <Input
                            id="token"
                            name="token"
                            type="text"
                            label="Verification Code"
                            placeholder="000000"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            icon={<KeyRound size={18} />}
                            required
                            autoComplete="off"
                            maxLength={6}
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                        />

                        <Button type="submit" className="login-btn" disabled={loading || token.length !== 6} size="lg">
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </Button>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Resend code
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleCompleteReset} className="login-form">
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
                            autoComplete="new-password"
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
                            autoComplete="new-password"
                        />

                        <Button type="submit" className="login-btn" disabled={loading} size="lg">
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </Button>
                    </form>
                )}

                <div className="login-footer">
                    <p>
                        <Link to="/student-login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default ForgotPassword;
