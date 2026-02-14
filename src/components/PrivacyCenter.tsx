import React, { useState, useEffect } from 'react';
import { Shield, Download, X, Check, Lock, Info, Bell, Phone } from 'lucide-react';
import Button from './common/Button';
import { User, Ticket } from '../types';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import './PrivacyCenter.css';

interface PrivacyCenterProps {
    user: User | null;
    tickets: Ticket[];
    onExport: () => void;
    onDeleteAccount: () => void;
    onClose: () => void;
}

const PrivacyCenter: React.FC<PrivacyCenterProps> = ({ user, tickets, onExport, onDeleteAccount, onClose }) => {
    const { showSuccess, showError } = useToast();
    const [preferences, setPreferences] = useState({
        email: user?.notification_preferences?.email ?? true,
        sms: user?.notification_preferences?.sms ?? false,
        whatsapp: user?.notification_preferences?.whatsapp ?? false,
        supportAnalytics: true
    });

    const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
    const [isSaving, setIsSaving] = useState(false);
    const [deletionStatus, setDeletionStatus] = useState<'pending' | null>(null);

    // Sync preferences with user object when it changes
    useEffect(() => {
        if (user?.notification_preferences) {
            setPreferences(prev => ({
                ...prev,
                email: user.notification_preferences?.email ?? true,
                sms: user.notification_preferences?.sms ?? false,
                whatsapp: user.notification_preferences?.whatsapp ?? false,
            }));
        }
        if (user?.phone_number) {
            setPhoneNumber(user.phone_number);
        }
    }, [user]);

    const handleToggle = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSavePreferences = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await api.auth.updateUser(user.id, {
                phone_number: phoneNumber,
                notification_preferences: {
                    email: preferences.email,
                    sms: preferences.sms,
                    whatsapp: preferences.whatsapp
                }
            });
            showSuccess('Notification preferences updated!');
        } catch (err) {
            showError('Failed to save preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletionRequest = () => {
        if (confirm("Request permanent account deletion? This follows GDPR Right to Erasure.")) {
            setDeletionStatus('pending');
            onDeleteAccount();
        }
    };

    return (
        <div className="privacy-center-overlay">
            <div className="privacy-center-modal fade-in active">
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
                    <div style={{ padding: '10px', background: '#ecfdf5', border: '2px solid #059669', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold', color: '#065f46', textAlign: 'center' }}>
                        🚀 REALTIME NOTIFICATION SYSTEM ACTIVE (v2.1)
                    </div>
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
                        <h4><Bell size={18} /> Automated Status Updates</h4>
                        <p className="section-desc">Get real-time alerts via your preferred mobile channels.</p>

                        <div className="phone-input-group">
                            <label htmlFor="phone"><Phone size={14} /> Mobile Number</label>
                            <input
                                type="tel"
                                id="phone"
                                placeholder="+233 XXX XXX XXX"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <div className="preferences-list">
                            <div className="pref-item">
                                <div className="pref-info">
                                    <span className="pref-label">Email Notifications</span>
                                    <p className="pref-desc">Official updates to your university email</p>
                                </div>
                                <div
                                    className={`toggle ${preferences.email ? 'active' : ''}`}
                                    onClick={() => handleToggle('email')}
                                >
                                    <div className="toggle-slider"></div>
                                </div>
                            </div>

                            <div className="pref-item">
                                <div className="pref-info">
                                    <span className="pref-label">SMS Alerts</span>
                                    <p className="pref-desc">Standard text messages for status changes</p>
                                </div>
                                <div
                                    className={`toggle ${preferences.sms ? 'active' : ''}`}
                                    onClick={() => handleToggle('sms')}
                                >
                                    <div className="toggle-slider"></div>
                                </div>
                            </div>

                            <div className="pref-item">
                                <div className="pref-info">
                                    <span className="pref-label">WhatsApp Updates</span>
                                    <p className="pref-desc">Rich notifications via WhatsApp messenger</p>
                                </div>
                                <div
                                    className={`toggle ${preferences.whatsapp ? 'active' : ''}`}
                                    onClick={() => handleToggle('whatsapp')}
                                >
                                    <div className="toggle-slider"></div>
                                </div>
                            </div>
                        </div>

                        <div className="pref-actions">
                            <Button
                                size="sm"
                                onClick={handleSavePreferences}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Preferences'}
                            </Button>
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
                        <span>GDPR-Ready Platform (UCC Compliance v2.1)</span>
                    </div>
                    <Button onClick={onClose} variant="primary">Close</Button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyCenter;
