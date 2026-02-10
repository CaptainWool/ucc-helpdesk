import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, User, Hash, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import './Login.css';

const StudentSignUp = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        studentId: '',
        phoneNumber: '',
        level: '',
        programme: ''
    });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Manual validation for all fields including avatar
        if (!avatar) {
            setError('Profile picture is required.');
            return;
        }

        const requiredFields = ['fullName', 'studentId', 'phoneNumber', 'level', 'programme', 'email', 'password'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            setError('All fields are required.');
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
                setLoading(false);
            } else {
                alert('Account created! Please log in.');
                navigate('/student-login');
            }
        } catch (err) {
            console.error('Unexpected signup error:', err);
            setError('A system error occurred. Please try again later.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="login-header">
                    <h1>Create Account</h1>
                    <p>Register to submit support tickets.</p>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="avatar-upload-container" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div className="avatar-preview-wrapper" style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            margin: '0 auto 1rem',
                            overflow: 'hidden',
                            border: '3px solid var(--primary)',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }} onClick={() => document.getElementById('avatar-input').click()}>
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={50} style={{ color: '#94a3b8' }} />
                            )}
                        </div>
                        <input
                            id="avatar-input"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => document.getElementById('avatar-input').click()}
                        >
                            Upload Profile Picture <span style={{ color: 'red' }}>*</span>
                        </Button>
                    </div>

                    <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        label="Full Name"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleChange}
                        icon={<User size={18} />}
                        required
                        autoComplete="name"
                    />

                    <Input
                        id="studentId"
                        name="studentId"
                        type="text"
                        label="Student ID"
                        placeholder="10223..."
                        value={formData.studentId}
                        onChange={handleChange}
                        icon={<Hash size={18} />}
                        required
                        autoComplete="off"
                    />

                    <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        label="Phone Number"
                        placeholder="e.g. +233 24 000 0000"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        icon={<Send size={18} />}
                        required
                        autoComplete="tel"
                    />

                    <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="level">Level</label>
                            <select
                                id="level"
                                name="level"
                                className="input-field"
                                value={formData.level}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Level</option>
                                <option value="100">Level 100</option>
                                <option value="200">Level 200</option>
                                <option value="300">Level 300</option>
                                <option value="400">Level 400</option>
                                <option value="Post-Grad">Post-Graduate</option>
                            </select>
                        </div>

                        <Input
                            id="programme"
                            name="programme"
                            type="text"
                            label="Programme"
                            placeholder="e.g. B.Ed IT"
                            value={formData.programme}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Input
                        id="email"
                        name="email"
                        type="email"
                        label="Email Address"
                        placeholder="student@ucc.edu.gh"
                        value={formData.email}
                        onChange={handleChange}
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
                        value={formData.password}
                        onChange={handleChange}
                        icon={<Lock size={18} />}
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />

                    <Button type="submit" className="login-btn" disabled={loading} size="lg">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>Already have an account? <Link to="/student-login">Sign In</Link></p>
                </div>
            </Card>
        </div>
    );
};

export default StudentSignUp;
