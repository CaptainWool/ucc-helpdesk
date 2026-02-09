import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, User, ShieldCheck, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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

    const { signUp } = useAuth();
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
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
        let generatedPassword = 'UCC-';
        for (let i = 0; i < 8; i++) {
            generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

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
                setLoading(false);
            } else {
                alert(`Account created successfully!\n\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nPlease save these credentials for the staff member.`);
                navigate('/admin');
            }
        } catch (err) {
            console.error('Unexpected admin signup error:', err);
            setError('A system error occurred. Please try again later.');
            setLoading(false);
        }
    };

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
                        />
                    </div>

                    <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">System Role</label>
                            <select
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
                            <label className="input-label">Department</label>
                            <select
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
