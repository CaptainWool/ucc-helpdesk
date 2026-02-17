import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    Search,
    Clock,
    CheckCircle,
    ChevronLeft,
    Send,
    Loader,
    User,
    Shield,
    Info,
    Zap,
    Tag,
    Mail,
    Calendar,
    ArrowRight,
    ArrowLeft,
    FileText,
    MessageCircle,
    Download,
    AlertCircle,
    Brain,
    ListChecks,
    TrendingUp,
    CheckCircle2,
    Star,
    Paperclip,
    ExternalLink,
    Image as ImageIcon,
    File as FileIcon,
    Lightbulb
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTicket, useAddTicketMessage } from '../hooks/useTickets';
import { summarizeTicketThread, SummaryResult, generateSmartReplyAI } from '../lib/ai';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Timeline, { TimelineStep } from '../components/common/Timeline';
import './TrackTicket.css';

const TrackTicket: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { showError, showSuccess } = useToast();
    const ticketId = searchParams.get('id') || '';
    const chatEndRef = useRef<HTMLDivElement>(null);

    // State
    const [searchId, setSearchId] = useState('');
    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [aiSummary, setAiSummary] = useState<SummaryResult | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isDrafting, setIsDrafting] = useState(false);

    // Hooks
    const { data: ticket, isLoading, error } = useTicket(ticketId, {
        enabled: !!ticketId,
        refetchInterval: 15000
    });

    const { mutateAsync: addMessage, isPending: sending } = useAddTicketMessage();

    const isAdmin = profile?.role === 'agent' || profile?.role === 'super_admin';

    // Effects
    useEffect(() => {
        if (error && ticketId) {
            showError('Unable to locate ticket. Please verify your Tracking ID.');
            setSearchParams({});
        }
    }, [error, ticketId, setSearchParams, showError]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.messages]);

    useEffect(() => {
        if (isAdmin && ticket && ticket.messages && ticket.messages.length > 0 && !aiSummary) {
            handleFetchSummary();
        }
    }, [isAdmin, ticket?.id, ticket?.messages?.length]);

    const handleFetchSummary = async () => {
        if (!ticket) return;
        setIsGeneratingSummary(true);
        try {
            const summary = await summarizeTicketThread(ticket, ticket.messages || []);
            setAiSummary(summary);
        } catch (err) {
            console.error('Failed to generate AI summary:', err);
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    // Handlers
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId.trim()) return;
        setSearchParams({ id: searchId.trim() });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !ticket) return;

        try {
            await addMessage({
                ticketId: ticket.id,
                message: message.trim(),
                isInternal: isInternal && isAdmin
            });
            setMessage('');
            showSuccess('Update transmitted successfully.');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const handleGenerateDraft = async () => {
        if (!ticket || !isAdmin) return;
        setIsDrafting(true);
        try {
            const draft = await generateSmartReplyAI(ticket, ticket.messages || []);
            setMessage(draft);
            showSuccess('AI draft synthesized and inserted.');
        } catch (err) {
            console.error('AI Drafting failed:', err);
            showError('Generation failed.');
        } finally {
            setIsDrafting(false);
        }
    };

    const handleRateTicket = async (rating: number) => {
        if (!ticket) return;
        try {
            await addMessage({
                ticketId: ticket.id,
                message: `User provided a ${rating}-star rating.`,
                isInternal: true
            });
            showSuccess(`Thank you for your ${rating}-star feedback!`);
        } catch (err) {
            console.error('Rating failed:', err);
        }
    };

    const getTimelineSteps = (status: string): TimelineStep[] => {
        const steps: TimelineStep[] = [
            { id: 'submitted', label: 'Ticket Submitted', description: 'Record successfully created in our system.', status: 'completed', date: ticket?.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A' },
            { id: 'queue', label: 'Analyzing Request', description: 'Our AI and agents are reviewing the case.', status: 'upcoming' },
            { id: 'active', label: 'Agent Assigned', description: 'A coordinator is actively working on a resolution.', status: 'upcoming' },
            { id: 'resolved', label: 'Issue Resolved', description: 'A final solution has been provided.', status: 'upcoming' },
        ];

        const s = (status || '').toLowerCase();
        if (s === 'new') {
            steps[1].status = 'current';
        } else if (s === 'open') {
            steps[1].status = 'completed';
            steps[2].status = 'current';
        } else if (s === 'in progress') {
            steps[1].status = 'completed';
            steps[2].status = 'completed';
            steps[2].label = 'Investigation Active';
            steps[3].status = 'current';
        } else if (s === 'resolved') {
            steps[1].status = 'completed';
            steps[2].status = 'completed';
            steps[3].status = 'completed';
            steps[3].date = ticket?.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : 'Just now';
        }

        return steps;
    };

    // View Components
    const renderSearchLanding = () => (
        <main className="search-landing">
            <h1>Track Your Submission</h1>
            <p>Enter your unique Tracking ID to monitor progress, communicate with agents, and access resolution details.</p>

            <form onSubmit={handleSearch} className="search-form-container">
                <div className="search-input-group">
                    <Search size={24} color="var(--primary)" className="search-icon-inline" />
                    <input
                        type="text"
                        placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                    <Button type="submit" className="search-submit-btn">
                        Locate Record
                    </Button>
                </div>
            </form>

            <div className="landing-gadgets">
                <div className="gadget-item">
                    <Shield size={16} /> Secure Encryption
                </div>
                <div className="gadget-item">
                    <Clock size={16} /> Real-time Updates
                </div>
            </div>
        </main>
    );

    const renderDetailDashboard = () => {
        if (isLoading) {
            return (
                <div className="track-loading track-loading-container">
                    <Loader className="animate-spin" size={64} color="var(--primary)" />
                    <p className="track-loading-text">Syncing with Service Desk...</p>
                </div>
            );
        }

        if (!ticket) return null;

        return (
            <div className="detail-dashboard">
                <header className="page-header premium-header">
                    <div className="header-top-nav">
                        <div className="back-link" onClick={() => setSearchParams({})}>
                            <ChevronLeft size={18} /> Search Dashboard
                        </div>
                        <div className="header-actions-group">
                            <Button variant="outline" size="sm" className="btn-pill" onClick={() => window.print()}>
                                <Download size={16} /> Export PDF
                            </Button>
                            <Button variant="primary" size="sm" className="btn-pill" onClick={() => navigate('/submit-ticket')}>
                                New Ticket
                            </Button>
                        </div>
                    </div>

                    <div className="header-main-content">
                        <div className="title-section">
                            <div className="status-meta-row">
                                <span className={`badge-service premium-badge status-${(ticket.status || '').toLowerCase().replace(' ', '-')}`}>
                                    {ticket.status}
                                </span>
                                <span className="ticket-id-chip">#{String(ticket.id).split('-')[0].toUpperCase()}</span>
                            </div>
                            <h1 className="ticket-subject-title">{ticket.subject}</h1>
                        </div>
                    </div>
                </header>

                {isAdmin && (
                    <div className={`intelligence-bar visible`}>
                        <div className="intel-shimmer" />
                        <div className="intel-content">
                            <div className="intel-icon">
                                <Brain size={24} className="pulse-brain" />
                            </div>
                            <div className="intel-text">
                                {isGeneratingSummary ? (
                                    <span className="intel-loading">AI is synthesizing case history...</span>
                                ) : aiSummary ? (
                                    <>
                                        <span className="intel-label">AI CASE SUMMARY</span>
                                        <p className="intel-summary">{aiSummary.executiveSummary}</p>
                                    </>
                                ) : (
                                    <span className="intel-placeholder">AI Summary will appear here to help you get up to speed.</span>
                                )}
                            </div>
                            {aiSummary && (
                                <div className="intel-badges">
                                    <span className={`intel-status-pill ${aiSummary.urgencyLevel.toLowerCase()}`}>
                                        {aiSummary.urgencyLevel} Urgency
                                    </span>
                                    <span className="intel-status-pill sentiment">
                                        {aiSummary.sentiment}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="track-grid">
                    <div className="service-hub">
                        <Card className="hub-card timeline-card">
                            <div className="card-header-simple">
                                <h3><Clock size={18} /> Resolution Progress</h3>
                            </div>
                            <Timeline steps={getTimelineSteps(ticket.status)} />
                        </Card>

                        {ticket.attachment_url && (
                            <Card className="hub-card attachment-gallery-card">
                                <div className="card-header-simple">
                                    <h3><Paperclip size={18} /> Case Attachments</h3>
                                </div>
                                <div className="attachment-grid">
                                    {(() => {
                                        try {
                                            const urls = JSON.parse(ticket.attachment_url);
                                            return Array.isArray(urls) ? urls.map((url: string, i: number) => {
                                                const isImg = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                                const name = url.split('/').pop() || `File ${i + 1}`;
                                                const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;

                                                return (
                                                    <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer" className="attachment-item-premium">
                                                        {isImg ? (
                                                            <div className="attachment-preview-box">
                                                                <img src={fullUrl} alt={name} loading="lazy" />
                                                                <div className="preview-overlay">
                                                                    <ExternalLink size={16} />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="attachment-file-icon">
                                                                <FileIcon size={32} />
                                                                <span className="file-ext">{name.split('.').pop()?.toUpperCase()}</span>
                                                            </div>
                                                        )}
                                                        <div className="attachment-meta">
                                                            <span className="attachment-name">{name}</span>
                                                            <span className="attachment-action">View Full <ArrowRight size={12} /></span>
                                                        </div>
                                                    </a>
                                                );
                                            }) : null;
                                        } catch (e) {
                                            return <p className="text-muted">Unable to parse attachments.</p>;
                                        }
                                    })()}
                                </div>
                            </Card>
                        )}

                        <Card className="hub-card chat-card-premium">
                            <div className="chat-scroller">
                                <div className="msg-bubble msg-system">
                                    <div className="msg-header">
                                        <Zap size={14} />
                                        <span>SYSTEM INITIALIZED</span>
                                    </div>
                                    <div className="msg-text">Originating concern: {ticket.description}</div>
                                </div>

                                {ticket.messages?.map((msg: any, idx: number) => (
                                    <div key={idx} className={`msg-bubble ${msg.sender_email === user?.email ? 'msg-sent' : 'msg-received'} ${msg.is_internal ? 'msg-internal' : ''}`}>
                                        <div className="msg-header">
                                            {msg.is_internal ? <Shield size={12} /> : <User size={12} />}
                                            <span>{msg.sender_name || msg.sender_email}</span>
                                            <span className="msg-sep">•</span>
                                            <span className="msg-timestamp">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="msg-text">{msg.message}</div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="input-dock">
                                {isAdmin && (
                                    <div className="internal-flag">
                                        <input type="checkbox" id="int-note" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                                        <label htmlFor="int-note" className="internal-flag-label">
                                            <Shield size={14} /> Add as Secure Internal Note
                                        </label>
                                    </div>
                                )}
                                <div className="dock-wrapper-premium">
                                    <div className="textarea-container">
                                        <textarea
                                            placeholder="Transmit update to agents..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={2}
                                        />
                                        <div className="textarea-glow" />
                                    </div>
                                    <div className="dock-footer-premium">
                                        <div className="dock-info-row">
                                            {isAdmin && (
                                                <Button type="button" variant="ghost" size="sm" className="ai-draft-btn-premium" onClick={handleGenerateDraft} disabled={isDrafting}>
                                                    {isDrafting ? <Loader className="animate-spin" size={14} /> : <Brain size={14} />}
                                                    <span>Draft with AI</span>
                                                </Button>
                                            )}
                                            {!isDrafting && <span className="instant-label"><Info size={14} /> Transmission is instantaneous</span>}
                                        </div>
                                        <Button type="submit" disabled={sending || !message.trim()} className="send-btn-nexus">
                                            {sending ? <Loader className="animate-spin" size={18} /> : <><Send size={18} /> Transmit Update</>}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </Card>
                    </div>

                    <aside className="intel-sidebar">
                        <Card className={`intel-card priority-${(ticket.priority || 'Medium').toLowerCase()}`}>
                            <div className="priority-ring" />
                            <h3><Zap size={20} /> Case Context</h3>
                            <div className="meta-list">
                                <div className="meta-item">
                                    <span className="meta-label">Classification</span>
                                    <span className="meta-value">{ticket.type}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Requester</span>
                                    <div className="requester-info">
                                        <div className="avatar-placeholder">{ticket.full_name?.charAt(0)}</div>
                                        <span className="meta-value">{ticket.full_name}</span>
                                    </div>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">SLA Countdown</span>
                                    <span className={`meta-value sla-text ${(ticket.priority || '').toLowerCase() === 'urgent' ? 'urgent' : ''}`}>
                                        {ticket.status === 'Resolved' ? 'RESOLVED' : '2h 14m remaining'}
                                    </span>
                                </div>
                            </div>
                            <div className="sidebar-divider" />
                            <div className="ai-insights">
                                <div className="insight-header"><TrendingUp size={14} /> <span>AI Insights</span></div>
                                {aiSummary ? (
                                    <ul className="insight-list">
                                        {aiSummary.keyPoints.slice(0, 3).map((point, i) => <li key={i}>{point}</li>)}
                                    </ul>
                                ) : <p className="insight-placeholder">Analyzing ticket for insights...</p>}
                            </div>
                        </Card>

                        {aiSummary && aiSummary.suggestedNextSteps.length > 0 && (
                            <Card className="suggested-actions-card">
                                <h3><ListChecks size={20} /> Recommended Actions</h3>
                                <div className="action-list">
                                    {aiSummary.suggestedNextSteps.map((step, i) => (
                                        <div key={i} className="action-item-check">
                                            <CheckCircle2 size={16} /> <span>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        <Card className="intel-card quick-actions-variant">
                            <h3 className="white-text"><MessageCircle size={20} /> Quick Actions</h3>
                            <div className="action-grid">
                                <Button variant="ghost" className="action-btn"><FileText size={16} /> Knowledge Base</Button>
                                <Button variant="ghost" className="action-btn"><Mail size={16} /> Email Transcript</Button>
                                <Button variant="ghost" className="action-btn" onClick={() => window.print()}><Download size={16} /> Print Case</Button>
                            </div>
                        </Card>

                        {ticket.status === 'Resolved' && (
                            <Card className="feedback-card-premium fade-in">
                                <div className="feedback-content">
                                    <div className="feedback-icon-bg">
                                        <Star size={32} className="star-bounce" />
                                    </div>
                                    <div className="feedback-text">
                                        <h3>How was our assistance?</h3>
                                        <p>Your feedback helps us improve our service for all students.</p>
                                        <div className="rating-stars">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button key={star} onClick={() => handleRateTicket(star)} className="star-btn">
                                                    <Star size={24} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </aside>
                </div>
            </div>
        );
    };

    return (
        <div className="track-ticket-page container">
            {ticketId ? renderDetailDashboard() : renderSearchLanding()}
        </div>
    );
};

export default TrackTicket;
