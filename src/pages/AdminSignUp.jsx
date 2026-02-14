import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, User, ShieldCheck, Send, CheckCircle, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import './Login.css';

const AdminSignUp = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        role: 'agent',
        contactEmail: '', // Personal email for records
        staffId: '',
        department: 'Academic Affairs',
        expertise: ''
    });
    const [generated, setGenerated] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { signUp } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const generateCredentials = () => {
        if (!formData.fullName) {
            setError('Please provide the Full Name first to generate an email.');
            return;
        }

        const nameParts = formData.fullName.toLowerCase().trim().split(/\s+/);
        let generatedEmail = '';
        if (nameParts.length >= 2) {
            generatedEmail = `${nameParts[0][0]}${nameParts[nameParts.length - 1]}`;
        } else {
            generatedEmail = nameParts[0];
        }

        // Add entropy to ensure uniqueness
        const randomSuffix = Math.floor(100 + Math.random() * 899);
        generatedEmail = `${generatedEmail}${randomSuffix}@ucc.edu.gh`;

        // Generate random secure password
        // Generate random secure password satisfying all requirements
        const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lowers = 'abcdefghijkmnopqrstuvwxyz';
        const numbers = '23456789';
        const specials = '!@#$%&*';

        // Guarantee at least one of each
        const p1 = uppers.charAt(Math.floor(Math.random() * uppers.length));
        const p2 = lowers.charAt(Math.floor(Math.random() * lowers.length));
        const p3 = numbers.charAt(Math.floor(Math.random() * numbers.length));
        const p4 = specials.charAt(Math.floor(Math.random() * specials.length));

        const allChars = uppers + lowers + numbers + specials;
        let pRemaining = '';
        for (let i = 0; i < 6; i++) {
            pRemaining += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }

        // Combine and prefix
        const generatedPassword = `UCC-${p1}${p2}${p3}${p4}${pRemaining}`;

        setFormData(prev => ({
            ...prev,
            email: generatedEmail,
            password: generatedPassword
        }));
        setGenerated(true);
        setError('');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!generated) {
            setError('Please generate the login credentials before submitting.');
            return;
        }

        // Validate Contact Email if provided
        if (formData.contactEmail) {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (!emailRegex.test(formData.contactEmail)) {
                setError('Please provide a valid working contact email.');
                return;
            }

            const suspiciousDomains = ['test.com', 'example.com', 'asdf.com', 'tempmail.com', 'mailinator.com', 'fake.com', 'test.io'];
            const domain = formData.contactEmail.split('@')[1].toLowerCase();
            if (suspiciousDomains.includes(domain)) {
                setError('The contact email appears to be a temporary or non-working address. Please use a real email.');
                return;
            }
        }

        setError('');
        setLoading(true);

        try {
            const { error: signUpError } = await signUp({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                role: formData.role,
                department: formData.department,
                staff_id: formData.staffId,
                expertise: formData.expertise
            });

            if (signUpError) {
                setError(signUpError.message || 'Registration failed');
                showError(signUpError.message || 'Registration failed');
                setLoading(false);
            } else {
                showSuccess('Staff account created successfully!');
                setIsSuccess(true);
            }
        } catch (err) {
            console.error('Unexpected admin signup error:', err);
            setError('A system error occurred. Please try again later.');
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="login-container">
                <Card className="login-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                    <div className="login-header">
                        <div className="login-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                            <CheckCircle size={48} />
                        </div>
                        <h1>Staff Created!</h1>
                        <p>The account for <strong>{formData.fullName}</strong> is ready.</p>
                    </div>

                    <div style={{ margin: '2rem 0', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login Email</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <code style={{ flexGrow: 1, background: 'white', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', color: '#0f172a' }}>{formData.email}</code>
                                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(formData.email)}>
                                    <Copy size={16} />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temporary Password</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <code style={{ flexGrow: 1, background: 'white', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', color: '#0f172a' }}>{formData.password}</code>
                                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(formData.password)}>
                                    <Copy size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem' }}>
                        Please share these credentials with the staff member securely.
                        They can change their password after logging in.
                    </p>

                    <Button onClick={() => navigate('/admin')} style={{ width: '100%' }} size="lg">
                        Go to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }
    return (
        <div className="login-container">
            <Card className="login-card" style={{ maxWidth: '600px' }}>
                <div className="login-header">
                    <div className="login-icon">
                        <ShieldCheck size={32} />
                    </div>
                    <h1>Staff Registration</h1>
                    <p>Enter comprehensive details to onboard a new staff member.</p>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            label="Staff Full Name"
                            placeholder="Samuel Adjetey"
                            value={formData.fullName}
                            onChange={handleChange}
                            icon={<User size={18} />}
                            required
                            autoComplete="name"
                        />
                        <Input
                            id="staffId"
                            name="staffId"
                            type="text"
                            label="Staff ID"
                            placeholder="UCC/STF/..."
                            value={formData.staffId}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="role">System Role</label>
                            <select
                                id="role"
                                name="role"
                                className="input-field"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', height: '45px' }}
                            >
                                <option value="agent">Support Agent (Coordinator)</option>
                                <option value="super_admin">Super Admin (IT Control)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label" htmlFor="department">Department</label>
                            <select
                                id="department"
                                name="department"
                                className="input-field"
                                value={formData.department}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', height: '45px' }}
                            >
                                <option value="Academic Affairs">Academic Affairs</option>
                                <option value="Financial Services">Financial Services</option>
                                <option value="IT Support">IT Support</option>
                                <option value="General Inquiries">General Inquiries</option>
                                <option value="Examinations">Examinations</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            label="Phone Number"
                            placeholder="024XXXXXXX"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            autoComplete="tel"
                        />
                        <Input
                            id="contactEmail"
                            name="contactEmail"
                            type="email"
                            label="Personal/Contact Email"
                            placeholder="staff@gmail.com"
                            value={formData.contactEmail}
                            onChange={handleChange}
                            icon={<Mail size={18} />}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <Input
                            id="expertise"
                            name="expertise"
                            type="text"
                            label="Specialization / Area of Expertise"
                            placeholder="e.g. Portal Access, Fee Reconciliation, etc."
                            value={formData.expertise}
                            onChange={handleChange}
                            icon={<ShieldCheck size={18} />}
                        />
                    </div>

                    <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'var(--primary-light)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={generateCredentials}
                            style={{ width: '100%', marginBottom: '1rem' }}
                        >
                            Generate Login Credentials
                        </Button>

                        {generated && (
                            <div className="generated-credentials fade-in" style={{ fontSize: '0.9rem' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>SYSTEM GENERATED EMAIL</label>
                                    <code style={{ background: 'white', padding: '4px 8px', borderRadius: '4px', display: 'block', border: '1px solid #e2e8f0' }}>{formData.email}</code>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>TEMPORARY PASSWORD</label>
                                    <code style={{ background: 'white', padding: '4px 8px', borderRadius: '4px', display: 'block', border: '1px solid #e2e8f0' }}>{formData.password}</code>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button type="submit" className="login-btn" disabled={loading || !generated} size="lg">
                        {loading ? 'Creating Account...' : 'Confirm & Register Staff'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>Administrative access is only granted by Super Admins.</p>
                </div>
            </Card>
        </div>
    );
};

export default AdminSignUp;
