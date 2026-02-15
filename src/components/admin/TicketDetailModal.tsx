import React from 'react';
import { Download, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import TicketChat from '../TicketChat';
import { BASE_URL } from '../../lib/api';
import { Ticket } from '../../types';

interface AiAnalysis {
    sentiment: string;
    priority: string;
    summary: string;
}

interface TicketDetailModalProps {
    ticket: Ticket | null;
    onClose: () => void;
    onPriorityChange: (id: string, priority: string) => void;
    aiAnalysis: AiAnalysis | null;
    analyzing: boolean;
    onAnalyze: () => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
    ticket,
    onClose,
    onPriorityChange,
    aiAnalysis,
    analyzing,
    onAnalyze
}) => {
    if (!ticket) return null;

    const renderAiAnalysis = () => {
        if (analyzing) return <p className="text-sm text-gray-500" style={{ marginTop: '1rem' }}>Thinking... <Sparkles size={12} className="inline-spin" /></p>;
        if (aiAnalysis) {
            return (
                <div className="ai-analysis-box" style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={14} /> AI Insights</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div><strong>Sentiment:</strong> {aiAnalysis.sentiment}</div>
                        <div><strong>Priority:</strong> {aiAnalysis.priority}</div>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#15803d', fontStyle: 'italic' }}>"{aiAnalysis.summary}"</p>
                </div>
            );
        }
        return (
            <Button size="sm" variant="secondary" onClick={onAnalyze} style={{ marginTop: '1rem' }}>
                <Sparkles size={14} style={{ marginRight: '0.5rem' }} /> AI Analysis & Priority
            </Button>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-badge">#{ticket.student_id ? ticket.student_id.toString().slice(-4) : '---'}</div>
                    <h2>{ticket.subject}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="ticket-meta-grid">
                        <div className="meta-card">
                            <label>Status</label>
                            <span className={`status-pill ${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                        </div>
                        <div className="meta-card">
                            <label>Priority</label>
                            <select
                                value={ticket.priority || 'Medium'}
                                onChange={(e) => onPriorityChange(ticket.id, e.target.value)}
                                className="modal-priority-select"
                            >
                                <option value="Urgent">Urgent</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div className="meta-card">
                            <label>Student</label>
                            <span className="meta-value">{ticket.full_name}</span>
                        </div>
                        <div className="meta-card">
                            <label>Category</label>
                            <span className="meta-value text-capitalize">{ticket.type || 'General'}</span>
                        </div>
                    </div>

                    <div className="ticket-description">
                        <h3>Full Description</h3>
                        <div className="description-text">{ticket.description}</div>
                    </div>

                    {renderAiAnalysis()}

                    {ticket.attachment_url && (
                        <div className="attachment-section">
                            <h3>Attached Evidence</h3>
                            <div className="attachment-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(() => {
                                    let urls: string[] = [];
                                    try {
                                        // Try parsing as JSON array (for multiple attachments)
                                        const parsed = JSON.parse(ticket.attachment_url);
                                        urls = Array.isArray(parsed) ? parsed : [ticket.attachment_url];
                                    } catch (e) {
                                        // Legacy: single URL string
                                        urls = [ticket.attachment_url];
                                    }

                                    return urls.map((url, idx) => (
                                        <a
                                            key={idx}
                                            href={url.startsWith('http') ? url : `${BASE_URL}${url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="attachment-link"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.4rem', border: '1px solid #e2e8f0', color: '#2563eb', fontSize: '0.9rem', textDecoration: 'none' }}
                                        >
                                            <Download size={14} /> Attachment {urls.length > 1 ? idx + 1 : ''}
                                        </a>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}

                    <div className="modal-chat-section">
                        <TicketChat ticketId={ticket.id} role="admin" ticketData={ticket} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetailModal;
