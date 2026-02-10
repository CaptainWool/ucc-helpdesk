
import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, UserMinus, Search, Ban, History, Info, Bell, Users, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import './CommandCenter.css';

const CommandCenter = () => {
    const { showSuccess, showError, showWarning } = useToast();
    const [settings, setSettings] = useState({
        submissions_locked: false,
        maintenance_mode: false,
        global_announcement: { enabled: false, message: '', type: 'info' },
        max_open_tickets: 100,
        sla_peak_mode: false,
        resource_limits: { max_size_mb: 5, allowed_types: ['image/jpeg', 'image/png'] },
        ai_sensitivity: 0.7,
        housekeeping_rules: { enabled: false, auto_close_resolved_days: 30 },
        command_center_password: 'israel@40'
    });
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [modifying, setModifying] = useState(null);
    const [announcementDraft, setAnnouncementDraft] = useState({ enabled: false, message: '', type: 'info' });
    const [resourceDraft, setResourceDraft] = useState({ max_size_mb: 5, allowed_types: [] });
    const [activeTab, setActiveTab] = useState('controls'); // controls, moderation, audit
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passwordAttempt, setPasswordAttempt] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [s, u, logs] = await Promise.all([
                api.system.getSettings(),
                api.auth.getUsers(),
                api.system.getAuditLogs()
            ]);
            setSettings(s);
            setAuditLogs(logs);
            setAnnouncementDraft(s.global_announcement || { enabled: false, message: '', type: 'info' });
            setResourceDraft(s.resource_limits || { max_size_mb: 5, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] });
            setUsers(u.filter(user => user.role !== 'master')); // Show all except master bypass
        } catch (err) {
            console.error('Failed to fetch command center data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCleanup = async () => {
        if (!confirm('Run manual cleanup now? This will close all resolved tickets according to your threshold.')) return;
        try {
            const res = await api.system.cleanupTickets();
            showSuccess(res.message || 'Cleanup completed successfully');
            fetchData();
        } catch (err) {
            showError('Cleanup failed');
        }
    };

    const handleUnlock = () => {
        const correctPIN = settings.command_center_password || 'israel@40';
        if (passwordAttempt === correctPIN) {
            setIsUnlocked(true);
            showSuccess('Access Granted: Command Center Unlocked');
        } else {
            showError('Access Denied: Incorrect PIN');
        }
    };

    const handleChangePIN = () => {
        const newPIN = prompt('Enter new Command Center PIN:');
        if (newPIN) {
            updateSetting('command_center_password', newPIN);
        }
    };

    const updateSetting = async (key, value) => {
        try {
            await api.system.updateSettings(key, value);
            setSettings(prev => ({ ...prev, [key]: value }));
            showSuccess(`System setting updated`);
        } catch (err) {
            showError('Failed to update system setting');
        }
    };

    const toggleSetting = (key) => updateSetting(key, !settings[key]);

    const saveAnnouncement = () => updateSetting('global_announcement', announcementDraft);

    const saveResourceLimits = () => updateSetting('resource_limits', resourceDraft);

    const handleModerate = async (userId, data) => {
        setModifying(userId);
        try {
            await api.system.moderateUser(userId, data);
            showSuccess('User status updated');
            await fetchData(); // Refresh list
        } catch (err) {
            showError('Failed to update user status');
        } finally {
            setModifying(null);
        }
    };

    const handleBan = (user) => {
        const days = prompt(`Ban ${user.full_name} for how many days? (0 for indefinite)`, "7");
        if (days === null) return;

        const banData = {
            is_banned: true,
            ban_expires_at: days === "0" ? null : new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000).toISOString()
        };
        handleModerate(user.id, banData);
    };

    const handleRevoke = (user) => {
        const reason = prompt(`Reason for permanently revoking ${user.full_name}'s account?`);
        if (!reason) return;

        if (confirm(`CRITICAL: Are you sure you want to permanently revoke ${user.full_name}'s account? This action cannot be undone.`)) {
            handleModerate(user.id, {
                revoked_at: new Date().toISOString(),
                revocation_reason: reason
            });
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.student_id && u.student_id.includes(searchTerm)) ||
        (u.staff_id && u.staff_id.includes(searchTerm))
    );

    if (loading) return <div className="loading-state">Initializing Command Center...</div>;

    if (!isUnlocked) {
        return (
            <div className="cc-lock-screen fade-in">
                <Card className="lock-card">
                    <div className="lock-icon-wrapper">
                        <Lock size={48} color="var(--primary)" />
                    </div>
                    <h2>Command Center Locked</h2>
                    <p>Secondary authentication is required to access system-critical controls.</p>
                    <div className="lock-form">
                        <Input
                            type="password"
                            placeholder="Enter Security PIN"
                            value={passwordAttempt}
                            onChange={(e) => setPasswordAttempt(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                        />
                        <Button onClick={handleUnlock} className="w-full">Unlock Dashboard</Button>
                    </div>
                </Card>
            </div>
        );
    }

    const renderControls = () => (
        <>
            <div className="admin-grid">
                {/* System Controls */}
                <Card className="system-controls">
                    <h3><ShieldAlert size={20} /> System Critical Controls</h3>
                    <p className="section-desc">Manage global availability of the helpdesk platform.</p>

                    <div className="controls-list">
                        <div className="control-item">
                            <div className="control-info">
                                <strong>Lock Submissions</strong>
                                <p>Prevent any new tickets from being submitted.</p>
                            </div>
                            <Button
                                variant={settings.submissions_locked ? "danger" : "outline"}
                                onClick={() => toggleSetting('submissions_locked')}
                            >
                                {settings.submissions_locked ? <><Lock size={16} /> Locked</> : <><Unlock size={16} /> Open</>}
                            </Button>
                        </div>

                        <div className="control-item">
                            <div className="control-info">
                                <strong>Maintenance Mode</strong>
                                <p>Lock the entire student portal for maintenance.</p>
                            </div>
                            <Button
                                variant={settings.maintenance_mode ? "danger" : "outline"}
                                onClick={() => toggleSetting('maintenance_mode')}
                            >
                                {settings.maintenance_mode ? <><Lock size={16} /> Active</> : <><Unlock size={16} /> Disabled</>}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* PIN Control */}
                <Card className="pin-control">
                    <h3><Lock size={20} /> Access Control</h3>
                    <p className="section-desc">Manage the Command Center security PIN.</p>
                    <div style={{ marginTop: '1rem' }}>
                        <Button variant="outline" size="sm" onClick={handleChangePIN}>
                            Change Access PIN
                        </Button>
                    </div>
                </Card>

                {/* Capacity Card */}
                <Card className="capacity-card">
                    <h3><Users size={20} /> Queue Capacity</h3>
                    <p className="section-desc">Limit active ticket volume.</p>
                    <div className="capacity-input-group">
                        <Input
                            type="number"
                            label="Max Active Tickets"
                            value={settings.max_open_tickets}
                            onChange={(e) => updateSetting('max_open_tickets', parseInt(e.target.value))}
                        />
                    </div>
                </Card>

                {/* SLA Peak Mode Card */}
                <Card className="sla-peak-card">
                    <div className="card-top-cc">
                        <h3><ShieldAlert size={20} /> SLA Peak Mode</h3>
                        <Button
                            variant={settings.sla_peak_mode ? "warning" : "outline"}
                            size="sm"
                            onClick={() => toggleSetting('sla_peak_mode')}
                        >
                            {settings.sla_peak_mode ? "Active" : "Disabled"}
                        </Button>
                    </div>
                    <p className="section-desc">Instantly double resolving time for all new tickets and priority changes.</p>
                </Card>
            </div>

            <div className="admin-grid">
                {/* AI & Automation */}
                <Card className="ai-controls">
                    <h3><Sparkles size={20} /> AI Sensitivity Tuning</h3>
                    <p className="section-desc">Adjust how aggressive the AI is in auto-prioritizing.</p>
                    <div className="ai-tuning">
                        <div className="slider-labels">
                            <span>Conservative</span>
                            <span>Strict</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.ai_sensitivity}
                            onChange={(e) => updateSetting('ai_sensitivity', parseFloat(e.target.value))}
                        />
                        <p className="hint">Higher values make AI more likely to flag tickets as 'Urgent'.</p>
                    </div>
                </Card>

                {/* Housekeeping */}
                <Card className="housekeeping">
                    <h3><History size={20} /> Automated Cleanup</h3>
                    <p className="section-desc">Keep the system clean by closing stale tickets.</p>
                    <div className="housekeeping-controls">
                        <div className="control-row">
                            <span>Auto-close resolved tickets after:</span>
                            <input
                                type="number"
                                className="small-input"
                                value={settings.housekeeping_rules?.auto_close_resolved_days || 30}
                                onChange={(e) => updateSetting('housekeeping_rules', {
                                    ...(settings.housekeeping_rules || { enabled: false, auto_close_resolved_days: 30 }),
                                    auto_close_resolved_days: parseInt(e.target.value) || 30
                                })}
                            />
                            <span>days</span>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <Button size="sm" variant="secondary" onClick={handleCleanup}>
                                Run Cleanup Now
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="admin-grid">
                {/* Resource Limits Editor */}
                <Card className="resource-limits">
                    <h3><ShieldAlert size={20} /> Resource Security</h3>
                    <p className="section-desc">Manage attachment type and size constraints.</p>

                    <div className="resource-form">
                        <Input
                            type="number"
                            label="Max File Size (MB)"
                            value={resourceDraft?.max_size_mb || 5}
                            onChange={(e) => setResourceDraft(prev => ({ ...prev, max_size_mb: parseInt(e.target.value) || 5 }))}
                        />

                        <div className="type-group">
                            <label className="input-label">Allowed Formats:</label>
                            <div className="type-grid">
                                {['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'text/plain'].map(type => (
                                    <label key={type} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={resourceDraft?.allowed_types?.includes(type) || false}
                                            onChange={(e) => {
                                                const currentTypes = resourceDraft?.allowed_types || [];
                                                const types = e.target.checked
                                                    ? [...currentTypes, type]
                                                    : currentTypes.filter(t => t !== type);
                                                setResourceDraft(prev => ({ ...prev, allowed_types: types }));
                                            }}
                                        />
                                        <span>{type.split('/')[1].toUpperCase()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions-cc" style={{ marginTop: '1rem' }}>
                            <Button onClick={saveResourceLimits} disabled={JSON.stringify(resourceDraft) === JSON.stringify(settings.resource_limits)}>
                                Apply Constraints
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Info Card */}
                <Card className="info-card-cc">
                    <h3><Info size={20} /> Operational Status</h3>
                    <p>Load: <strong>{settings.current_ticket_count || 0} active tickets</strong>.</p>
                    <p>Mode: <strong>{settings.sla_peak_mode ? 'PEAK' : 'STANDARD'}</strong></p>
                    <div className="status-badges" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {settings.submissions_locked && <span className="badge badge-revoked">LOCKED</span>}
                        {settings.maintenance_mode && <span className="badge badge-banned">MAINTENANCE</span>}
                    </div>
                </Card>
            </div>

            {/* Announcement Editor */}
            <Card className="announcement-editor">
                <h3><Bell size={20} /> Global Announcement</h3>
                <p className="section-desc">Broadcast a message to all students in the portal.</p>

                <div className="announcement-presets" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '100%', marginBottom: '0.25rem', fontWeight: 'bold' }}>Quick Draft Presets:</span>
                    {[
                        { label: 'Fee Deadline', msg: '⚠️ Fee Deadline: Final date for Semester 1 fee clearance is Friday, Feb 20th.', type: 'warning' },
                        { label: 'Registration', msg: '📅 Course Registration: Undergraduate registration closes this Sunday at midnight.', type: 'info' },
                        { label: 'Security', msg: '🔒 Security Alert: UCC will never ask for your password. Stay alert to phishing scams.', type: 'danger' },
                        { label: 'Results', msg: '📄 Results Out: First-semester results for Level 400 students are now live on the portal.', type: 'info' },
                        { label: 'General', msg: '🎓 Welcome Back: We wish all CoDE students a successful and productive semester!', type: 'info' }
                    ].map((p, i) => (
                        <button
                            key={i}
                            className="preset-pill"
                            style={{
                                fontSize: '0.7rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: 'var(--text-main)',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            onClick={() => setAnnouncementDraft({ enabled: true, message: p.msg, type: p.type })}
                            onMouseOver={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = '#f8fafc'; }}
                            onMouseOut={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'white'; }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="announcement-form">
                    <div className="form-row">
                        <div className="toggle-group">
                            <label>Status:</label>
                            <Button
                                size="sm"
                                variant={announcementDraft.enabled ? "primary" : "outline"}
                                onClick={() => setAnnouncementDraft(prev => ({ ...prev, enabled: !prev.enabled }))}
                            >
                                {announcementDraft.enabled ? "Enabled" : "Disabled"}
                            </Button>
                        </div>
                        <div className="select-group">
                            <label>Type:</label>
                            <select
                                value={announcementDraft.type}
                                onChange={(e) => setAnnouncementDraft(prev => ({ ...prev, type: e.target.value }))}
                                className="styled-select"
                            >
                                <option value="info">Info (Blue)</option>
                                <option value="warning">Warning (Yellow)</option>
                                <option value="danger">Danger (Red)</option>
                            </select>
                        </div>
                    </div>
                    <div className="msg-input">
                        <textarea
                            placeholder="Enter announcement message..."
                            value={announcementDraft.message}
                            onChange={(e) => setAnnouncementDraft(prev => ({ ...prev, message: e.target.value }))}
                            rows="2"
                        />
                    </div>
                    <div className="form-actions-cc">
                        <Button onClick={saveAnnouncement} disabled={JSON.stringify(announcementDraft) === JSON.stringify(settings.global_announcement)}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Card>
        </>
    );

    const renderModeration = () => (
        <Card className="user-moderation">
            <div className="card-header-cc">
                <h3><Ban size={20} /> User Moderation Center</h3>
                <div className="search-cc">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Find by name, ID or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-responsive">
                <table className="cc-table">
                    <thead>
                        <tr>
                            <th>User Detals</th>
                            <th>Role / Status</th>
                            <th>Credentials / Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={user.revoked_at ? 'row-revoked' : ''}>
                                <td>
                                    <div className="user-cell">
                                        <strong>{user.full_name}</strong>
                                        <span>{user.email}</span>
                                        <span className="user-id-tag-cc">{user.role === 'student' ? `ID: ${user.student_id}` : `Staff ID: ${user.staff_id || 'N/A'}`}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span className={`role-badge role-${user.role}`}>
                                            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'agent' ? 'Coordinator' : 'Student'}
                                        </span>
                                        {user.revoked_at ? (
                                            <span className="badge badge-revoked">REVOKED</span>
                                        ) : user.is_banned ? (
                                            <span className="badge badge-banned">
                                                BANNED {user.ban_expires_at ? `until ${new Date(user.ban_expires_at).toLocaleDateString()}` : '(Indefinite)'}
                                            </span>
                                        ) : (
                                            <span className="badge badge-active">ACTIVE</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="cc-actions-column">
                                        {user.plaintext_password && (
                                            <div className="credential-recovery-cc" onClick={() => {
                                                navigator.clipboard.writeText(user.plaintext_password);
                                                showSuccess('Temporary password copied to clipboard');
                                            }} title="Generated Password (Recovery)">
                                                <Lock size={12} />
                                                <code>{user.plaintext_password}</code>
                                            </div>
                                        )}
                                        <div className="cc-actions">
                                            {!user.revoked_at && (
                                                <>
                                                    {user.is_banned ? (
                                                        <Button size="sm" variant="outline" onClick={() => handleModerate(user.id, { is_banned: false, ban_expires_at: null })} disabled={modifying === user.id}>
                                                            Unban
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="secondary" onClick={() => handleBan(user)} disabled={modifying === user.id}>
                                                            Ban
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="danger" onClick={() => handleRevoke(user)} disabled={modifying === user.id}>
                                                        Revoke
                                                    </Button>
                                                </>
                                            )}
                                            {user.revoked_at && (
                                                <Button size="sm" variant="ghost" onClick={() => showInfo(`Reason: ${user.revocation_reason}`)} title="View Reason">

                                                    <History size={16} /> Details
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    const renderAuditLogs = () => (
        <Card className="audit-logs">
            <h3><History size={20} /> System Audit Logs</h3>
            <p className="section-desc">History of administrative actions and system changes.</p>
            <div className="table-responsive">
                <table className="cc-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Admin</th>
                            <th>Action</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map(log => (
                            <tr key={log.id}>
                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                                <td>
                                    <div className="user-cell">
                                        <strong>{log.admin_name}</strong>
                                        <span style={{ fontSize: '0.75rem' }}>{log.admin_email}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="badge badge-info" style={{ fontWeight: 'bold' }}>
                                        {log.action.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>
                                    {log.target_type && <code>[{log.target_type}: {log.target_id}]</code>}
                                    <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                                        {JSON.stringify(log.details)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <div className="command-center fade-in">
            <div className="cc-tabs">
                <button className={`cc-tab ${activeTab === 'controls' ? 'active' : ''}`} onClick={() => setActiveTab('controls')}>Controls</button>
                <button className={`cc-tab ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}>Moderation</button>
                <button className={`cc-tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>Audit Logs</button>
            </div>

            <div className="cc-tab-content">
                {activeTab === 'controls' && renderControls()}
                {activeTab === 'moderation' && renderModeration()}
                {activeTab === 'audit' && renderAuditLogs()}
            </div>
        </div>
    );
};

export default CommandCenter;
