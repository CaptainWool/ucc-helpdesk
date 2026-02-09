import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, Activity, Info } from 'lucide-react';
import { checkAccessibility, detectDarkPatterns, calculateHealthScore } from '../lib/compliance';
import Card from './common/Card';
import './ComplianceOverview.css';

const ComplianceOverview = ({ tickets = [] }) => {
    const [score, setScore] = useState(100);
    const [issues, setIssues] = useState([]);
    const [darkPatternsFound, setDarkPatternsFound] = useState([]);

    useEffect(() => {
        // Perform a quick sweep of the current page and recent tickets
        const pageIssues = checkAccessibility(document.body);

        let foundPatterns = [];
        tickets.slice(0, 50).forEach(ticket => {
            const p = detectDarkPatterns(ticket.description || '');
            if (p.length > 0) {
                foundPatterns.push({ ticketId: ticket.id, patterns: p });
            }
        });

        const allIssues = [...pageIssues];
        setIssues(pageIssues);
        setDarkPatternsFound(foundPatterns);
        setScore(calculateHealthScore(allIssues));
    }, [tickets]);

    const getScoreColor = (s) => {
        if (s >= 90) return 'text-green-500';
        if (s >= 70) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="compliance-overview fade-in">
            <div className="summary-cards">
                <Card className="score-card">
                    <div className="card-header">
                        <Shield className="text-blue-500" />
                        <h3>Compliance Score</h3>
                    </div>
                    <div className={`score-value ${getScoreColor(score)}`}>
                        {score}%
                    </div>
                    <p className="score-subtitle">Based on UI audit & content analysis</p>
                </Card>

                <Card className="status-card">
                    <div className="card-header">
                        <Activity className="text-purple-500" />
                        <h3>Platform Health</h3>
                    </div>
                    <div className="stats">
                        <div className="stat-item">
                            <span className="label">Accessibility Issues</span>
                            <span className={`value ${issues.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {issues.length}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Dark Pattern Flags</span>
                            <span className={`value ${darkPatternsFound.length > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                                {darkPatternsFound.length}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {darkPatternsFound.length > 0 && (
                <div className="dark-patterns-alert">
                    <div className="alert-header">
                        <AlertCircle size={18} />
                        <h4>Dark Patterns Detected in Student Communications</h4>
                    </div>
                    <div className="patterns-list">
                        {darkPatternsFound.map((item, idx) => (
                            <div key={idx} className="pattern-item">
                                <strong>Ticket #{item.ticketId.substring(0, 8)}:</strong>
                                <span>{item.patterns.map(p => p.name).join(', ')}</span>
                            </div>
                        ))}
                    </div>
                    <div className="alert-footer">
                        <Info size={14} />
                        <small>Review these tickets to ensure empathetic and transparent communication.</small>
                    </div>
                </div>
            )}

            {issues.length === 0 && darkPatternsFound.length === 0 && (
                <div className="compliance-success">
                    <CheckCircle className="text-green-500" size={32} />
                    <p>Your platform currently meets all ethical design and accessibility standards.</p>
                </div>
            )}
        </div>
    );
};

export default ComplianceOverview;
