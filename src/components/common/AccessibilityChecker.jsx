import React, { useState } from 'react';
import { Eye, X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { checkAccessibility } from '../../lib/compliance';
import Button from './Button';
import './AccessibilityChecker.css';

const AccessibilityChecker = () => {
    const [issues, setIssues] = useState(null);
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
                        <CheckCircle size={32} className="text-green-500 mb-2" />
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
