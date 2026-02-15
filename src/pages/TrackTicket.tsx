import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTicket, useAddTicketMessage } from '../hooks/useTickets';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './TrackTicket.css';

const TrackTicket: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { showError } = useToast();
    const ticketId = searchParams.get('id') || '';
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);

    const { data: ticket, isLoading, error } = useTicket(ticketId, {
        enabled: !!ticketId,
        refetchInterval: 15000
    });

    const { mutateAsync: addMessage, isPending: sending } = useAddTicketMessage();

    const isAdmin = profile?.role === 'agent' || profile?.role === 'super_admin';

    useEffect(() => {
        if (error) {
            showError('Could not find ticket. Please check the ID.');
        }
    }, [error, showError]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.messages]);

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
        } catch (err) {
            // Error handled by hook
        }
    };

    if (isLoading) {
        return (
            <div className="track-loading">
                <Loader className="animate-spin" size={48} color="var(--primary)" />
                <p>Establishing secure connection to Service Desk...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="container track-ticket-page">
                <Card className="not-found-card fade-in">
                    <Search size={64} color="var(--text-muted)" />
                    <h2>Ticket Record Not Found</h2>
                    <p>Encryption mismatch or invalid ID: <strong>{ticketId}</strong></p>
                    <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container track-ticket-page fade-in">
            {/* 1. Global Page Header */}
            <header className="page-header">
                <Button variant="ghost" onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={18} /> Dashboard
                </Button>
                <div className="ticket-header-info">
                    <div className="header-status-row">
                        <h1>{ticket.subject}</h1>
                        <span className="ticket-id">#{String(ticket.id).substring(0, 8)}</span>
                    </div>
                    <div className="ticket-meta">
                        <span className={`status-badge status-${(ticket.status || '').toLowerCase().replace(' ', '-')}`}>
                            {ticket.status}
                        </span>
                        <span className={`priority-badge priority-${(ticket.priority || 'medium').toLowerCase()}`}>
                            {ticket.priority} Priority
                        </span>
                    </div>
                </div>
            </header>

            <div className="track-grid">
                {/* 2. Central Service Hub (Middle Pane) */}
                <main className="chat-container">
                    <Card className="chat-card">
                        <div className="chat-history">
                            <div className="message-item system-message">
                                <div className="message-header">
                                    <Clock size={12} />
                                    <span>Ticket Opened</span>
                                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                                </div>
                                <div className="message-content">
                                    <p>Initial System Entry: {ticket.description}</p>
                                </div>
                            </div>

                            {ticket.messages?.map((msg: any, idx: number) => (
                                <div
                                    key={idx}
                                    className={`message-item ${msg.sender_email === user?.email ? 'sent' : 'received'} ${msg.is_internal ? 'internal' : ''}`}
                                >
                                    <div className="message-header">
                                        <div className="sender-chip">
                                            {msg.is_internal ? <Shield size={12} /> : <User size={12} />}
                                            <span className="sender">{msg.sender_name || msg.sender_email}</span>
                                        </div>
                                        <span className="time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="message-content">
                                        <p>{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {ticket.status !== 'Resolved' && (
                            <form onSubmit={handleSendMessage} className="message-input-form">
                                {isAdmin && (
                                    <div className="internal-toggle">
                                        <input
                                            type="checkbox"
                                            id="internal-note"
                                            checked={isInternal}
                                            onChange={(e) => setIsInternal(e.target.checked)}
                                        />
                                        <label htmlFor="internal-note">
                                            <Shield size={14} /> Add as Private Internal Note
                                        </label>
                                    </div>
                                )}
                                <div className="input-wrapper">
                                    <textarea
                                        placeholder="Communicate with the service team..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={3}
                                    ></textarea>
                                    <Button
                                        type="submit"
                                        disabled={sending || !message.trim()}
                                        className="send-btn"
                                    >
                                        {sending ? <Loader size={18} className="animate-spin" /> : <><Send size={18} /> Send Update</>}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                </main>

                {/* 3. Intelligence Sidebar (Right Pane) */}
                <aside className="ticket-sidebar">
                    <Card className="sidebar-card">
                        <h3><Info size={18} /> Ticket Intelligence</h3>

                        <div className="ai-highlight">
                            <div className="ai-header">
                                <Zap size={14} /> AI Context Analysis
                            </div>
                            <div className="ai-content">
                                {ticket.priority === 'Urgent'
                                    ? "Critical impact detected. High response priority initiated."
                                    : "Standard context established. Awaiting further communication."
                                }
                            </div>
                        </div>

                        <div className="detail-item">
                            <span className="label"><Tag size={12} /> Category</span>
                            <span className="value">{ticket.type}</span>
                        </div>

                        <div className="detail-item">
                            <span className="label"><User size={12} /> Requester</span>
                            <span className="value">{ticket.full_name}</span>
                        </div>

                        <div className="detail-item">
                            <span className="label"><Mail size={12} /> Assigned Agent</span>
                            <span className="value">{ticket.assigned_to_email || 'Awaiting Routing'}</span>
                        </div>

                        <div className="detail-item">
                            <span className="label"><Calendar size={12} /> Timeline</span>
                            <span className="value">Submitted {new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                    </Card>

                    {ticket.status === 'Resolved' && (
                        <Card className="sidebar-card resolved-card">
                            <h3><CheckCircle size={18} color="var(--success)" /> Case Closed</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                This matter was formally resolved on {new Date(ticket.resolved_at || '').toLocaleDateString()}.
                            </p>
                            <Button variant="outline" size="sm" onClick={() => navigate('/submit-ticket')} className="w-full">
                                Request Further Action <ArrowRight size={14} />
                            </Button>
                        </Card>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default TrackTicket;
