import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Loader, AlertCircle, CheckCircle, Clock, Star } from 'lucide-react';
import { api } from '../lib/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import TicketChat from '../components/TicketChat';
import { requestNotificationPermission, sendNotification } from '../lib/notifications';
import './TrackTicket.css';

const TrackTicket = () => {
    const [searchParams] = useSearchParams();
    const [ticketId, setTicketId] = useState(searchParams.get('id') || '');
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Trigger search if ID is in URL
    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (idFromUrl) {
            performSearch(idFromUrl);
        }
    }, []);

    const performSearch = async (id) => {
        setLoading(true);
        setError('');
        try {
            const data = await api.tickets.get(id.trim());
            setTicket(data);
            if (data.rating) {
                setRating(data.rating);
                setFeedback(data.feedback_comment || '');
                setFeedbackSubmitted(true);
            }
        } catch (err) {
            console.error('Error fetching ticket:', err);
            setError(err.error || 'An error occurred while searching for the ticket.');
        } finally {
            setLoading(false);
        }
    };

    // Feedback State
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    // Request notification permission on mount
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    // Polling for ticket status changes (v2 replacement for realtime)
    useEffect(() => {
        if (!ticket) return;

        const pollInterval = setInterval(async () => {
            try {
                const refreshedTicket = await api.tickets.get(ticket.id);
                if (refreshedTicket.status !== ticket.status) {
                    setTicket(refreshedTicket);

                    if (document.hidden) {
                        sendNotification('Ticket Status Updated', {
                            body: `Your ticket status has changed to: ${refreshedTicket.status}`,
                            tag: `status-${ticket.id}`
                        });
                    }
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 15000); // Poll every 15s

        return () => {
            clearInterval(pollInterval);
        };
    }, [ticket?.id, ticket?.status]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!ticketId.trim()) return;

        // Only reset if it's a new ID to avoid flicker
        if (ticket?.id !== ticketId.trim()) {
            setTicket(null);
            setFeedbackSubmitted(false);
            setRating(0);
            setFeedback('');
        }

        performSearch(ticketId);
    };

    const handleSubmitFeedback = async () => {
        if (rating === 0) {
            alert("Please select a star rating.");
            return;
        }
        setSubmittingFeedback(true);
        try {
            await api.tickets.update(ticket.id, {
                rating: rating,
                feedback_comment: feedback
            });
            setFeedbackSubmitted(true);
        } catch (error) {
            console.error("Error submitting feedback:", error);
            alert("Failed to submit feedback.");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    return (
        <div className="container track-container">
            <div className="track-header">
                <h1>Track Your Ticket</h1>
                <p>Ensure you are logged in to track tickets you have submitted.</p>
            </div>

            <div className="track-content">
                <Card className="search-card">
                    <form onSubmit={handleSearch} className="track-form">
                        <Input
                            id="ticketId"
                            label="Enter Ticket ID"
                            placeholder="e.g. 550e8400-e29b..."
                            value={ticketId}
                            onChange={(e) => setTicketId(e.target.value)}
                            required
                        />
                        <Button type="submit" disabled={loading} className="track-btn">
                            {loading ? <Loader className="animate-spin" size={20} /> : 'Track My Ticket'}
                        </Button>
                    </form>
                </Card>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {ticket && (
                    <>
                        <Card className="result-card fade-in">
                            <div className="result-header">
                                <div>
                                    <h2>{ticket.subject}</h2>
                                    <span className="timestamp">Submitted on {new Date(ticket.created_at).toLocaleDateString()}</span>
                                </div>
                                <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
                                    {ticket.status === 'Resolved' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                    {ticket.status}
                                </span>
                            </div>

                            <div className="result-details">
                                <div className="detail-row">
                                    <span className="label">Ticket ID:</span>
                                    <span className="value font-mono">{ticket.id}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Type:</span>
                                    <span className="value capitalize">{ticket.type}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Description:</span>
                                    <p className="description-text">{ticket.description}</p>
                                </div>
                                {ticket.attachment_url && (
                                    <div className="detail-row">
                                        <span className="label">Attachment:</span>
                                        <a href={ticket.attachment_url} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                            View Attachment
                                        </a>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {ticket.status === 'Resolved' && (
                            <Card className="feedback-card fade-in" style={{ marginTop: '1.5rem', border: '1px solid #ca8a04', background: '#fefce8' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{ color: '#854d0e', marginBottom: '1rem' }}>How was your experience?</h3>

                                    {feedbackSubmitted ? (
                                        <div className="feedback-success">
                                            <p style={{ color: '#166534', fontWeight: 'bold' }}>Thank you for your feedback!</p>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', margin: '10px 0' }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star key={star} size={24} fill={star <= rating ? "#fbbf24" : "none"} color="#fbbf24" />
                                                ))}
                                            </div>
                                            <p style={{ fontStyle: 'italic', color: '#555' }}>"{feedback}"</p>
                                        </div>
                                    ) : (
                                        <div className="feedback-form">
                                            <div className="star-rating" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '1rem', cursor: 'pointer' }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        size={32}
                                                        fill={star <= (hoverRating || rating) ? "#fbbf24" : "none"}
                                                        color={star <= (hoverRating || rating) ? "#fbbf24" : "#d1d5db"}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        onClick={() => setRating(star)}
                                                    />
                                                ))}
                                            </div>

                                            <textarea
                                                className="feedback-input"
                                                placeholder="Any comments? (Optional)"
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                            />

                                            <Button
                                                onClick={handleSubmitFeedback}
                                                disabled={rating === 0 || submittingFeedback}
                                                style={{ width: '100%' }}
                                            >
                                                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        <TicketChat ticketId={ticket.id} role="student" />
                    </>
                )}
            </div>
        </div>
    );
};

export default TrackTicket;
