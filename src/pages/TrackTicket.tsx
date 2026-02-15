import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Clock,
    CheckCircle,
    MessageCircle,
    AlertCircle,
    ChevronLeft,
    Send,
    Loader,
    Paperclip,
    User,
    Shield,
    Sparkles,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTicket, usePublicTicket, useAddTicketMessage, useUpdateTicket } from '../hooks/useTickets';
import { analyzeTicketAI, AIAnalysis } from '../lib/ai';
import { BASE_URL } from '../lib/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './TrackTicket.css';

const TrackTicket: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { showError, showSuccess } = useToast();
    const ticketId = searchParams.get('id') || '';

    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Guest Tracking Form State
    const [searchId, setSearchId] = useState(ticketId);
    const [guestEmail, setGuestEmail] = useState('');

    useEffect(() => {
        setSearchId(ticketId);
    }, [ticketId]);

    // Primary ticket fetching (for logged-in users)
    const { data: authTicket, isLoading: authLoading, error: authError } = useTicket(ticketId, {
        enabled: !!ticketId && !!user,
        refetchInterval: 15000
    });

    // Public ticket fetching (for guest users)
    const { data: publicTicket, isLoading: publicLoading, error: publicError } = usePublicTicket(ticketId, guestEmail, {
        enabled: !!ticketId && !!guestEmail && !user,
        refetchInterval: 15000
    });

    const ticket = authTicket || publicTicket;
    const isLoading = authLoading || publicLoading;
    const error = authError || publicError;

    const { mutateAsync: addMessage, isPending: sending } = useAddTicketMessage();
    const { mutateAsync: updateTicket } = useUpdateTicket();

    useEffect(() => {
        if (error && ticketId) {
            showError('Could not find ticket. Please check the ID and Email.');
        }
    }, [error, showError, ticketId]);

    const handleTrackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId.trim()) return;

        const params = new URLSearchParams();
        params.set('id', searchId.trim());
        navigate(`/track-ticket?${params.toString()}`);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !ticket) return;

        try {
            await addMessage({
                ticketId: ticket.id,
                message: message.trim(),
                isInternal: isInternal && (profile?.role === 'agent' || profile?.role === 'super_admin')
            });
            setMessage('');
        } catch (err) {
            // Error handled by hook
        }
    };

    const handlePriorityChange = async (newPriority: string) => {
        if (!ticket) return;
        try {
            await updateTicket({ id: ticket.id, updates: { priority: newPriority as any } });
            showSuccess(`Priority updated to ${newPriority}`);
        } catch (err) {
            // Error handled by hook
        }
    };

    const handleAnalyzeTicket = async () => {
        if (!ticket) return;
        setAnalyzing(true);
        try {
            const result = await analyzeTicketAI(ticket.subject, ticket.description || '');
            setAiAnalysis(result);

            if (result && result.priority) {
                const priorityMap: Record<string, string> = { 'P1': 'Urgent', 'P2': 'High', 'P3': 'Medium', 'P4': 'Low', 'Urgent': 'Urgent', 'High': 'High', 'Medium': 'Medium', 'Low': 'Low' };
                const dbPriority = priorityMap[result.priority] || result.priority;
                await handlePriorityChange(dbPriority);
            }
        } catch (error: any) {
            console.error('AI Analysis failed:', error);
            showError(`AI Analysis Error: ${error.message || "Could not complete analysis"}`);
        } finally {
            setAnalyzing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="track-loading">
                <Loader className="animate-spin" size={40} />
                <p>Retrieving ticket information...</p>
            </div>
        );
    }

    if (!ticketId) {
        return (
            <div className="container track-ticket-page">
                <Card className="track-form-card">
                    <div className="form-header">
                        <Search size={32} />
                        <h2>Track Your Ticket</h2>
                        <p>Enter your ticket ID below to see the latest status and messages.</p>
                    </div>
                    <form onSubmit={handleTrackSubmit} className="track-id-form">
                        <div className="form-group">
                            <label htmlFor="ticket-id">Ticket ID</label>
                            <input
                                id="ticket-id"
                                type="text"
                                placeholder="e.g. 123e4567-e89b-..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">Track Progress</Button>
                    </form>
                </Card>
            </div>
        );
    }

    if (!user && !guestEmail && !isLoading) {
        return (
            <div className="container track-ticket-page">
                <Card className="track-form-card">
                    <div className="form-header">
                        <Shield size={32} />
                        <h2>Verify Your Email</h2>
                        <p>To view ticket <strong>#{ticketId.substring(0, 8)}</strong>, please enter the email address used for submission.</p>
                    </div>
                    <div className="form-group">
                        <label htmlFor="guest-email">Email Address</label>
                        <input
                            id="guest-email"
                            type="email"
                            placeholder="your@email.com"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !!guestEmail && setGuestEmail(guestEmail)}
                        />
                    </div>
                    <Button onClick={() => !!guestEmail && setGuestEmail(guestEmail)} className="w-full">Verify & View Ticket</Button>
                    <Button variant="ghost" onClick={() => navigate('/track-ticket')} className="mt-2 w-full">Change Ticket ID</Button>
                </Card>
            </div>
        );
    }

    if (!ticket && !isLoading) {
        return (
            <div className="container track-ticket-page">
                <Card className="not-found-card">
                    <AlertCircle size={48} className="text-error" />
                    <h2>Ticket Not Found</h2>
                    <p>We couldn't find a ticket with ID: <strong>{ticketId}</strong> and the provided email.</p>
                    <div className="not-found-actions">
                        <Button onClick={() => { setGuestEmail(''); navigate('/track-ticket'); }}>Try Another ID</Button>
                        <Button variant="ghost" onClick={() => navigate(profile?.role === 'student' ? '/dashboard' : '/admin')}>Back to Dashboard</Button>
                    </div>
                </Card>
            </div>
        );
    }

    const displayUser = profile || user;
    const isAdmin = profile?.role === 'agent' || profile?.role === 'super_admin';

    if (!ticket) return null;

    return (
        <div className="container track-ticket-page fade-in">
            <header className="page-header">
                <Button variant="ghost" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} className="back-btn">
                    <ChevronLeft size={20} /> Dashboard
                </Button>
                <div className="ticket-header-info">
                    <span className="ticket-id">Ticket #{String(ticket.id).substring(0, 8)}</span>
                    <h1>{ticket.subject}</h1>
                    <div className="ticket-meta">
                        <span className={`status-badge status-${(ticket.status || '').toLowerCase().replace(' ', '-')}`}>
                            {ticket.status}
                        </span>
                        {isAdmin ? (
                            <div className="priority-select-wrapper">
                                <select
                                    value={ticket.priority || 'Medium'}
                                    onChange={(e) => handlePriorityChange(e.target.value)}
                                    className={`priority-badge-select priority-${(ticket.priority || 'medium').toLowerCase()}`}
                                >
                                    <option value="Urgent">Urgent</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        ) : (
                            <span className={`priority-badge priority-${(ticket.priority || 'medium').toLowerCase()}`}>
                                {ticket.priority} Priority
                            </span>
                        )}
                        <span className="date-badge">
                            Submitted on {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </header>

            <div className="track-grid">
                <div className="chat-container">
                    <Card className="chat-card">
                        <div className="chat-history">
                            <div className="message-item system-message">
                                <div className="message-header">
                                    <Clock size={14} />
                                    <span>Ticket Created</span>
                                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                                </div>
                                <div className="message-content">
                                    <p>Initial Description: {ticket.description}</p>
                                </div>
                            </div>

                            {ticket.messages?.map((msg: any, idx: number) => (
                                <div key={idx} className={`message-item ${msg.sender_email === user?.email ? 'sent' : 'received'} ${msg.is_internal ? 'internal' : ''}`}>
                                    <div className="message-header">
                                        {msg.is_internal && <Shield size={12} />}
                                        <span className="sender">{msg.sender_name || msg.sender_email}</span>
                                        <span className="time">{new Date(msg.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="message-content">
                                        <p>{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {ticket.status !== 'Resolved' && (
                            <form onSubmit={handleSendMessage} className="message-input-form">
                                {(profile?.role === 'agent' || profile?.role === 'super_admin') && (
                                    <div className="internal-toggle">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={isInternal}
                                                onChange={(e) => setIsInternal(e.target.checked)}
                                            />
                                            Internal Note (Student won't see this)
                                        </label>
                                    </div>
                                )}
                                <div className="input-wrapper">
                                    <textarea
                                        placeholder="Type your message here..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={3}
                                    ></textarea>
                                    <div className="input-actions">
                                        <Button
                                            type="submit"
                                            disabled={sending || !message.trim()}
                                            className="send-btn"
                                        >
                                            {sending ? <Loader size={16} /> : <><Send size={16} /> Send</>}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </Card>
                </div>

                <aside className="ticket-sidebar">
                    <Card className="sidebar-card">
                        <h3>Ticket Details</h3>
                        {isAdmin && (
                            <div className="ai-analysis-container mb-6">
                                {analyzing ? (
                                    <div className="ai-loading">
                                        <Sparkles className="animate-spin text-primary" size={16} />
                                        <span>AI is analyzing...</span>
                                    </div>
                                ) : aiAnalysis ? (
                                    <div className="ai-insight-box">
                                        <div className="insight-header">
                                            <Sparkles size={14} className="text-secondary" />
                                            <span>AI Insights</span>
                                        </div>
                                        <div className="insight-grid">
                                            <div className="insight-stat">
                                                <label>Sentiment</label>
                                                <span>{aiAnalysis.sentiment}</span>
                                            </div>
                                            <div className="insight-stat">
                                                <label>AI Priority</label>
                                                <span>{aiAnalysis.priority}</span>
                                            </div>
                                        </div>
                                        <p className="insight-summary">"{aiAnalysis.summary}"</p>
                                    </div>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full ai-analyze-btn"
                                        onClick={handleAnalyzeTicket}
                                    >
                                        <Sparkles size={14} /> Analyze with AI
                                    </Button>
                                )}
                            </div>
                        )}
                        <div className="detail-item">
                            <span className="label">Category</span>
                            <span className="value">{ticket.type}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Student</span>
                            <span className="value">{ticket.full_name}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Assigned Agent</span>
                            <span className="value">{ticket.assigned_to_email || 'Unassigned'}</span>
                        </div>
                        {ticket.attachment_url && (
                            <div className="detail-item attachments mt-4 pt-4 border-t">
                                <span className="label block mb-2"><Paperclip size={14} className="inline mr-1" /> Attachments</span>
                                <div className="attachment-links flex flex-col gap-1">
                                    {(() => {
                                        let urls: string[] = [];
                                        try {
                                            const parsed = JSON.parse(ticket.attachment_url);
                                            urls = Array.isArray(parsed) ? parsed : [ticket.attachment_url];
                                        } catch (e) {
                                            urls = [ticket.attachment_url];
                                        }
                                        return urls.map((url, idx) => (
                                            <a
                                                key={idx}
                                                href={url.startsWith('http') ? url : `${BASE_URL}${url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline text-xs"
                                            >
                                                View Attachment {urls.length > 1 ? idx + 1 : ''}
                                            </a>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </Card>

                    {ticket.status === 'Resolved' && (
                        <Card className="resolved-card">
                            <CheckCircle size={32} color="var(--success)" />
                            <h3>This issue is resolved</h3>
                            <p>This ticket was closed on {new Date(ticket.resolved_at || '').toLocaleDateString()}.</p>
                            <Button variant="outline" size="sm" onClick={() => navigate('/submit-ticket')}>
                                Still have questions?
                            </Button>
                        </Card>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default TrackTicket;
