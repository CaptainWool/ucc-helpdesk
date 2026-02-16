import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, User, Hash, Phone, ChevronRight, ChevronLeft, Check, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './StudentSignUp.css';

const StudentSignUp: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        studentId: '',
        phoneNumber: '',
        level: '',
        programme: '',
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

    // Password strength calculation
    const calculatePasswordStrength = () => {
        const password = formData.password;
        let strength = 0;
        
        if (password.length >= 8) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/[a-z]/.test(password)) strength += 20;
        if (/[0-9]/.test(password)) strength += 20;
        if (/[@$!%*?&#]/.test(password)) strength += 20;
        
        return strength;
    };

    const getPasswordStrengthColor = () => {
        const strength = calculatePasswordStrength();
        if (strength < 60) return 'weak';
        if (strength < 100) return 'medium';
        return 'strong';
    };

    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(formData.password) },
        { label: 'One lowercase letter', met: /[a-z]/.test(formData.password) },
        { label: 'One special character', met: /[@$!%*?&#]/.test(formData.password) },
        { label: 'Passwords match', met: formData.password && formData.password === formData.confirmPassword }
    ];

    // Step validation
    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!avatar) {
                    setError('Please upload a profile picture');
                    return false;
                }
                if (!formData.fullName || !formData.studentId || !formData.phoneNumber) {
                    setError('All fields are required');
                    return false;
                }
                return true;
                
            case 2:
                if (!formData.level || !formData.programme || !formData.email) {
                    setError('All fields are required');
                    return false;
                }
                
                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                if (!emailRegex.test(formData.email)) {
                    setError('Please enter a valid email address');
                    return false;
                }
                
                const suspiciousDomains = ['test.com', 'example.com', 'asdf.com', 'tempmail.com', 'mailinator.com', 'fake.com', 'test.io'];
                const domain = formData.email.split('@')[1]?.toLowerCase();
                if (suspiciousDomains.includes(domain)) {
                    setError('Please use a valid institutional or personal email');
                    return false;
                }
                return true;
                
            case 3:
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
                if (!passwordRegex.test(formData.password)) {
                    setError('Password must meet all requirements');
                    return false;
                }
                
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    return false;
                }
                return true;
                
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
            setError('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (currentStep < totalSteps) {
            nextStep();
            return;
        }

        if (!validateStep(3)) {
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
                avatar: avatar!
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

    // Success Screen
    if (isSubmitted) {
        return (
            <div className="signup-wizard-container">
                <div className="signup-wizard-card">
                    <div className="signup-success-screen">
                        <div className="success-icon">
                            <CheckCircle2 size={40} />
                        </div>
                        
                        <h2>Account Created!</h2>
                        <p>Welcome to UCC Helpdesk. Your account is ready.</p>
                        
                        <div className="success-profile">
                            {avatarPreview && (
                                <div className="success-avatar">
                                    <img src={avatarPreview} alt="Profile" />
                                </div>
                            )}
                            <div className="success-name">{formData.fullName}</div>
                        </div>
                        
                        <div className="success-actions">
                            <button 
                                className="success-btn-primary"
                                onClick={() => navigate('/login')}
                            >
                                Go to Login
                            </button>
                            <button 
                                className="success-btn-secondary"
                                onClick={() => navigate('/faq')}
                            >
                                Learn About the Platform
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="signup-wizard-container">
            <div className="signup-wizard-card">
                {/* Header */}
                <div className="signup-wizard-header">
                    <h1>Create Account</h1>
                    <p>Join UCC Helpdesk to submit and track support tickets</p>
                </div>

                {/* Progress Indicators */}
                <div className="wizard-progress">
                    <div 
                        className="wizard-progress-fill" 
                        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                    />
                    
                    {[1, 2, 3].map(step => (
                        <div 
                            key={step}
                            className={`wizard-step-indicator ${
                                step === currentStep ? 'active' : ''
                            } ${step < currentStep ? 'completed' : ''}`}
                        >
                            <div className="wizard-step-circle">
                                {step < currentStep ? <Check size={18} /> : step}
                            </div>
                            <span className="wizard-step-label">
                                {step === 1 && 'Profile'}
                                {step === 2 && 'Details'}
                                {step === 3 && 'Security'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="wizard-error">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Wizard Content */}
                <form onSubmit={handleSubmit}>
                    <div className="wizard-content">
                        {/* Step 1: Profile Setup */}
                        <div className={`wizard-step ${currentStep === 1 ? 'active' : ''}`}>
                            <h2 className="step-title">Profile Setup</h2>
                            <p className="step-description">Let's start with your basic information</p>

                            <div className="avatar-upload-zone">
                                <div 
                                    className="avatar-preview-large"
                                    onClick={() => document.getElementById('avatar-input')?.click()}
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" />
                                    ) : (
                                        <User size={60} style={{ color: '#94a3b8' }} />
                                    )}
                                </div>
                                
                                <input
                                    id="avatar-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    style={{ display: 'none' }}
                                />
                                
                                <div className="avatar-upload-prompt">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('avatar-input')?.click()}
                                    >
                                        {avatarPreview ? 'Change Photo' : 'Upload Profile Picture'}
                                    </Button>
                                    <p>JPG, PNG or GIF (max 5MB)</p>
                                    {avatar && (
                                        <span className="avatar-file-badge">
                                            {avatar.name}
                                        </span>
                                    )}
                                </div>
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
                            />

                            <div className="wizard-form-grid">
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
                                />

                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    label="Phone Number"
                                    placeholder="+233 24 000 0000"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    icon={<Phone size={18} />}
                                    required
                                />
                            </div>
                        </div>

                        {/* Step 2: Academic Details */}
                        <div className={`wizard-step ${currentStep === 2 ? 'active' : ''}`}>
                            <h2 className="step-title">Academic Details</h2>
                            <p className="step-description">Tell us about your academic background</p>

                            <div className="wizard-form-grid">
                                <div className="wizard-form-group">
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
                            />
                        </div>

                        {/* Step 3: Account Security */}
                        <div className={`wizard-step ${currentStep === 3 ? 'active' : ''}`}>
                            <h2 className="step-title">Account Security</h2>
                            <p className="step-description">Create a strong password to protect your account</p>

                            <Input
                                id="password"
                                name="password"
                                type="password"
                                label="Create Password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                icon={<Lock size={18} />}
                                required
                            />

                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                label="Confirm Password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                icon={<Lock size={18} />}
                                required
                            />

                            {formData.password && (
                                <div className="password-strength-container">
                                    <div className="strength-requirements">
                                        <h4>Password Requirements</h4>
                                        {passwordRequirements.map((req, index) => (
                                            <div key={index} className={`requirement-item ${req.met ? 'met' : ''}`}>
                                                <span className="icon">
                                                    {req.met ? <Check size={16} /> : <X size={16} />}
                                                </span>
                                                <span>{req.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="strength-meter">
                                        <div className="strength-bar-bg">
                                            <div 
                                                className={`strength-bar-fill ${getPasswordStrengthColor()}`}
                                                style={{ width: `${calculatePasswordStrength()}%` }}
                                            />
                                        </div>
                                        <div className={`strength-label ${getPasswordStrengthColor()}`}>
                                            {calculatePasswordStrength() < 60 && 'Weak Password'}
                                            {calculatePasswordStrength() >= 60 && calculatePasswordStrength() < 100 && 'Medium Strength'}
                                            {calculatePasswordStrength() === 100 && 'Strong Password'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Review Summary */}
                            {formData.password && formData.confirmPassword && (
                                <div className="review-summary">
                                    <h3>Review Your Information</h3>
                                    
                                    {avatarPreview && (
                                        <div className="review-avatar-row">
                                            <div className="review-avatar-small">
                                                <img src={avatarPreview} alt="Profile" />
                                            </div>
                                            <div>
                                                <div className="review-value">{formData.fullName}</div>
                                                <div className="review-label">Profile Picture & Name</div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="review-item">
                                        <span className="review-label">Student ID</span>
                                        <span className="review-value">{formData.studentId}</span>
                                    </div>
                                    
                                    <div className="review-item">
                                        <span className="review-label">Email</span>
                                        <span className="review-value">{formData.email}</span>
                                    </div>
                                    
                                    <div className="review-item">
                                        <span className="review-label">Level & Programme</span>
                                        <span className="review-value">
                                            Level {formData.level} • {formData.programme}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Navigation */}
                    <div className="wizard-footer">
                        {currentStep > 1 && (
                            <button 
                                type="button" 
                                className="wizard-btn wizard-btn-back"
                                onClick={prevStep}
                            >
                                <ChevronLeft size={18} />
                                Back
                            </button>
                        )}

                        {currentStep < totalSteps ? (
                            <button 
                                type="button"
                                className="wizard-btn wizard-btn-next"
                                onClick={nextStep}
                            >
                                Next Step
                                <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button 
                                type="submit"
                                className="wizard-btn wizard-btn-submit"
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="login-footer" style={{ textAlign: 'center', padding: '1rem 2rem 2rem' }}>
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

export default StudentSignUp;
