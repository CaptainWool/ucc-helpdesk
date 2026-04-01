import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, User, Hash, Phone, CheckCircle2, UploadCloud, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './StudentSignUp.css';

const StudentSignUp: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        studentId: '',
        phoneNumber: '',
        programme: '',
        level: '',
        college: '',
        password: '',
        confirmPassword: ''
    });

    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { signUp } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!avatar) {
            setError('Profile photo is required');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { error: signUpError } = await signUp({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                studentId: formData.studentId,
                phoneNumber: formData.phoneNumber,
                level: formData.level,
                programme: formData.programme,
                avatar: avatar
            });

            if (signUpError) {
                setError(signUpError.message || 'Registration failed');
                showError(signUpError.message || 'Registration failed');
                setLoading(false);
            } else {
                setIsSubmitted(true);
                showSuccess('Account created successfully!');
            }
        } catch (err) {
            console.error('Unexpected signup error:', err);
            setError('A system error occurred. Please try again later.');
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="signup-container">
                <div className="signup-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#0f172a' }}>Account Created!</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>Your account is ready to use.</p>
                    <Button onClick={() => navigate('/login')} size="lg" style={{ width: '100%', maxWidth: '300px' }}>
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="signup-container">
            <div className="signup-card fade-in-up">
                <div className="signup-header">
                    <div style={{ display: 'flex', justifySelf: 'center', margin: '0 auto 1.5rem', width: '68px', height: '68px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', alignItems: 'center', justifyContent: 'center' }}>
                        <GraduationCap size={32} />
                    </div>
                    <h1>Create Account</h1>
                    <p>Register to submit support tickets.</p>
                </div>

                {error && (
                    <div className="error-alert" style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="avatar-upload-section">
                        <div 
                            className="avatar-preview-circle"
                            onClick={() => document.getElementById('avatar-input')?.click()}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" />
                            ) : (
                                <div className="avatar-placeholder">
                                    <UploadCloud size={28} />
                                    <span>Add Photo</span>
                                </div>
                            )}
                        </div>
                        <input
                            id="avatar-input"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                        />
                        {!avatar && <div className="avatar-error">* Profile photo required</div>}
                    </div>

                    <div className="form-grid-2">
                        <Input
                            id="fullName" name="fullName" type="text" label="Full Name"
                            placeholder="John Doe" value={formData.fullName} onChange={handleChange}
                            icon={<User size={18} />} required
                        />
                        <Input
                            id="email" name="email" type="email" label="Email Address"
                            placeholder="student@ucc.edu.gh" value={formData.email} onChange={handleChange}
                            icon={<Mail size={18} />} required
                        />
                    </div>

                    <div className="form-grid-2">
                        <div className="input-group-with-help">
                            <Input
                                id="studentId" name="studentId" type="text" label="Student ID"
                                placeholder="# CS/22/00123" value={formData.studentId} onChange={handleChange}
                                icon={<Hash size={18} />} required
                            />
                            <div className="help-text">Format: PROG/YY/SEQUENCE — e.g. CS/22/00123 or PG/2022/001</div>
                        </div>
                        <Input
                            id="phoneNumber" name="phoneNumber" type="tel" label="Phone Number"
                            placeholder="+233..." value={formData.phoneNumber} onChange={handleChange}
                            icon={<Phone size={18} />} required
                        />
                    </div>

                    <div className="form-grid-2">
                        <div className="wizard-form-group">
                            <label className="input-label" htmlFor="programme">Programme</label>
                            <select id="programme" name="programme" className="input-field" value={formData.programme} onChange={handleChange} required>
                                <option value="">Select Programme</option>
                                <option value="B.Ed IT">B.Ed IT</option>
                                <option value="B.Com">B.Com</option>
                                <option value="B.Sc CS">B.Sc CS</option>
                            </select>
                        </div>
                        <div className="wizard-form-group">
                            <label className="input-label" htmlFor="level">Level / Year</label>
                            <select id="level" name="level" className="input-field" value={formData.level} onChange={handleChange} required>
                                <option value="">Select Level</option>
                                <option value="100">Level 100</option>
                                <option value="200">Level 200</option>
                                <option value="300">Level 300</option>
                                <option value="400">Level 400</option>
                            </select>
                        </div>
                    </div>

                    <div className="wizard-form-group full-width">
                        <label className="input-label" htmlFor="college">College / Faculty</label>
                        <select id="college" name="college" className="input-field" value={formData.college} onChange={handleChange} required>
                            <option value="">Select College / Faculty</option>
                            <option value="CoDE">College of Distance Education</option>
                            <option value="CoLT">College of Agriculture...</option>
                        </select>
                    </div>

                    <div className="form-grid-2">
                        <Input
                            id="password" name="password" type="password" label="Password"
                            placeholder="••••••••" value={formData.password} onChange={handleChange}
                            icon={<Lock size={18} />} required
                        />
                        <Input
                            id="confirmPassword" name="confirmPassword" type="password" label="Confirm Password"
                            placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange}
                            icon={<Lock size={18} />} required
                        />
                    </div>

                    <Button type="submit" className="signup-btn" disabled={loading} size="lg">
                        {loading ? 'Creating...' : 'Sign Up'}
                    </Button>

                    <div className="signup-footer text-left">
                        <p>Already have an account? <Link to="/login">Sign In</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentSignUp;
