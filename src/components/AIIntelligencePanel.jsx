import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Sparkles, Brain, MessageSquare, TrendingUp, Lightbulb, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import Card from './common/Card';
import Button from './common/Button';
import {
    summarizeTicketThread,
    suggestResponseFromHistory,
    analyzeTone,
    extractActionItems
} from '../lib/ai';
import './AIIntelligencePanel.css';

const AIIntelligencePanel = ({ ticket, messages, allTickets }) => {
    const { showSuccess, showError, showWarning } = useToast();
    const [activeFeature, setActiveFeature] = useState(null);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [suggestions, setSuggestions] = useState(null);
    const [toneAnalysis, setToneAnalysis] = useState(null);
    const [actionItems, setActionItems] = useState(null);
    const [draftMessage, setDraftMessage] = useState('');

    const handleSummarize = async () => {
        setLoading(true);
        setActiveFeature('summary');
        try {
            const result = await summarizeTicketThread(ticket, messages);
            setSummary(result);
        } catch (error) {
            console.error('Summarization failed:', error);
            showError('Failed to generate summary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGetSuggestions = async () => {
        setLoading(true);
        setActiveFeature('suggestions');
        try {
            const result = await suggestResponseFromHistory(ticket, allTickets, messages);
            setSuggestions(result);
        } catch (error) {
            console.error('Suggestions failed:', error);
            showError('Failed to get suggestions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeTone = async () => {
        if (!draftMessage.trim()) {
            showWarning('Please enter a message to analyze');
            return;
        }
        setLoading(true);
        setActiveFeature('tone');
        try {
            const result = await analyzeTone(draftMessage);
            setToneAnalysis(result);
        } catch (error) {
            console.error('Tone analysis failed:', error);
            showError('Failed to analyze tone. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExtractActions = async () => {
        setLoading(true);
        setActiveFeature('actions');
        try {
            const result = await extractActionItems(messages);
            setActionItems(result);
        } catch (error) {
            console.error('Action extraction failed:', error);
            showError('Failed to extract action items. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="ai-intelligence-panel">
            <div className="ai-panel-header">
                <div className="header-title">
                    <Brain size={24} color="#8b5cf6" />
                    <h3>AI Intelligence Assistant</h3>
                </div>
                <div className="ai-badge">
                    <Sparkles size={14} />
                    Powered by Gemini
                </div>
            </div>

            <div className="ai-features-grid">
                <button
                    className="ai-feature-card"
                    onClick={handleSummarize}
                    disabled={loading || messages.length === 0}
                >
                    <div className="feature-icon purple">
                        <MessageSquare size={20} />
                    </div>
                    <div className="feature-content">
                        <h4>Smart Summary</h4>
                        <p>Get an executive summary of this ticket</p>
                    </div>
                </button>

                <button
                    className="ai-feature-card"
                    onClick={handleGetSuggestions}
                    disabled={loading}
                >
                    <div className="feature-icon blue">
                        <Lightbulb size={20} />
                    </div>
                    <div className="feature-content">
                        <h4>Response Suggestions</h4>
                        <p>AI-powered replies based on history</p>
                    </div>
                </button>

                <button
                    className="ai-feature-card"
                    onClick={handleExtractActions}
                    disabled={loading || messages.length === 0}
                >
                    <div className="feature-icon green">
                        <CheckCircle size={20} />
                    </div>
                    <div className="feature-content">
                        <h4>Action Items</h4>
                        <p>Extract tasks from conversation</p>
                    </div>
                </button>

                <div className="ai-feature-card tone-analyzer">
                    <div className="feature-icon orange">
                        <Zap size={20} />
                    </div>
                    <div className="feature-content">
                        <h4>Tone Analyzer</h4>
                        <textarea
                            placeholder="Type your message to analyze tone..."
                            value={draftMessage}
                            onChange={(e) => setDraftMessage(e.target.value)}
                            rows={3}
                        />
                        <Button
                            size="sm"
                            onClick={handleAnalyzeTone}
                            disabled={loading || !draftMessage.trim()}
                        >
                            Analyze Tone
                        </Button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="ai-loading">
                    <div className="loading-spinner"></div>
                    <p>AI is thinking...</p>
                </div>
            )}

            {/* Summary Results */}
            {activeFeature === 'summary' && summary && (
                <div className="ai-results summary-results">
                    <div className="results-header">
                        <MessageSquare size={20} />
                        <h4>Ticket Summary</h4>
                    </div>

                    <div className="summary-content">
                        <div className="summary-section">
                            <label>Executive Summary</label>
                            <p>{summary.executiveSummary}</p>
                        </div>

                        <div className="summary-section">
                            <label>Key Points</label>
                            <ul>
                                {summary.keyPoints?.map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="summary-grid">
                            <div className="summary-metric">
                                <label>Current Status</label>
                                <p>{summary.currentStatus}</p>
                            </div>
                            <div className="summary-metric">
                                <label>Sentiment</label>
                                <p>{summary.sentiment}</p>
                            </div>
                            <div className="summary-metric">
                                <label>Urgency</label>
                                <span className={`urgency-badge urgency-${summary.urgencyLevel?.toLowerCase()}`}>
                                    {summary.urgencyLevel}
                                </span>
                            </div>
                        </div>

                        <div className="summary-section">
                            <label>Suggested Next Steps</label>
                            <ul className="next-steps">
                                {summary.suggestedNextSteps?.map((step, i) => (
                                    <li key={i}>
                                        <CheckCircle size={16} />
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Response Suggestions */}
            {activeFeature === 'suggestions' && suggestions && (
                <div className="ai-results suggestions-results">
                    <div className="results-header">
                        <Lightbulb size={20} />
                        <h4>AI-Powered Responses</h4>
                    </div>

                    {suggestions.suggestions?.map((sug, i) => (
                        <div key={i} className="suggestion-card">
                            <div className="suggestion-header">
                                <span className="confidence-badge">
                                    {Math.round(sug.confidence * 100)}% match
                                </span>
                                <span className="tone-tag">{sug.tone}</span>
                            </div>
                            <p className="suggestion-text">{sug.responseText}</p>
                            <p className="suggestion-reasoning">{sug.reasoning}</p>
                            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(sug.responseText)}>
                                Copy Response
                            </Button>
                        </div>
                    ))}

                    {suggestions.relatedKnowledge && suggestions.relatedKnowledge.length > 0 && (
                        <div className="related-knowledge">
                            <h5>Related Tips</h5>
                            <ul>
                                {suggestions.relatedKnowledge.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Tone Analysis */}
            {activeFeature === 'tone' && toneAnalysis && (
                <div className="ai-results tone-results">
                    <div className="results-header">
                        <Zap size={20} />
                        <h4>Tone Analysis</h4>
                    </div>

                    <div className="tone-metrics">
                        <div className="tone-score">
                            <span className="score-label">Tone Score</span>
                            <span className="score-value">{toneAnalysis.toneScore}/10</span>
                        </div>
                        <div className="tone-type">
                            <span className="tone-label">Current Tone</span>
                            <span className={`tone-badge tone-${toneAnalysis.currentTone?.toLowerCase()}`}>
                                {toneAnalysis.currentTone}
                            </span>
                        </div>
                        <div className="tone-status">
                            {toneAnalysis.isAppropriate ? (
                                <span className="status-good">
                                    <CheckCircle size={16} />
                                    Appropriate
                                </span>
                            ) : (
                                <span className="status-warning">
                                    <AlertTriangle size={16} />
                                    Needs Review
                                </span>
                            )}
                        </div>
                    </div>

                    {toneAnalysis.suggestions && toneAnalysis.suggestions.length > 0 && (
                        <div className="tone-suggestions">
                            <label>Suggestions for Improvement</label>
                            <ul>
                                {toneAnalysis.suggestions.map((sug, i) => (
                                    <li key={i}>{sug}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {toneAnalysis.improvedVersion && (
                        <div className="improved-version">
                            <label>Improved Version</label>
                            <p>{toneAnalysis.improvedVersion}</p>
                            <Button size="sm" onClick={() => setDraftMessage(toneAnalysis.improvedVersion)}>
                                Use This Version
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Action Items */}
            {activeFeature === 'actions' && actionItems && (
                <div className="ai-results actions-results">
                    <div className="results-header">
                        <CheckCircle size={20} />
                        <h4>Extracted Action Items</h4>
                    </div>

                    <div className="action-items-list">
                        {actionItems.actionItems?.map((item, i) => (
                            <div key={i} className={`action-item priority-${item.priority?.toLowerCase()}`}>
                                <div className="action-content">
                                    <CheckCircle size={18} />
                                    <span>{item.task}</span>
                                </div>
                                <div className="action-meta">
                                    <span className="assigned-to">{item.assignedTo}</span>
                                    <span className={`priority-tag priority-${item.priority?.toLowerCase()}`}>
                                        {item.priority}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default AIIntelligencePanel;
