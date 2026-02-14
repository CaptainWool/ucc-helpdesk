import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send,
    Paperclip,
    X,
    FileText,
    CheckCircle2,
    Loader2,
    Info,
    ChevronLeft,
    Sparkles,
    Lightbulb
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCreateTicket } from '../hooks/useTickets';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { findDeflectionAI, type DeflectionResult } from '../lib/ai';
import { api } from '../lib/api';
import { FAQ } from '../types';
import './SubmitTicket.css';

const categories = [
    'Portal Access',
    'Fee Payment/Financial',
    'Course Registration',
    'Academic Records',
    'Examination Issues',
    'General Inquiry',
    'Technical Support'
];

const SubmitTicket: React.FC = () => {
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const { showSuccess, showError } = useToast();
    const { mutateAsync: createTicket, isPending: submitting } = useCreateTicket();

    const [formData, setFormData] = useState({
        subject: '',
        type: 'General Inquiry',
        priority: 'Medium',
        description: '',
    });

    const [attachments, setAttachments] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [suggestion, setSuggestion] = useState<DeflectionResult | null>(null);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [faqs, setFaqs] = useState<FAQ[]>([]);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const data = await api.faq.list();
                if (Array.isArray(data)) {
                    setFaqs(data);
                }
            } catch (err) {
                console.error('Failed to fetch FAQs:', err);
            }
        };
        fetchFaqs();
    }, []);

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
        }, 600);

        return () => clearTimeout(timeoutId);
    }, [formData.subject, faqs]);

    const displayUser = profile || user;

    // IF USER IS NOT LOGGED IN OR NO PROFILE, SHOW ERROR INSTEAD OF BLANK
    if (!displayUser) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Authentication Error</h2>
                <p>Please log in to submit a ticket.</p>
                <Button onClick={() => navigate('/login')}>Go to Login</Button>
            </div>
        );
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.description.trim()) {
            showError('Please fill in all required fields');
            return;
        }

        try {
            const ticketData = new FormData();
            ticketData.append('student_id', displayUser.student_id || displayUser.id || '');
            ticketData.append('full_name', displayUser.full_name || '');
            ticketData.append('email', displayUser.email || '');
            ticketData.append('subject', formData.subject);
            ticketData.append('type', formData.type);
            ticketData.append('priority', formData.priority);
            ticketData.append('description', formData.description);

            attachments.forEach((file) => {
                ticketData.append('attachments', file);
            });

            await createTicket(ticketData);
            showSuccess('Ticket submitted successfully!');
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
                                <h3 className="section-title"><Info size={18} /> Basic Information</h3>
                                <div className="form-group">
                                    <label htmlFor="subject">Subject *</label>
                                    <div className="subject-input-wrapper">
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
                                        {isSearchingSuggestions && (
                                            <div className="searching-spinner">
                                                <Loader2 className="animate-spin" size={16} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {suggestion && (
                                    <div className="ai-suggestion-card fade-in">
                                        <div className="suggestion-header">
                                            <Sparkles size={16} className="sparkle-icon" />
                                            <span>Instant AI Solution Found</span>
                                        </div>
                                        <div className="suggestion-body">
                                            <h4>{suggestion.question}</h4>
                                            <p>{suggestion.answer}</p>
                                        </div>
                                        <div className="suggestion-footer">
                                            <p>Does this resolve your issue?</p>
                                            <div className="suggestion-actions">
                                                <Button type="button" size="sm" variant="outline" onClick={() => navigate('/faq')}>
                                                    View Full FAQ
                                                </Button>
                                                <Button type="button" size="sm" onClick={() => setSuggestion(null)}>
                                                    Still need help
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-row">
                                    <div className="form-group">
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
                                    <div className="form-group">
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
                        <h3><Info size={18} /> Response Time</h3>
                        <p>Most tickets are addressed within <strong>24-48 hours</strong>.</p>
                        <p>Urgent issues are handled within 4 hours during business days.</p>
                    </Card>
                </aside>
            </div>
        </div>
    );
};

export default SubmitTicket;
