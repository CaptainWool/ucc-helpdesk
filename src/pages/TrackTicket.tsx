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
    Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTicket, useAddTicketMessage } from '../hooks/useTickets';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LiveChat from '../components/common/LiveChat';
import './TrackTicket.css';

const TrackTicket: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { showError } = useToast();
    const ticketId = searchParams.get('id') || '';

    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [showLiveChat, setShowLiveChat] = useState(false);

    const isUrgent = ticket?.priority === 'Urgent';
    const displayUser = profile || user;

    const { data: ticket, isLoading, error } = useTicket(ticketId, {
        enabled: !!ticketId,
        refetchInterval: isUrgent ? 5000 : 15000 // Faster refresh for urgent tickets
    });

    const { mutateAsync: addMessage, isPending: sending } = useAddTicketMessage();

    useEffect(() => {
        if (error) {
            showError('Could not find ticket. Please check the ID.');
        }
    }, [error, showError]);

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

    if (isLoading) {
        return (
            <div className="track-loading">
                <Loader className="animate-spin" size={40} />
                <p>Retrieving ticket information...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="container track-ticket-page">
                <Card className="not-found-card">
                    <Search size={48} />
                    <h2>Ticket Not Found</h2>
                    <p>We couldn't find a ticket with ID: <strong>{ticketId}</strong></p>
                    <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container track-ticket-page fade-in">
            <header className="page-header">
                <Button variant="ghost" onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={20} /> Dashboard
                </Button>
                <div className="ticket-header-info">
                    <span className="ticket-id">Ticket #{String(ticket.id).substring(0, 8)}</span>
                    <h1>{ticket.subject}</h1>
                    <div className="ticket-meta">
                        <span className={`status-badge status-${(ticket.status || '').toLowerCase().replace(' ', '-')}`}>
                            {ticket.status}
                        </span>
                        <span className={`priority-badge priority-${(ticket.priority || 'medium').toLowerCase()}`}>
                            {ticket.priority} Priority
                        </span>
                        <span className="date-badge">
                            Submitted on {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </header>

            {/* Live Chat Banner for Urgent Tickets */}
            {isUrgent && (
                <div className="live-chat-banner">
                    <div className="banner-content">
                        <div className="banner-icon">
                            <MessageCircle size={24} className="pulsing-icon" />
                        </div>
                        <div className="banner-text">
                            <h4>⚡ Urgent Ticket Detected</h4>
                            <p>Get instant help with live chat. Connect with an agent in real-time!</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowLiveChat(!showLiveChat)}
                        className="toggle-live-chat-btn"
                    >
                        {showLiveChat ? 'Hide Live Chat' : 'Start Live Chat'}
                    </Button>
                </div>
            )}

            <div className="track-grid">
                <div className="chat-container">
                    {isUrgent && showLiveChat ? (
                        <LiveChat ticket={ticket} />
                    ) : (
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
                    )}
                </div>

                <aside className="ticket-sidebar">
                    <Card className="sidebar-card">
                        <h3>Ticket Details</h3>
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
