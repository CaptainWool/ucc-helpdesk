import React, { useState } from 'react';
import { Shield, X, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { checkAccessibility, calculateHealthScore } from '../../lib/compliance';
import { useAuth } from '../../contexts/AuthContext';
import './ComplianceAuditTool.css';

const ComplianceAuditTool: React.FC = () => {
    const { profile, user } = useAuth();
    const currentUser = profile || user;
    const isStaff = currentUser?.role === 'agent' || currentUser?.role === 'super_admin' || currentUser?.role === 'master';

    const [isOpen, setIsOpen] = useState(false);
    const [auditResults, setAuditResults] = useState<any[]>([]);
    const [score, setScore] = useState(100);

    if (!isStaff) return null;

    const runAudit = () => {
        const results = checkAccessibility(document.body);
        const healthScore = calculateHealthScore(results);
        setAuditResults(results);
        setScore(healthScore);
        setIsOpen(true);
    };

    const getScoreColor = (s: number) => {
        if (s >= 90) return '#10b981';
        if (s >= 70) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <>
            <button className="compliance-audit-trigger" onClick={runAudit} title="Run Platform Audit">
                <Shield size={24} />
            </button>

            {isOpen && (
                <div className="audit-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="audit-modal" onClick={e => e.stopPropagation()}>
                        <header className="audit-header">
                            <h2><ShieldCheck size={24} className="text-primary" /> Live Page Audit</h2>
                            <button className="close-btn" onClick={() => setIsOpen(false)}><X size={20} /></button>
                        </header>

                        <div className="audit-results">
                            <div className="audit-score-section">
                                <div className="audit-score-circle" style={{ color: getScoreColor(score) }}>
                                    {score}%
                                </div>
                                <div className="audit-score-label">Compliance Health</div>
                            </div>

                            {auditResults.length > 0 ? (
                                <div className="issue-list">
                                    {auditResults.map((issue, i) => (
                                        <div key={i} className={`issue-item ${issue.severity}`}>
                                            <strong>{issue.message}</strong>
                                            <p>Element: <code>{issue.element}</code></p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-issues">
                                    <CheckCircle size={48} className="mb-2" />
                                    <p>Excellent! No accessibility issues found on this page.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ComplianceAuditTool;
