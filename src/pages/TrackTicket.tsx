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
    ArrowRight,
    ArrowLeft,
    FileText,
    MessageCircle,
    Download,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTicket, useAddTicketMessage } from '../hooks/useTickets';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
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
            setSearchParams({}); // Clear ID to return to search state
        }
    }, [error, ticketId, setSearchParams, showError]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.messages]);

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
            // Error handled by hook
        }
    };

    // View Components
    const renderSearchLanding = () => (
        <main className="search-landing">
            <h1>Track Your Submission</h1>
            <p>Enter your unique Tracking ID to monitor progress, communicate with agents, and access resolution details.</p>

            <form onSubmit={handleSearch} className="search-form-container">
                <div className="search-input-group">
                    <Search size={24} color="var(--primary)" style={{ marginLeft: '1rem' }} />
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

            <div style={{ marginTop: '4rem', display: 'flex', gap: '2rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} /> Secure Encryption
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} /> Real-time Updates
                </div>
            </div>
        </main>
    );

    const renderDetailDashboard = () => {
        if (isLoading) {
            return (
                <div className="track-loading" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader className="animate-spin" size={64} color="var(--primary)" />
                    <p style={{ marginTop: '1.5rem', fontWeight: 600 }}>Syncing with Service Desk...</p>
                </div>
            );
        }

        if (!ticket) return null;

        return (
            <div className="detail-dashboard">
                <header className="page-header">
                    <div className="back-link" onClick={() => setSearchParams({})}>
                        <ArrowLeft size={16} /> Search Another Ticket
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <span className={`badge-service status-${(ticket.status || '').toLowerCase().replace(' ', '-')}`}>
                                    {ticket.status}
                                </span>
                                <span className="ticket-id">Track ID: #{String(ticket.id).substring(0, 8)}</span>
                            </div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.04em' }}>
                                {ticket.subject}
                            </h1>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Button variant="outline" size="sm" style={{ borderRadius: '1rem' }} onClick={() => window.print()}>
                                <Download size={16} /> Export PDF
                            </Button>
                            <Button variant="primary" size="sm" style={{ borderRadius: '1rem' }} onClick={() => navigate('/submit-ticket')}>
                                New Ticket
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="track-grid">
                    {/* Communication Hub */}
                    <div className="service-hub">
                        <Card className="hub-card">
                            <div className="chat-scroller">
                                <div className="msg-bubble msg-system">
                                    <div className="msg-header">
                                        <Zap size={14} /> SYSTEM INITIALIZED
                                    </div>
                                    <div className="msg-text">
                                        Originating concern: {ticket.description}
                                    </div>
                                </div>

                                {ticket.messages?.map((msg: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`msg-bubble ${msg.sender_email === user?.email ? 'msg-sent' : 'msg-received'} ${msg.is_internal ? 'msg-internal' : ''}`}
                                    >
                                        <div className="msg-header">
                                            {msg.is_internal ? <Shield size={12} /> : <User size={12} />}
                                            <span>{msg.sender_name || msg.sender_email}</span>
                                            <span style={{ opacity: 0.5, fontWeight: 400 }}>•</span>
                                            <span style={{ fontWeight: 500 }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="msg-text">
                                            {msg.message}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {ticket.status !== 'Resolved' && (
                                <form onSubmit={handleSendMessage} className="input-dock">
                                    {isAdmin && (
                                        <div className="internal-flag">
                                            <input
                                                type="checkbox"
                                                id="int-note"
                                                checked={isInternal}
                                                onChange={(e) => setIsInternal(e.target.checked)}
                                            />
                                            <label htmlFor="int-note" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Shield size={14} /> Add as Secure Internal Note
                                            </label>
                                        </div>
                                    )}
                                    <div className="dock-wrapper">
                                        <textarea
                                            placeholder="Transmit update to agents..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={2}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <Info size={14} /> Updates are instantaneous
                                            </div>
                                            <Button type="submit" disabled={sending || !message.trim()} className="send-btn">
                                                {sending ? <Loader className="animate-spin" size={18} /> : <><Send size={18} /> Transmit Update</>}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </Card>
                    </div>

                    {/* Intelligence Sidebar */}
                    <aside className="intel-sidebar">
                        <Card className="intel-card">
                            <h3><Zap size={20} color="var(--primary)" /> Context Intel</h3>

                            <div className="meta-item">
                                <span className="meta-label">Classification</span>
                                <span className="meta-value">{ticket.type}</span>
                            </div>

                            <div className="meta-item">
                                <span className="meta-label">Requester</span>
                                <span className="meta-value">{ticket.full_name}</span>
                            </div>

                            <div className="meta-item">
                                <span className="meta-label">Assignment</span>
                                <span className="meta-value">{ticket.assigned_to_email || 'Awaiting Router'}</span>
                            </div>

                            <div className="meta-item">
                                <span className="meta-label">Priority Level</span>
                                <span className="meta-value" style={{
                                    color: (ticket.priority || '').toLowerCase() === 'urgent' ? '#dc2626' : 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {ticket.priority} {(ticket.priority || '').toLowerCase() === 'urgent' && <AlertCircle size={14} />}
                                </span>
                            </div>
                        </Card>

                        <Card className="intel-card" style={{ background: 'var(--primary-dark)', color: 'white' }}>
                            <h3 style={{ color: 'white' }}><MessageCircle size={20} /> Quick Actions</h3>
                            <div className="action-grid">
                                <Button variant="ghost" className="action-btn">
                                    <FileText size={16} /> Knowledge Base
                                </Button>
                                <Button variant="ghost" className="action-btn">
                                    <Mail size={16} /> Email Transcript
                                </Button>
                                <Button variant="ghost" className="action-btn" onClick={() => window.print()}>
                                    <Download size={16} /> Print Case
                                </Button>
                            </div>
                        </Card>
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
