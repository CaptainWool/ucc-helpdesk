import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
    Send,
    AlertCircle,
    Paperclip,
    X,
    FileText,
    CheckCircle,
    Loader2,
    Info,
    ChevronLeft,
    Mic,
    Video,
    Lightbulb,
    User as UserIcon,
    Mail,
    Phone,
    CreditCard,
    HelpCircle,
    ArrowRight,
    LayoutDashboard,
    PlusCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTicket, useCreateTicket, useFAQs } from '../hooks/useTickets';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import VoiceRecorder from '../components/common/VoiceRecorder';
import VideoRecorder from '../components/common/VideoRecorder';
import { findDeflectionAI, DeflectionResult } from '../lib/ai';
import './SubmitTicket.css';

const SubmitTicket: React.FC = () => {
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const { settings } = useSettings();
    const { showSuccess, showError } = useToast();
    const { mutateAsync: createTicket, isPending: submitting } = useCreateTicket();
    const { data: faqs = [] } = useFAQs();

    const [formData, setFormData] = useState({
        fullName: profile?.full_name || user?.full_name || '',
        studentId: profile?.student_id || user?.student_id || '',
        email: profile?.email || user?.email || '',
        phoneNumber: profile?.phone_number || user?.phone_number || '',
        subject: '',
        type: 'General Inquiry',
        priority: 'Medium',
        description: '',
    });

    const [attachments, setAttachments] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    // Feature: Voice/Video Recorders
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showVideoRecorder, setShowVideoRecorder] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

    // Feature: AI Deflection
    const [suggestion, setSuggestion] = useState<DeflectionResult | null>(null);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [searchParams] = useSearchParams();
    const isSuccess = searchParams.get('success') === 'true';
    const queryTicketId = searchParams.get('ticketId') || '';

    const { data: fetchTicket, isLoading: loadingTicket } = useTicket(queryTicketId, {
        enabled: isSuccess && !!queryTicketId
    });

    const [isStudentInfoOpen, setIsStudentInfoOpen] = useState(true);
    const [isSubmittedLocal, setIsSubmittedLocal] = useState(false);
    const [submittedTicketLocal, setSubmittedTicketLocal] = useState<any>(null);

    const isSubmitted = isSuccess || isSubmittedLocal;
    const currentTicket = fetchTicket || submittedTicketLocal;

    // Diagnostic logging


    const categories = [
        'Portal Access',
        'Fee Payment/Financial',
        'Course Registration',
        'Academic Records',
        'Examination Issues',
        'General Inquiry',
        'Technical Support'
    ];

    // Effect to update formData when profile loads
    useEffect(() => {
        if (profile || user) {
            setFormData(prev => ({
                ...prev,
                fullName: profile?.full_name || user?.full_name || prev.fullName,
                studentId: profile?.student_id || user?.student_id || prev.studentId,
                email: profile?.email || user?.email || prev.email,
                phoneNumber: profile?.phone_number || user?.phone_number || prev.phoneNumber
            }));
            // Auto-collapse if we have data
            if (profile?.full_name || user?.full_name) {
                setIsStudentInfoOpen(false);
            }
        }
    }, [profile, user]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // AI Deflection Logic
    useEffect(() => {
        if (!formData.subject || formData.subject.length <= 5) {
            setSuggestion(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            if (faqs.length > 0) {
                setIsSearchingSuggestions(true);
                try {
                    const result = await findDeflectionAI(formData.subject, faqs);
                    setSuggestion(result);
                } catch (err) {
                    console.error('Failed to find deflection:', err);
                } finally {
                    setIsSearchingSuggestions(false);
                }
            }
        }, 600); // 600ms debounce

        return () => clearTimeout(timeoutId);
    }, [formData.subject, faqs]);


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            addFiles(files);
        }
    };

    const addFiles = (files: File[]) => {
        const validFiles = files.filter(file => {
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
            if (!isValidSize) {
                showError(`File ${file.name} is too large. Max size is 5MB.`);
            }
            return isValidSize;
        });

        setAttachments(prev => [...prev, ...validFiles]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleVoiceTranscript = (transcript: string) => {
        setFormData(prev => ({
            ...prev,
            description: prev.description + (prev.description ? ' ' : '') + transcript
        }));
    };

    const handleVideoRecordingComplete = (blob: Blob) => {
        setVideoBlob(blob);
        setShowVideoRecorder(false);
        const videoFile = new File([blob], `screen-recording-${Date.now()}.webm`, { type: 'video/webm' });
        setAttachments(prev => [...prev, videoFile]);
        showSuccess('Screen recording attached successfully');
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.fullName || !formData.studentId || !formData.email) {
                showError('Please complete all identity fields');
                return;
            }
        }
        if (currentStep === 2) {
            if (!formData.subject || !formData.description) {
                showError('Please provide a subject and description');
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (currentStep < totalSteps) {
            nextStep();
            return;
        }

        try {
            console.log('Submitting ticket...');
            const ticketData = new FormData();
            ticketData.append('student_id', formData.studentId);
            ticketData.append('full_name', formData.fullName);
            ticketData.append('email', formData.email);
            ticketData.append('phone_number', formData.phoneNumber);
            ticketData.append('subject', formData.subject);
            ticketData.append('type', formData.type);
            ticketData.append('priority', formData.priority);
            ticketData.append('description', formData.description);

            attachments.forEach((file) => {
                ticketData.append('attachments', file);
            });

            const result = await createTicket(ticketData);
            console.log('Ticket created successfully:', result);

            if (!result || !result.id) {
                throw new Error('Server returned success but no ticket ID was found.');
            }

            // Set local state before navigation to ensure immediate UI update
            setSubmittedTicketLocal(result);
            setIsSubmittedLocal(true);

            // Navigate to persistent success URL
            navigate(`/submit-ticket?success=true&ticketId=${result.id}`, { replace: true });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            console.error('Submission failed:', err);
            showError(err.message || 'Failed to submit ticket');
        }
    };

    if (isSubmitted) {
        // Only show loading if we don't have ANY ticket data yet
        if (loadingTicket && !currentTicket) {
            return (
                <div className="container submit-loading-overlay">
                    <div className="loading-card">
                        <Loader2 className="animate-spin" size={48} />
                        <p>Confirming your submission...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="container submit-success-page fade-in">
                <Card className="success-display-card">
                    <div className="success-icon-wrapper">
                        <CheckCircle size={80} className="success-check-icon" />
                    </div>
                    <div className="success-content">
                        <h2>Ticket Submitted Successfully!</h2>
                        <p className="success-main-msg">
                            Your concern has been registered under <strong>Ticket #{String(currentTicket?.id || '').substring(0, 8) || '...'}</strong>.
                        </p>

                        <div className="notification-alert-box">
                            <div className="alert-item">
                                <Mail size={24} />
                                <span>A confirmation <strong>email</strong> has been sent to <strong>{currentTicket?.email || formData.email}</strong></span>
                            </div>
                            {(currentTicket?.phone_number || formData.phoneNumber) && (
                                <div className="alert-item">
                                    <Phone size={24} />
                                    <span>An <strong>SMS</strong> notification has been sent to <strong>{currentTicket?.phone_number || formData.phoneNumber}</strong></span>
                                </div>
                            )}
                        </div>

                        <div className="success-actions-section mt-6 text-left">
                            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">What would you like to do next?</h3>
                            <div className="success-actions-grid">
                                <div className="action-tile" onClick={() => navigate(`/track-ticket?id=${currentTicket?.id}`)}>
                                    <div className="tile-icon blue">
                                        <ArrowRight size={24} />
                                    </div>
                                    <div className="tile-text">
                                        <strong>Track this Ticket</strong>
                                        <span>Check real-time status</span>
                                    </div>
                                </div>
                                <div className="action-tile" onClick={() => navigate('/dashboard')}>
                                    <div className="tile-icon green">
                                        <LayoutDashboard size={24} />
                                    </div>
                                    <div className="tile-text">
                                        <strong>Go to Dashboard</strong>
                                        <span>View all requests</span>
                                    </div>
                                </div>
                                <div className="action-tile" onClick={() => navigate('/faq')}>
                                    <div className="tile-icon purple">
                                        <Lightbulb size={24} />
                                    </div>
                                    <div className="tile-text">
                                        <strong>Visit FAQ Center</strong>
                                        <span>Find instant answers</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="success-footer mt-8 pt-6 border-t border-color-soft flex justify-center">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsSubmittedLocal(false);
                                    setFormData({
                                        studentId: profile?.student_id || user?.student_id || '',
                                        fullName: profile?.full_name || user?.full_name || '',
                                        email: profile?.email || user?.email || '',
                                        phoneNumber: '',
                                        subject: '',
                                        type: 'Portal Issue',
                                        priority: 'Medium',
                                        description: '',
                                    });
                                    setAttachments([]);
                                    setCurrentStep(1);
                                    navigate('/submit-ticket', { replace: true });
                                }}
                            >
                                <PlusCircle size={18} /> Submit Another Request
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="container submit-ticket-page fade-in">
            <header className="page-header">
                <Button variant="ghost" onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={20} /> Back to Dashboard
                </Button>
                <h1>Submit a New Concern</h1>
                <p>Tell us what's on your mind, and we'll get back to you as soon as possible.</p>
            </header>

            {settings.submissions_locked && (
                <div className="locked-alert-banner mb-8">
                    <Card className="locked-card border-amber">
                        <div className="flex items-start gap-4">
                            <div className="locked-icon-bg">
                                <AlertCircle size={24} className="text-amber" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">New Submissions are Temporarily Closed</h3>
                                <p className="text-muted">The UCC Helpdesk is currently prioritizing existing requests. New ticket submissions have been paused by the administration. Please check our FAQ or try again later.</p>
                                <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
                                    View My Existing Tickets
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {!settings.submissions_locked ? (
                <div className="submit-grid">
                    <div className="submit-form-container">
                        <div className="wizard-progress-container">
                            <div className="wizard-progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ '--progress-width': `${(currentStep / totalSteps) * 100}%` } as React.CSSProperties}
                                ></div>
                            </div>
                            <div className="wizard-steps-indicators">
                                {['Identify', 'Describe', 'Evidence', 'Review'].map((label, i) => (
                                    <div
                                        key={i}
                                        className={`wizard-step-pill ${currentStep >= i + 1 ? 'active' : ''} ${currentStep === i + 1 ? 'current' : ''}`}
                                    >
                                        <span className="step-num">{i + 1}</span>
                                        <span className="step-label">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Card className="form-card wizard-card">
                            <form onSubmit={handleSubmit}>
                                {/* STEP 1: IDENTITY */}
                                {currentStep === 1 && (
                                    <div className="form-section wizard-section fade-in">
                                        <h3 className="section-title"><UserIcon size={18} /> Student Information</h3>
                                        <div className="compact-grid">
                                            <div className="form-group">
                                                <label htmlFor="fullName">Full Name</label>
                                                <div className="input-with-icon">
                                                    <UserIcon size={14} className="input-icon" />
                                                    <input
                                                        type="text"
                                                        id="fullName"
                                                        name="fullName"
                                                        value={formData.fullName}
                                                        onChange={handleInputChange}
                                                        className="form-input with-icon"
                                                        placeholder="Enter full name"
                                                        readOnly={!!(profile?.full_name || user?.full_name)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="studentId">Student ID</label>
                                                <div className="input-with-icon">
                                                    <CreditCard size={14} className="input-icon" />
                                                    <input
                                                        type="text"
                                                        id="studentId"
                                                        name="studentId"
                                                        value={formData.studentId}
                                                        onChange={handleInputChange}
                                                        className="form-input with-icon"
                                                        placeholder="Enter ID"
                                                        readOnly={!!(profile?.student_id || user?.student_id)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="email">Email Address</label>
                                                <div className="input-with-icon">
                                                    <Mail size={14} className="input-icon" />
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="form-input with-icon"
                                                        placeholder="Enter email"
                                                        readOnly={!!(profile?.email || user?.email)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="phoneNumber">Phone Number</label>
                                                <div className="input-with-icon">
                                                    <Phone size={14} className="input-icon" />
                                                    <input
                                                        type="tel"
                                                        id="phoneNumber"
                                                        name="phoneNumber"
                                                        value={formData.phoneNumber}
                                                        onChange={handleInputChange}
                                                        className="form-input with-icon"
                                                        placeholder="Enter number"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="step-hint mt-6">
                                            <Info size={14} /> Quick Check: Is this information correct? This ensures we contact the right person.
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: DETAILS */}
                                {currentStep === 2 && (
                                    <div className="form-section wizard-section fade-in">
                                        <h3 className="section-title"><Info size={18} /> Ticket Details</h3>

                                        {/* AI Deflection Box */}
                                        {isSearchingSuggestions && (
                                            <div className="deflection-box searching-help">
                                                <div className="pulse-dot"></div> Analyzing your issue...
                                            </div>
                                        )}

                                        {suggestion && !isSearchingSuggestions && (
                                            <div className="deflection-box">
                                                <div className="ai-deflection-card">
                                                    <div className="deflection-card-body">
                                                        <div className="deflection-header">
                                                            <div className="ai-badge">
                                                                <Lightbulb size={14} /> Instant AI Solution
                                                            </div>
                                                            <button type="button" className="close-deflection" onClick={() => setSuggestion(null)}>
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="suggestion-content">
                                                            <h4>{suggestion.question}</h4>
                                                            <p>{suggestion.answer}</p>
                                                        </div>
                                                        <div className="suggestion-footer">
                                                            <span>Was this helpful?</span>
                                                            <div className="suggestion-actions">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => navigate('/faq')}
                                                                    type="button"
                                                                >
                                                                    View Full FAQ
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => setSuggestion(null)}
                                                                    type="button"
                                                                >
                                                                    Still need help
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="form-group">
                                            <label htmlFor="subject">Subject *</label>
                                            <input
                                                type="text"
                                                id="subject"
                                                name="subject"
                                                placeholder="What is the issue about? (e.g., Cannot access portal)"
                                                value={formData.subject}
                                                onChange={handleInputChange}
                                                required
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group half">
                                                <label htmlFor="type">Category</label>
                                                <select
                                                    id="type"
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleInputChange}
                                                    className="form-select"
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group half">
                                                <label htmlFor="priority">Urgency Level</label>
                                                <select
                                                    id="priority"
                                                    name="priority"
                                                    value={formData.priority}
                                                    onChange={handleInputChange}
                                                    className="form-select"
                                                >
                                                    <option value="Low">Low - General Question</option>
                                                    <option value="Medium">Medium - Affecting my work</option>
                                                    <option value="High">High - Urgent Issue</option>
                                                    <option value="Urgent">Urgent - Critical Blocker</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group mt-4">
                                            <label htmlFor="description">Message *</label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                rows={6}
                                                placeholder="Please provide as much detail as possible..."
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                required
                                                className="form-textarea"
                                            ></textarea>
                                        </div>

                                        {/* Voice Recording Option Integrated Here */}
                                        <div className="mt-4">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                                                className="flex items-center gap-2"
                                            >
                                                <Mic size={16} /> {showVoiceRecorder ? 'Hide' : 'Add'} Voice Note (Dictate)
                                            </Button>
                                            {showVoiceRecorder && (
                                                <div className="recorder-container mt-2">
                                                    <VoiceRecorder onTranscriptUpdate={handleVoiceTranscript} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: EVIDENCE */}
                                {currentStep === 3 && (
                                    <div className="form-section wizard-section fade-in">
                                        <h3 className="section-title"><Paperclip size={18} /> Attachments & Evidence</h3>
                                        <p className="text-muted text-sm mb-4">Adding screenshots or recordings helps our team resolve your issue much faster.</p>

                                        <div
                                            className={`file-drop-zone ${dragActive ? 'active' : ''}`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                        >
                                            <input
                                                type="file"
                                                id="attachments"
                                                multiple
                                                hidden
                                                onChange={handleFileChange}
                                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                            />
                                            <label htmlFor="attachments" className="drop-zone-content">
                                                <div className="drop-icon"><Paperclip size={32} /></div>
                                                <p><strong>Click to upload</strong> or drag and drop</p>
                                                <span>PNG, JPG, PDF, DOC (max. 5MB per file)</span>
                                            </label>
                                        </div>

                                        <div className="mt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowVideoRecorder(true)}
                                                className="w-full flex justify-center items-center gap-2"
                                            >
                                                <Video size={18} /> Record your screen issue instead
                                            </Button>
                                        </div>

                                        {attachments.length > 0 && (
                                            <div className="file-list mt-6">
                                                <h4>Attached Files ({attachments.length})</h4>
                                                {attachments.map((file, index) => (
                                                    <div key={index} className="file-item">
                                                        <Paperclip size={14} />
                                                        <span className="file-name">{file.name}</span>
                                                        <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                        <button type="button" onClick={() => removeAttachment(index)} className="remove-file">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 4: REVIEW */}
                                {currentStep === 4 && (
                                    <div className="form-section wizard-section fade-in">
                                        <h3 className="section-title"><CheckCircle size={18} /> Review Your Concern</h3>
                                        <div className="review-grid">
                                            <div className="review-block">
                                                <span className="review-label">Student</span>
                                                <div className="review-value-card">
                                                    <strong>{formData.fullName}</strong>
                                                    <p>{formData.studentId} • {formData.email}</p>
                                                </div>
                                            </div>
                                            <div className="review-block">
                                                <span className="review-label">Issue Details</span>
                                                <div className="review-value-card">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="badge badge-outline">{formData.type}</span>
                                                        <span className={`badge priority-${formData.priority.toLowerCase()}`}>{formData.priority}</span>
                                                    </div>
                                                    <h4>{formData.subject}</h4>
                                                    <p className="line-clamp-3">{formData.description}</p>
                                                </div>
                                            </div>
                                            <div className="review-block">
                                                <span className="review-label">Attachments</span>
                                                <div className="review-value-card">
                                                    {attachments.length === 0 ? (
                                                        <p className="text-muted italic">No attachments added</p>
                                                    ) : (
                                                        <div className="flex gap-2 flex-wrap">
                                                            {attachments.map((f, i) => (
                                                                <span key={i} className="attachment-pill"><Paperclip size={12} /> {f.name.substring(0, 15)}...</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="final-confirmation-notice mt-6">
                                            <p>By submitting this ticket, you agree that UCC coordinators will review your data to provide resolution. We usually respond within 24-48 hours.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="wizard-footer">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={prevStep}
                                        className={`wizard-btn-back ${currentStep === 1 ? 'invisible' : ''}`}
                                    >
                                        <ChevronLeft size={20} /> Back
                                    </Button>

                                    {currentStep < totalSteps ? (
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            className="wizard-btn-next"
                                        >
                                            Next Stage <ArrowRight size={20} />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="wizard-btn-submit"
                                        >
                                            {submitting ? (
                                                <><Loader2 className="animate-spin" size={20} /> Submitting...</>
                                            ) : (
                                                <><Send size={20} /> Confirm & Submit Ticket</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>

                    <aside className="submit-sidebar">
                        <Card className="tips-card">
                            <h3><AlertCircle size={20} className="tip-icon" /> Before you submit</h3>
                            <ul className="tips-list">
                                <li>Check the <Link to="/faq">FAQ section</Link> first.</li>
                                <li>For fee issues, have your receipt number ready.</li>
                                <li>Use your official student email if possible.</li>
                                <li>Screenshots can be emailed after initial contact.</li>
                            </ul>
                        </Card>

                        <Card className="info-card suggestion-highlight">
                            <h3><Lightbulb size={18} /> Did you know?</h3>
                            <p>Our AI analyzes your subject in real-time to suggest instant fixes from our FAQ database.</p>
                        </Card>

                        <Card className="info-card">
                            <h3><AlertCircle size={18} /> Response Time</h3>
                            <p>Most tickets are addressed within <strong>24-48 hours</strong>.</p>
                            <p>Urgent issues are prioritized and usually handled within 4 hours during business days.</p>
                        </Card>
                    </aside>
                </div>
            ) : null}

            {/* Video Recorder Modal */}
            {showVideoRecorder && (
                <VideoRecorder
                    onRecordingComplete={handleVideoRecordingComplete}
                    onCancel={() => setShowVideoRecorder(false)}
                />
            )}
        </div>
    );
};

export default SubmitTicket;
