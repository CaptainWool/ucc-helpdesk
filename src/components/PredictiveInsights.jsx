import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Zap, AlertTriangle, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import Card from './common/Card';
import { generatePredictiveInsights } from '../lib/ai';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import './PredictiveInsights.css';

const PredictiveInsights = () => {
    const { showSuccess, showError } = useToast();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recentTickets, setRecentTickets] = useState([]);

    useEffect(() => {
        fetchRecentTickets();
    }, []);

    const fetchRecentTickets = async () => {
        try {
            const tickets = await api.tickets.list();
            // Get last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recent = tickets.filter(t => new Date(t.created_at) >= sevenDaysAgo);
            setRecentTickets(recent);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        }
    };

    const handleGenerateInsights = async () => {
        setLoading(true);
        try {
            const result = await generatePredictiveInsights(recentTickets);
            setInsights(result);
        } catch (error) {
            console.error('Failed to generate insights:', error);
            showError('Failed to generate insights. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="predictive-insights-container">
            <Card className="insights-header-card">
                <div className="insights-hero">
                    <div className="hero-icon">
                        <Brain size={32} />
                    </div>
                    <div className="hero-content">
                        <h2>Predictive Analytics Dashboard</h2>
                        <p>AI-powered insights to prevent issues before they're reported</p>
                    </div>
                    <button
                        className="generate-insights-btn"
                        onClick={handleGenerateInsights}
                        disabled={loading || recentTickets.length === 0}
                    >
                        {loading ? (
                            <>
                                <div className="btn-spinner"></div>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate Insights
                            </>
                        )}
                    </button>
                </div>

                {recentTickets.length > 0 && (
                    <div className="insights-stats">
                        <div className="stat-item">
                            <span className="stat-label">Tickets (7 days)</span>
                            <span className="stat-value">{recentTickets.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Open</span>
                            <span className="stat-value">
                                {recentTickets.filter(t => t.status === 'Open').length}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">In Progress</span>
                            <span className="stat-value">
                                {recentTickets.filter(t => t.status === 'In Progress').length}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Resolved</span>
                            <span className="stat-value">
                                {recentTickets.filter(t => t.status === 'Resolved').length}
                            </span>
                        </div>
                    </div>
                )}
            </Card>

            {insights && (
                <>
                    {/* Predictions */}
                    {insights.predictions && insights.predictions.length > 0 && (
                        <Card className="predictions-card">
                            <div className="card-header-row">
                                <div className="header-icon-group">
                                    <Zap size={24} color="#f59e0b" />
                                    <h3>Predicted Issues</h3>
                                </div>
                                <span className="predictions-count">{insights.predictions.length} predictions</span>
                            </div>

                            <div className="predictions-grid">
                                {insights.predictions.map((pred, i) => (
                                    <div key={i} className={`prediction-card priority-${getPriorityLevel(pred.probability)}`}>
                                        <div className="prediction-header">
                                            <span className="probability-badge">
                                                {Math.round(pred.probability * 100)}%
                                            </span>
                                            <span className="category-tag">{pred.category}</span>
                                        </div>
                                        <h4>{pred.issue}</h4>
                                        <div className="prediction-action">
                                            <label>Recommended Action</label>
                                            <p>{pred.recommendedAction}</p>
                                        </div>
                                        {pred.proactiveMessage && (
                                            <div className="proactive-message">
                                                <label>Suggested Proactive Message</label>
                                                <p>{pred.proactiveMessage}</p>
                                                <button className="copy-msg-btn">
                                                    Copy Message
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Trends */}
                    {insights.trends && insights.trends.length > 0 && (
                        <Card className="trends-card">
                            <div className="card-header-row">
                                <div className="header-icon-group">
                                    <TrendingUp size={24} color="#10b981" />
                                    <h3>Detected Trends</h3>
                                </div>
                            </div>

                            <div className="trends-list">
                                {insights.trends.map((trend, i) => (
                                    <div key={i} className={`trend-item impact-${trend.impact?.toLowerCase()}`}>
                                        <div className="trend-icon">
                                            {trend.impact === 'High' ? (
                                                <ArrowUp size={20} />
                                            ) : trend.impact === 'Low' ? (
                                                <ArrowDown size={20} />
                                            ) : (
                                                <TrendingUp size={20} />
                                            )}
                                        </div>
                                        <div className="trend-content">
                                            <div className="trend-header">
                                                <h5>{trend.pattern}</h5>
                                                <span className={`impact-badge impact-${trend.impact?.toLowerCase()}`}>
                                                    {trend.impact} Impact
                                                </span>
                                            </div>
                                            <p className="trend-recommendation">{trend.recommendation}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Alerts */}
                    {insights.alerts && insights.alerts.length > 0 && (
                        <Card className="alerts-card">
                            <div className="card-header-row">
                                <div className="header-icon-group">
                                    <AlertTriangle size={24} color="#ef4444" />
                                    <h3>Critical Alerts</h3>
                                </div>
                            </div>

                            <div className="alerts-list">
                                {insights.alerts.map((alert, i) => (
                                    <div key={i} className="alert-item">
                                        <AlertTriangle size={20} />
                                        <span>{alert}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </>
            )}

            {!insights && !loading && (
                <Card className="empty-state-card">
                    <Brain size={64} color="#cbd5e1" />
                    <h3>Generate Predictive Insights</h3>
                    <p>Click the button above to analyze recent ticket patterns and get AI-powered predictions</p>
                </Card>
            )}
        </div>
    );
};

const getPriorityLevel = (probability) => {
    if (probability >= 0.8) return 'critical';
    if (probability >= 0.6) return 'high';
    if (probability >= 0.4) return 'medium';
    return 'low';
};

export default PredictiveInsights;
