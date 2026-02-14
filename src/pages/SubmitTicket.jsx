
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle, Sparkles, X, Lock, ShieldAlert, Users, Video, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { findDeflectionAI } from '../lib/ai';
import { useSettings } from '../contexts/SettingsContext';
import { FAQS } from '../lib/constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import VoiceRecorder from '../components/common/VoiceRecorder';
import VideoRecorder from '../components/common/VideoRecorder';
import './SubmitTicket.css';

const SubmitTicket = () => {
    const { user, profile } = useAuth();
    const { settings } = useSettings();
    const { showSuccess, showError } = useToast();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialType = searchParams.get('type') || 'portal';

    const [formData, setFormData] = useState({
        fullName: profile?.full_name || user?.full_name || '',
        studentId: profile?.student_id || user?.student_id || '',
        email: profile?.email || user?.email || '',
        phoneNumber: profile?.phone_number || user?.phone_number || '',
        type: initialType,
        subject: '',
        description: ''
    });

    // Update form if user or profile loads late
    useEffect(() => {
        if (user || profile) {
            setFormData(prev => ({
                ...prev,
                fullName: profile?.full_name || user?.full_name || prev.fullName,
                studentId: profile?.student_id || user?.student_id || prev.studentId,
                email: profile?.email || user?.email || prev.email,
                phoneNumber: profile?.phone_number || user?.phone_number || prev.phoneNumber
            }));
        }
    }, [user, profile]);

    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // AI Deflection States
    const [suggestedHelp, setSuggestedHelp] = useState(null);
    const [isSearchingHelp, setIsSearchingHelp] = useState(false);
    const [showRecorder, setShowRecorder] = useState(false);
    const [videoBlob, setVideoBlob] = useState(null);
    const [systemSettings, setSystemSettings] = useState({ submissions_locked: false, maintenance_mode: false });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await api.system.getPublicSettings();
                setSystemSettings(settings);
            } catch (err) {
                console.error('Failed to fetch system settings:', err);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.subject.trim().length > 10) {
                setIsSearchingHelp(true);
                const match = await findDeflectionAI(formData.subject, FAQS);
                setSuggestedHelp(match);
                setIsSearchingHelp(false);
            } else {
                setSuggestedHelp(null);
            }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [formData.subject]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const ticketData = new FormData();
            ticketData.append('full_name', formData.fullName);
            ticketData.append('student_id', formData.studentId);
            ticketData.append('email', formData.email);
            ticketData.append('phone_number', formData.phoneNumber);
            ticketData.append('type', formData.type === 'general' ? 'other' : formData.type);
            ticketData.append('subject', formData.subject);
            ticketData.append('description', formData.description);
            ticketData.append('priority', 'Medium');

            if (file) {
                ticketData.append('attachment', file);
            } else if (videoBlob) {
                const videoFile = new File([videoBlob], "screen-recording.webm", { type: 'video/webm' });
                ticketData.append('attachment', videoFile);
            }

            const data = await api.tickets.create(ticketData);

            if (data) {
                showSuccess('Ticket submitted successfully!', 5000);
            }

            setIsSuccess(true);
        } catch (error) {
            console.error('Error submitting ticket:', error);
            showError(`Failed to submit ticket: ${error.message || error.error || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="container success-container">
                <Card className="success-card">
                    <div className="success-icon">
                        <CheckCircle size={48} />
                    </div>
                    <h1>Ticket Submitted!</h1>
                    <p>
                        Your request has been received by the CoDE support team.
                        A confirmation email has been sent to <strong>{formData.email}</strong>.
                    </p>
                    <div className="success-actions">
                        <Button onClick={() => navigate('/')}>Return Home</Button>
                        <Button variant="secondary" onClick={() => setIsSuccess(false)}>Submit Another</Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (settings.maintenanceMode) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
                <Card className="p-8 text-center" style={{ maxWidth: '500px' }}>
                    <ShieldAlert size={48} className="text-amber-500 mb-4 mx-auto" />
                    <h1 className="text-2xl font-bold mb-2">Systems Down for Maintenance</h1>
                    <p className="text-gray-600 mb-6">
                        CoDE Support submissions are currently paused for scheduled updates.
                        Please try again in a few hours.
                    </p>
                    <Link to="/">
                        <Button variant="primary">Back to Home</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="container submit-page-container">
            <div className="page-header">
                <h1>Submit a Support Request</h1>
                <p>Please fill out the form below. Our team typically responds within 24 hours.</p>
                <div className="workload-prediction">
                    <div className="pulse-dot green"></div>
                    <span>Expected Resolution: <strong>~2-4 hours</strong> (Low volume)</span>
                </div>
            </div>

            {systemSettings.maintenance_mode && (
                <Card className="maintenance-card" style={{ background: '#fef2f2', border: '1px solid #fee2e2', textAlign: 'center', padding: '3rem' }}>
                    <ShieldAlert size={48} color="#dc2626" style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>Maintenance in Progress</h2>
                    <p style={{ color: '#b91c1c' }}>The helpdesk is currently offline for scheduled maintenance. Please check back later.</p>
                    <Button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>Go Back</Button>
                </Card>
            )}

            {!systemSettings.maintenance_mode && systemSettings.submissions_locked && (
                <Card className="lock-card" style={{ background: '#fffbeb', border: '1px solid #fef3c7', textAlign: 'center', padding: '3rem' }}>
                    <Lock size={48} color="#d97706" style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ color: '#92400e', marginBottom: '1rem' }}>Submissions Paused</h2>
                    <p style={{ color: '#b45309' }}>New ticket submissions are temporarily disabled by the administration. You can still track your existing tickets.</p>
                    <Button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>Go Back</Button>
                </Card>
            )}

            {!systemSettings.maintenance_mode && !systemSettings.submissions_locked && systemSettings.max_open_tickets && systemSettings.current_ticket_count >= systemSettings.max_open_tickets && (
                <Card className="capacity-card" style={{ background: '#fff7ed', border: '1px solid #ffedd5', textAlign: 'center', padding: '3rem' }}>
                    <Users size={48} color="#ea580c" style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ color: '#9a3412', marginBottom: '1rem' }}>Support Queue Full</h2>
                    <p style={{ color: '#c2410c' }}>We are currently handling a high volume of requests. To ensure quality service, new submissions are temporarily paused. Please try again in an hour or check the FAQ.</p>
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Button variant="secondary" onClick={() => navigate('/faq')}>Browse FAQ</Button>
                        <Button onClick={() => navigate('/')}>Return Home</Button>
                    </div>
                </Card>
            )}

            {!systemSettings.maintenance_mode && !systemSettings.submissions_locked && (!systemSettings.max_open_tickets || systemSettings.current_ticket_count < systemSettings.max_open_tickets) && (
                <div className="form-layout">
                    <form onSubmit={handleSubmit} className="ticket-form">
                        <Card>
                            <div className="form-grid">
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    label="Full Name"
                                    placeholder="e.g. John Doe"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    disabled={!!(profile?.full_name || user?.user_metadata?.full_name)}
                                    style={{ backgroundColor: (profile?.full_name || user?.user_metadata?.full_name) ? '#f9fafb' : 'white' }}
                                />

                                <Input
                                    id="studentId"
                                    name="studentId"
                                    label={(profile?.role === 'agent' || profile?.role === 'super_admin') ? "Staff ID" : "Student ID"}
                                    placeholder={(profile?.role === 'agent' || profile?.role === 'super_admin') ? "e.g. UCC/STF/..." : "Index / Reference Number"}
                                    required
                                    value={formData.studentId}
                                    onChange={handleChange}
                                    disabled={!!(profile?.student_id || user?.user_metadata?.student_id)}
                                    style={{ backgroundColor: (profile?.student_id || user?.user_metadata?.student_id) ? '#f9fafb' : 'white' }}
                                />

                                <Input
                                    id="email"
                                    name="email"
                                    label="Email Address"
                                    type="email"
                                    placeholder="john@code.ucc.edu.gh"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="full-width"
                                    disabled={!!(profile?.email || user?.email)}
                                    style={{ backgroundColor: (profile?.email || user?.email) ? '#f9fafb' : 'white' }}
                                />

                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="e.g. +233 24 000 0000"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    disabled={!!(profile?.phone_number || user?.phone_number)}
                                    style={{ backgroundColor: (profile?.phone_number || user?.phone_number) ? '#f9fafb' : 'white' }}
                                />

                                <div className="input-group full-width">
                                    <label className="input-label" htmlFor="type">Issue Type</label>
                                    <select
                                        id="type"
                                        name="type"
                                        className="input-field"
                                        value={formData.type}
                                        onChange={handleChange}
                                    >
                                        <option value="portal">Portal / Login Issue</option>
                                        <option value="fees">Fees & Payments</option>
                                        <option value="academic">Academic / Grades</option>
                                        <option value="general">General Inquiry</option>
                                    </select>
                                </div>

                                <Input
                                    id="subject"
                                    name="subject"
                                    label="Subject"
                                    placeholder="Brief summary of the issue"
                                    required
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="full-width"
                                />

                                {/* AI Deflection UI */}
                                {(isSearchingHelp || suggestedHelp) && (
                                    <div className="full-width deflection-box">
                                        <Card className="ai-deflection-card">
                                            <div className="deflection-header">
                                                <div className="ai-badge">
                                                    <Sparkles size={14} /> AI Suggestions
                                                </div>
                                                <button
                                                    type="button"
                                                    className="close-deflection"
                                                    onClick={() => setSuggestedHelp(null)}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            {isSearchingHelp ? (
                                                <div className="searching-help">
                                                    <div className="pulse-dot"></div>
                                                    <span>Searching knowledge base...</span>
                                                </div>
                                            ) : suggestedHelp ? (
                                                <div className="suggestion-content">
                                                    <h4>{suggestedHelp.question}</h4>
                                                    <p>{suggestedHelp.answer}</p>
                                                    <div className="suggestion-footer">
                                                        <span>Did this help?</span>
                                                        <div className="suggestion-actions">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                type="button"
                                                                onClick={() => setSuggestedHelp(null)}
                                                            >
                                                                No, continue submitting
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </Card>
                                    </div>
                                )}

                                <div className="input-group full-width">
                                    <label className="input-label" htmlFor="description">Detailed Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        className="input-field"
                                        rows="5"
                                        placeholder="Please describe your issue in detail..."
                                        required
                                        value={formData.description}
                                        onChange={handleChange}
                                    ></textarea>

                                    <VoiceRecorder
                                        onTranscriptUpdate={(text) => {
                                            setFormData(prev => ({ ...prev, description: text }));
                                        }}
                                    />
                                </div>

                                <div className="input-group full-width">
                                    <label className="input-label">Attachment (Optional)</label>

                                    {!videoBlob ? (
                                        <div className="flex gap-2 items-center">
                                            <div className="flex-1">
                                                <Input
                                                    id="file"
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    accept="image/*,.pdf"
                                                />
                                            </div>
                                            <span className="text-gray-400 text-sm">OR</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowRecorder(true)}
                                                className="record-screen-btn"
                                            >
                                                <Video size={16} className="mr-2" /> Record Screen
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="video-blob-preview">
                                            <div className="video-card bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                                                <video
                                                    src={URL.createObjectURL(videoBlob)}
                                                    controls
                                                    className="w-full h-48 object-cover"
                                                />
                                                <div className="flex items-center gap-2 p-3 text-blue-700">
                                                    <Video size={18} />
                                                    <div className="flex-1">
                                                        <span className="text-sm font-bold block">Screen Recording</span>
                                                        <span className="text-xs text-blue-600">Attachment ready to upload</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setVideoBlob(null)}
                                                        className="text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={16} /> Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <small style={{ color: 'var(--text-muted)' }}>Supported: Images, PDF, Screen Recordings</small>
                                </div>
                            </div>

                            <div className="form-actions">
                                <Button type="submit" size="lg" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : (
                                        <>Submit Request <Send size={18} style={{ marginLeft: '8px' }} /></>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </form>

                    <div className="sidebar-tips">
                        <Card className="tips-card">
                            <h3><AlertCircle size={20} className="tip-icon" /> Before you submit</h3>
                            <ul className="tips-list">
                                <li>Check the <Link to="/faq">FAQ section</Link> first.</li>
                                <li>For fee issues, have your receipt number ready.</li>
                                <li>Use your official student email if possible.</li>
                                <li>Screenshots can be emailed after initial contact.</li>
                            </ul>
                        </Card>
                    </div>
                </div>
            )}
            {showRecorder && (
                <VideoRecorder
                    onRecordingComplete={(blob) => {
                        setVideoBlob(blob);
                        setShowRecorder(false);
                    }}
                    onCancel={() => setShowRecorder(false)}
                />
            )}
        </div>
    );
};

export default SubmitTicket;
