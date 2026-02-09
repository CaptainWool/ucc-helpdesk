import React, { useState } from 'react';
import { Shield, Download, Trash2, X, Check, Lock, Info, Bell } from 'lucide-react';
import Button from './common/Button';
import Card from './common/Card';
import './PrivacyCenter.css';

const PrivacyCenter = ({ user, tickets, onExport, onDeleteAccount, onClose }) => {
    const [preferences, setPreferences] = useState({
        performanceCookies: true,
        supportAnalytics: true,
        emailNotifications: true
    });

    const [deletionStatus, setDeletionStatus] = useState(null); // 'pending' | null

    const handleToggle = (key) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleDeletionRequest = () => {
        if (confirm("Request permanent account deletion? This follows GDPR Right to Erasure.")) {
            setDeletionStatus('pending');
            onDeleteAccount();
        }
    };

    return (
        <div className="privacy-center-overlay">
            <div className="privacy-center-modal fade-in">
                <div className="modal-header">
                    <div className="title-area">
                        <Shield className="text-blue-500" />
                        <div>
                            <h3>Privacy & Data Control</h3>
                            <p className="subtitle">Manage your GDPR/CCPA rights and preferences</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <div className="modal-content">
                    <section className="privacy-section">
                        <h4><Download size={18} /> Data Portability</h4>
                        <div className="section-content">
                            <p>Download all your information including profile data, ticket history, and messages.</p>
                            <Button variant="outline" size="sm" onClick={onExport}>
                                Export My Data (JSON)
                            </Button>
                        </div>
                    </section>

                    <section className="privacy-section">
                        <h4><Bell size={18} /> Communication Preferences</h4>
                        <div className="preferences-list">
                            <div className="pref-item">
                                <div>
                                    <span className="pref-label">Ticket Updates</span>
                                    <p className="pref-desc">Receive notifications when your tickets are updated</p>
                                </div>
                                <div
                                    className={`toggle ${preferences.emailNotifications ? 'active' : ''}`}
                                    onClick={() => handleToggle('emailNotifications')}
                                >
                                    <div className="toggle-slider"></div>
                                </div>
                            </div>
                            <div className="pref-item">
                                <div>
                                    <span className="pref-label">Support Analytics</span>
                                    <p className="pref-desc">Help us improve by sharing anonymized usage data</p>
                                </div>
                                <div
                                    className={`toggle ${preferences.supportAnalytics ? 'active' : ''}`}
                                    onClick={() => handleToggle('supportAnalytics')}
                                >
                                    <div className="toggle-slider"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="privacy-section safety">
                        <h4 className="text-red-600"><Lock size={18} /> Right to be Forgotten</h4>
                        <div className="section-content">
                            {deletionStatus === 'pending' ? (
                                <div className="pending-status">
                                    <Check className="text-green-500" />
                                    <span>Deletion request submitted (Processing)</span>
                                </div>
                            ) : (
                                <>
                                    <p>Request permanent deletion of your account and all associated data.</p>
                                    <Button variant="danger" size="sm" onClick={handleDeletionRequest}>
                                        Request Account Deletion
                                    </Button>
                                </>
                            )}
                        </div>
                    </section>
                </div>

                <div className="modal-footer">
                    <div className="compliance-meta">
                        <Info size={14} />
                        <span>GDPR-Ready Platform (UCC Compliance v2.0)</span>
                    </div>
                    <Button onClick={onClose} variant="primary">Close</Button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyCenter;
