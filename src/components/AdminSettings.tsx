import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Card from './common/Card';
import './AdminSettings.css';

const AdminSettings = () => {
    const { settings, updateSetting } = useSettings();

    const toggles = [
        {
            key: 'showHeaderSubmit',
            label: 'Show "Submit Ticket" in Header',
            desc: 'Visibility for students and guests in the main navigation bar.'
        },
        {
            key: 'showHeaderFAQ',
            label: 'Show "FAQ" in Header',
            desc: 'Enable or disable the FAQ link in the top navigation.'
        },
        {
            key: 'allowVideoSupport',
            label: 'Enable Video Support Features',
            desc: 'Allows students to attach screen recordings to tickets.'
        },
        {
            key: 'maintenanceMode',
            label: 'Maintenance Mode',
            desc: 'Disable ticket submission while performing system updates.'
        }
    ] as const;

    return (
        <div className="admin-settings-panel fade-in">
            <h2 className="section-title">Site & Navigation Management</h2>
            <p className="section-subtitle">Grant or restrict access to platform features globally.</p>

            <div className="settings-grid">
                {toggles.map((item) => (
                    <Card key={item.key} className="settings-card">
                        <div className="settings-info">
                            <label className="settings-label">{item.label}</label>
                            <p className="settings-desc">{item.desc}</p>
                        </div>
                        <div
                            className={`settings-toggle ${(settings as any)[item.key] ? 'active' : ''}`}
                            onClick={() => updateSetting(item.key, !(settings as any)[item.key])}
                        >
                            <div className="toggle-thumb"></div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="settings-footer-info">
                <p><strong>Note:</strong> Changes apply instantly to all users browsing the platform.</p>
            </div>
        </div>
    );
};

export default AdminSettings;
