import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send,
    AlertCircle,
    Paperclip,
    X,
    FileText,
    CheckCircle2,
    Loader2,
    Info,
    ChevronLeft,
    Mic,
    Video,
    Lightbulb,
    User as UserIcon,
    Mail,
    Phone,
    CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCreateTicket, useFAQs } from '../hooks/useTickets';
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

    // Feature: Voice/Video Recorders
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showVideoRecorder, setShowVideoRecorder] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

    // Feature: AI Deflection
    const [suggestion, setSuggestion] = useState<DeflectionResult | null>(null);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.description.trim()) {
            showError('Please fill in all required fields');
            return;
        }

        try {
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

            await createTicket(ticketData);
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Submission failed:', err);
            showError(err.message || 'Failed to submit ticket');
        }
    };

    return (
        <div className="container submit-ticket-page fade-in">
            <header className="page-header">
                <Button variant="ghost" onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={20} /> Back to Dashboard
                </Button>
                <h1>Submit a New Concern</h1>
                <p>Tell us what's on your mind, and we'll get back to you as soon as possible.</p>
            </header>

            <div className="submit-grid">
                <div className="submit-form-container">
                    <Card className="form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="form-section">
                                <h3 className="section-title"><UserIcon size={18} /> Student Information</h3>
                                <div className="form-row">
                                    <div className="form-group half">
                                        <label htmlFor="fullName">Full Name</label>
                                        <div className="input-with-icon">
                                            <UserIcon size={16} className="input-icon" />
                                            <input
                                                type="text"
                                                id="fullName"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                className="form-input with-icon"
                                                placeholder="Enter full name"
                                                required // Assuming name is required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group half">
                                        <label htmlFor="studentId">Student ID</label>
                                        <div className="input-with-icon">
                                            <CreditCard size={16} className="input-icon" />
                                            <input
                                                type="text"
                                                id="studentId"
                                                name="studentId"
                                                value={formData.studentId}
                                                onChange={handleInputChange}
                                                className="form-input with-icon"
                                                placeholder="Enter ID"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group half">
                                        <label htmlFor="email">Email Address</label>
                                        <div className="input-with-icon">
                                            <Mail size={16} className="input-icon" />
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="form-input with-icon"
                                                placeholder="Enter email"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group half">
                                        <label htmlFor="phoneNumber">Phone Number</label>
                                        <div className="input-with-icon">
                                            <Phone size={16} className="input-icon" />
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
                            </div>

                            <div className="form-section">
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
                                            <div className="card-body" style={{ padding: '1.5rem' }}>
                                                <div className="deflection-header">
                                                    <div className="ai-badge">
                                                        <Lightbulb size={14} /> Instant AI Solution
                                                    </div>
                                                    <button type="button" className="close-deflection" onClick={() => setSuggestion(null)}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="suggestion-content">
                                                    <h4>{suggestion.faq.question}</h4>
                                                    <p>{suggestion.faq.answer}</p>
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
                            </div>

                            <div className="form-section">
                                <h3 className="section-title"><FileText size={18} /> Detailed Description</h3>
                                <div className="form-group">
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

                                {/* Voice & Video Recording Options */}
                                <div className="recording-options">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                                        className="option-btn"
                                    >
                                        <Mic size={16} /> {showVoiceRecorder ? 'Hide' : 'Add'} Voice Note
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowVideoRecorder(true)}
                                        className="option-btn"
                                    >
                                        <Video size={16} /> Record Screen Issue
                                    </Button>
                                </div>

                                {showVoiceRecorder && (
                                    <div className="recorder-container">
                                        <VoiceRecorder onTranscriptUpdate={handleVoiceTranscript} />
                                        <p className="recorder-hint">
                                            <Info size={14} /> Speak clearly to describe your issue. The transcript will be added to your description automatically.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="form-section">
                                <h3 className="section-title"><Paperclip size={18} /> Attachments (Optional)</h3>
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

                                {attachments.length > 0 && (
                                    <div className="file-list">
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

                            <div className="form-footer">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="submit-btn"
                                >
                                    {submitting ? (
                                        <><Loader2 className="animate-spin" size={20} /> Submitting...</>
                                    ) : (
                                        <><Send size={20} /> Submit Ticket</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                <aside className="submit-sidebar">
                    <Card className="tips-card">
                        <h3><CheckCircle2 size={18} /> Quick Tips</h3>
                        <ul>
                            <li>Include your student ID if it's related to portal access.</li>
                            <li>Upload screenshots of errors for faster resolution.</li>
                            <li>A clear subject line helps agents prioritize your request.</li>
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
