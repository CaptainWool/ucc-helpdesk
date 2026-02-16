import React, { useState } from 'react';
import { Eye, X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { checkAccessibility, ComplianceIssue } from '../../lib/compliance';
import './AccessibilityChecker.css';

const AccessibilityChecker = () => {
    const [issues, setIssues] = useState<ComplianceIssue[] | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const runCheck = () => {
        const detectedIssues = checkAccessibility(document.body);
        setIssues(detectedIssues);
        setIsOpen(true);
    };

    const closePanel = () => {
        setIsOpen(false);
        setIssues(null);
    };

    if (!isOpen) {
        return (
            <button
                onClick={runCheck}
                className="accessibility-trigger"
                title="Run Accessibility Check"
            >
                <Eye size={20} />
            </button>
        );
    }

    const highSeverity = issues?.filter(i => i.severity === 'high') || [];
    const mediumSeverity = issues?.filter(i => i.severity === 'medium') || [];

    return (
        <div className="accessibility-panel fade-in">
            <div className="panel-header">
                <h3>Accessibility Check</h3>
                <button onClick={closePanel}><X size={18} /></button>
            </div>

            <div className="panel-content">
                {issues && issues.length === 0 ? (
                    <div className="success-state">
                        <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                        <p>No major issues found!</p>
                    </div>
                ) : (
                    <>
                        <div className="summary-stats">
                            <span className="stat high">
                                <strong>{highSeverity.length}</strong> Critical
                            </span>
                            <span className="stat medium">
                                <strong>{mediumSeverity.length}</strong> Warnings
                            </span>
                        </div>

                        <div className="issues-list">
                            {highSeverity.map((issue, i) => (
                                <div key={`high-${i}`} className="issue-item high">
                                    <AlertCircle size={14} />
                                    <span>{issue.message}</span>
                                    <small>{issue.element}</small>
                                </div>
                            ))}
                            {mediumSeverity.map((issue, i) => (
                                <div key={`med-${i}`} className="issue-item medium">
                                    <AlertTriangle size={14} />
                                    <span>{issue.message}</span>
                                    <small>{issue.element}</small>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AccessibilityChecker;
