import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Lock, Unlock, ShieldAlert, Search, Ban, History, Info, Bell, Users, Sparkles, Activity, Zap, Cpu, Server, Database, Globe, Clock, Mail, Phone, Settings, Calendar, PlayCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import { User } from '../types';
import './CommandCenter.css';

interface MaintenanceConfig {
    message_title: string;
    message_body: string;
    show_countdown: boolean;
    estimated_duration_minutes: number;
    contact_info: {
        email: string;
        phone: string;
        show_contact: boolean;
    };
    scheduled?: {
        enabled: boolean;
        start_time: string;
        end_time: string;
        auto_enable: boolean;
        auto_disable: boolean;
    };
    exemptions?: {
        enabled: boolean;
        roles: string[];
        emails: string[];
    };
}

interface SystemSettings {
    submissions_locked: boolean;
    maintenance_mode: boolean;
    maintenance_config?: MaintenanceConfig;
    global_announcement: { enabled: boolean; message: string; type: string };
    max_open_tickets: number;
    sla_peak_mode: boolean;
    resource_limits: { max_size_mb: number; allowed_types: string[] };
    ai_sensitivity: number;
    housekeeping_rules: { enabled: boolean; auto_close_resolved_days: number };
    command_center_password?: string;
    current_ticket_count?: number;
}

interface AuditLog {
    id: string;
    created_at: string;
    admin_name: string;
    admin_email: string;
    action: string;
    target_type?: string;
    target_id?: string;
    details: any;
}

const CommandCenter: React.FC = () => {
    const { showSuccess, showError, showInfo } = useToast();
    const { user } = useAuth();
    const [settings, setSettings] = useState<SystemSettings>({
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
    const [users, setUsers] = useState<User[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [modifying, setModifying] = useState<string | null>(null);
    const [announcementDraft, setAnnouncementDraft] = useState({ enabled: false, message: '', type: 'info' });
    const [resourceDraft, setResourceDraft] = useState({ max_size_mb: 5, allowed_types: [] as string[] });
    const [maintenanceDraft, setMaintenanceDraft] = useState<MaintenanceConfig>({
        message_title: 'System Under Maintenance',
        message_body: 'We\'re currently performing system maintenance to improve your experience. Please check back shortly.',
        show_countdown: true,
        estimated_duration_minutes: 120,
        contact_info: {
            email: 'helpdesk@ucc.edu.gh',
            phone: '+233 XX XXX XXXX',
            show_contact: true
        },
        scheduled: {
            enabled: false,
            start_time: '',
            end_time: '',
            auto_enable: true,
            auto_disable: true
        },
        exemptions: {
            enabled: true,
            roles: ['super_admin'],
            emails: []
        }
    });
    const [warningMinutes, setWarningMinutes] = useState(15);
    const [maintenanceTab, setMaintenanceTab] = useState<'config' | 'schedule' | 'exemptions'>('config');
    const [activeTab, setActiveTab] = useState<'controls' | 'moderation' | 'audit'>('controls');
    const [showMaintenanceConfig, setShowMaintenanceConfig] = useState(false);
    const [passwordAttempt, setPasswordAttempt] = useState('');
    const [systemHealth, setSystemHealth] = useState({
        api: 'optimal',
        database: 'optimal',
        ai: 'optimal',
        latency: 42
    });
    // Auto-unlock for admin/agent users (role from database)
    const [isUnlocked, setIsUnlocked] = useState(() => {
        // Super admin and agent users bypass the lock screen
        // Role is fetched from database via useAuth
        return user?.role === 'super_admin' || user?.role === 'agent' || user?.role === 'master';
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setSystemHealth(prev => ({
                ...prev,
                latency: Math.floor(Math.random() * (55 - 38 + 1)) + 38
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

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
            if (s.maintenance_config) {
                setMaintenanceDraft(s.maintenance_config);
            }
            setUsers(u.filter((user: User) => user.role !== 'master'));
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

    const updateSetting = async (key: string, value: any) => {
        try {
            await api.system.updateSettings(key, value);
            setSettings(prev => ({ ...prev, [key]: value }));
            showSuccess(`System setting updated`);
        } catch (err) {
            showError('Failed to update system setting');
        }
    };

    const toggleSetting = (key: keyof SystemSettings) => updateSetting(key, !settings[key]);

    const saveAnnouncement = () => updateSetting('global_announcement', announcementDraft);

    const saveResourceLimits = () => updateSetting('resource_limits', resourceDraft);

    const saveMaintenanceConfig = () => updateSetting('maintenance_config', maintenanceDraft);

    const activateWithWarning = async () => {
        try {
            await api.system.activateMaintenanceWithWarning(warningMinutes);
            showSuccess(`Maintenance warning broadcasted. Mode will activate in ${warningMinutes} minutes.`);
            await fetchData();
            setShowMaintenanceConfig(false);
        } catch (err) {
            showError('Failed to activate maintenance warning');
        }
    };

    const handleModerate = async (userId: string, data: any) => {
        setModifying(userId);
        try {
            await api.system.moderateUser(userId, data);
            showSuccess('User status updated');
            await fetchData();
        } catch (err) {
            showError('Failed to update user status');
        } finally {
            setModifying(null);
        }
    };

    const handleBan = (user: User) => {
        const days = prompt(`Ban ${user.full_name} for how many days? (0 for indefinite)`, "7");
        if (days === null) return;

        const banData = {
            is_banned: true,
            ban_expires_at: days === "0" ? null : new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000).toISOString()
        };
        handleModerate(user.id, banData);
    };

    const handleRevoke = (user: User) => {
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
                            onKeyPress={(e: KeyboardEvent) => e.key === 'Enter' && handleUnlock()}
                        />
                        <Button onClick={handleUnlock} className="w-full">Unlock Dashboard</Button>
                    </div>
                    <p className="lock-hint">Note: These logs are audited for security purposes.</p>
                </Card>
            </div>
        );
    }

    const renderHealthMonitor = () => (
        <div className="health-monitor-strip">
            <div className="health-card">
                <div className="health-node">
                    <Globe size={18} />
                    <span>API Gateway</span>
                    <div className="status-dot pulsing green"></div>
                </div>
                <div className="node-stats">
                    <span className="value">99.9%</span>
                    <span className="label">Uptime</span>
                </div>
            </div>
            <div className="health-card">
                <div className="health-node">
                    <Database size={18} />
                    <span>Database Engine</span>
                    <div className="status-dot pulsing green"></div>
                </div>
                <div className="node-stats">
                    <span className="value">{systemHealth.latency}ms</span>
                    <span className="label">Latency</span>
                </div>
            </div>
            <div className="health-card">
                <div className="health-node">
                    <Cpu size={18} />
                    <span>AI Model Service</span>
                    <div className="status-dot pulsing green"></div>
                </div>
                <div className="node-stats">
                    <span className="value">v4-Turbo</span>
                    <span className="label">Version</span>
                </div>
            </div>
            <div className="health-card">
                <div className="health-node">
                    <Activity size={18} />
                    <span>Global Traffic</span>
                    <div className="status-dot pulsing blue"></div>
                </div>
                <div className="node-stats">
                    <span className="value">Normal</span>
                    <span className="label">Load</span>
                </div>
            </div>
        </div>
    );

    const renderQueueMetrics = () => {
        const count = settings.current_ticket_count || 0;
        const max = settings.max_open_tickets || 100;
        const percentage = Math.min((count / max) * 100, 100);
        const status = percentage > 85 ? 'Critical' : percentage > 60 ? 'Strained' : 'Optimal';

        return (
            <Card className="queue-metrics-card">
                <div className="queue-header">
                    <div>
                        <h3>Queue Infrastructure</h3>
                        <p className="section-desc">Real-time capacity and load balance.</p>
                    </div>
                    <div className={`queue-status-badge ${status.toLowerCase()}`}>
                        {status}
                    </div>
                </div>

                <div className="queue-visualizer">
                    <div className="queue-track">
                        <div
                            className={`queue-fill ${status.toLowerCase()}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <div className="queue-labels">
                        <span>{count} Active</span>
                        <span>{max} Max Capacity</span>
                    </div>
                </div>

                {percentage > 85 && (
                    <div className="queue-alert fade-in">
                        <ShieldAlert size={16} />
                        <span>Critical Load: System will automatically enable Peak Mode if threshold persists.</span>
                    </div>
                )}
            </Card>
        );
    };

    const renderControls = () => (
        <div className="operational-cockpit">
            <div className="cockpit-main">
                <Card className="system-controls">
                    <div className="controls-header">
                        <h3><Server size={20} /> Operational Cockpit</h3>
                        <div className="status-pill-large">
                            <div className={`pulse-dot ${settings.maintenance_mode ? 'red' : 'green'}`}></div>
                            {settings.maintenance_mode ? 'System Offline' : 'System Online'}
                        </div>
                    </div>

                    <div className="controls-grid">
                        <div className={`control-block ${settings.submissions_locked ? 'active-warning' : ''}`}>
                            <div className="block-icon">
                                <Lock size={24} />
                            </div>
                            <div className="block-content">
                                <strong>Submission Lock</strong>
                                <p>Halt new student requests</p>
                            </div>
                            <Button
                                variant={settings.submissions_locked ? "danger" : "outline"}
                                onClick={() => toggleSetting('submissions_locked')}
                                size="sm"
                            >
                                {settings.submissions_locked ? 'Release' : 'Lock Base'}
                            </Button>
                        </div>

                        <div className={`control-block ${settings.maintenance_mode ? 'active-danger' : ''}`}>
                            <div className="block-icon">
                                <ShieldAlert size={24} />
                            </div>
                            <div className="block-content">
                                <strong>Maintenance Mode</strong>
                                <p>Restrict entire platform</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowMaintenanceConfig(true)}
                                    size="sm"
                                >
                                    <Settings size={16} style={{ marginRight: '0.25rem' }} />
                                    Configure
                                </Button>
                                <Button
                                    variant={settings.maintenance_mode ? "danger" : "outline"}
                                    onClick={() => toggleSetting('maintenance_mode')}
                                    size="sm"
                                >
                                    {settings.maintenance_mode ? 'Restore' : 'Activate'}
                                </Button>
                            </div>
                        </div>

                        <div className={`control-block ${settings.sla_peak_mode ? 'active-primary' : ''}`}>
                            <div className="block-icon">
                                <Zap size={24} />
                            </div>
                            <div className="block-content">
                                <strong>SLA Peak Mode</strong>
                                <p>Dynamic resolve scaling</p>
                            </div>
                            <Button
                                variant={settings.sla_peak_mode ? "primary" : "outline"}
                                onClick={() => toggleSetting('sla_peak_mode')}
                                size="sm"
                            >
                                {settings.sla_peak_mode ? 'Standard' : 'Boost'}
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="admin-grid" style={{ marginTop: '1.5rem' }}>
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

                    <Card className="resource-limits">
                        <h3><ShieldAlert size={20} /> Resource Security</h3>
                        <p className="section-desc">Manage attachment type and size constraints.</p>

                        <div className="resource-form">
                            <div className="type-group">
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
                                <Button size="sm" onClick={saveResourceLimits} disabled={JSON.stringify(resourceDraft) === JSON.stringify(settings.resource_limits)}>
                                    Apply Type Constraints
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="announcement-editor" style={{ marginTop: '1.5rem' }}>
                    <h3><Bell size={20} /> Global Announcement</h3>
                    <p className="section-desc">Broadcast a message to all students in the portal.</p>

                    <div className="announcement-presets" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {[
                            { label: 'Fee Deadline', msg: 'âš ï¸ Fee Deadline: Final date for Semester 1 fee clearance is Friday, Feb 20th.', type: 'warning' },
                            { label: 'Registration', msg: 'ðŸ“… Course Registration: Undergraduate registration closes this Sunday at midnight.', type: 'info' },
                            { label: 'Security', msg: 'ðŸ”’ Security Alert: UCC will never ask for your password. Stay alert to phishing scams.', type: 'danger' },
                            { label: 'Results', msg: 'ðŸ“„ Results Out: First-semester results for Level 400 students are now live on the portal.', type: 'info' },
                            { label: 'General', msg: 'ðŸŽ“ Welcome Back: We wish all CoDE students a successful and productive semester!', type: 'info' }
                        ].map((p, i) => (
                            <button
                                key={i}
                                className="preset-pill"
                                onClick={() => setAnnouncementDraft({ enabled: true, message: p.msg, type: p.type })}
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
                                rows={2}
                            />
                        </div>
                        <div className="form-actions-cc">
                            <Button onClick={saveAnnouncement} disabled={JSON.stringify(announcementDraft) === JSON.stringify(settings.global_announcement)}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="cockpit-sidebar">
                {renderQueueMetrics()}

                <Card className="pin-control-card">
                    <div className="card-mini-header">
                        <Lock size={16} />
                        <span>Security</span>
                    </div>
                    <h4>Terminal Access PIN</h4>
                    <p>Authorized personnel only. Rotate every 30 days.</p>
                    <Button variant="outline" size="sm" onClick={handleChangePIN} className="mt-4 w-full">
                        Rotate Entry Key
                    </Button>
                </Card>

                <Card className="housekeeping-card">
                    <div className="card-mini-header">
                        <History size={16} />
                        <span>Janitor Service</span>
                    </div>
                    <h4>Auto-Cleanup</h4>
                    <p className="text-xs text-muted mb-4">Auto-close resolved tickets after {settings.housekeeping_rules?.auto_close_resolved_days || 30} days.</p>
                    <div className="cleanup-input mb-4">
                        <input
                            type="number"
                            value={settings.housekeeping_rules?.auto_close_resolved_days || 30}
                            onChange={(e) => updateSetting('housekeeping_rules', {
                                ...(settings.housekeeping_rules || { enabled: false, auto_close_resolved_days: 30 }),
                                auto_close_resolved_days: parseInt(e.target.value) || 30
                            })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleCleanup} className="w-full">
                        Force Run Clean
                    </Button>
                </Card>

                <Card className="info-card-status">
                    <div className="card-mini-header">
                        <Activity size={16} />
                        <span>Metrics</span>
                    </div>
                    <div className="mini-metric">
                        <span>Load Factor</span>
                        <strong>{Math.round(((settings.current_ticket_count || 0) / (settings.max_open_tickets || 100)) * 100)}%</strong>
                    </div>
                    <div className="mini-metric">
                        <span>SLA Compliance</span>
                        <strong>98.4%</strong>
                    </div>
                    <div className="mini-metric">
                        <span>System Mode</span>
                        <strong className={settings.sla_peak_mode ? 'text-orange' : 'text-green'}>
                            {settings.sla_peak_mode ? 'PEAK' : 'STANDARD'}
                        </strong>
                    </div>
                </Card>
            </div>
        </div>
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
                            <th>User Details</th>
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
                                                navigator.clipboard.writeText(user.plaintext_password!);
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
                                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    const renderMaintenanceModal = () => (
        showMaintenanceConfig && (
            <div className="modal-overlay" onClick={() => setShowMaintenanceConfig(false)}>
                <Card className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>
                            <Settings size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            Maintenance Configuration
                        </h3>
                        <Button variant="ghost" onClick={() => setShowMaintenanceConfig(false)} size="sm">Ã—</Button>
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '1rem' }}>
                        <button
                            style={{ padding: '0.75rem 0.5rem', borderBottom: maintenanceTab === 'config' ? '2px solid var(--primary)' : 'none', color: maintenanceTab === 'config' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={() => setMaintenanceTab('config')}
                        >
                            General
                        </button>
                        <button
                            style={{ padding: '0.75rem 0.5rem', borderBottom: maintenanceTab === 'schedule' ? '2px solid var(--primary)' : 'none', color: maintenanceTab === 'schedule' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={() => setMaintenanceTab('schedule')}
                        >
                            Schedule & Activation
                        </button>
                        <button
                            style={{ padding: '0.75rem 0.5rem', borderBottom: maintenanceTab === 'exemptions' ? '2px solid var(--primary)' : 'none', color: maintenanceTab === 'exemptions' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={() => setMaintenanceTab('exemptions')}
                        >
                            Exemptions
                        </button>
                    </div>

                    {maintenanceTab === 'config' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Custom Title */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Maintenance Title
                                </label>
                                <Input
                                    value={maintenanceDraft.message_title}
                                    onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, message_title: e.target.value }))}
                                    placeholder="System Under Maintenance"
                                />
                            </div>

                            {/* Custom Message */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Message Body
                                </label>
                                <textarea
                                    value={maintenanceDraft.message_body}
                                    onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, message_body: e.target.value }))}
                                    placeholder="Describe what's happening..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border)',
                                        fontFamily: 'inherit',
                                        fontSize: '0.95rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            {/* Countdown Settings */}
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={maintenanceDraft.show_countdown}
                                        onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, show_countdown: e.target.checked }))}
                                    />
                                    <Clock size={18} />
                                    <span style={{ fontWeight: '600' }}>Show Countdown Timer</span>
                                </label>
                                {maintenanceDraft.show_countdown && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            Estimated Duration (minutes)
                                        </label>
                                        <Input
                                            type="number"
                                            value={maintenanceDraft.estimated_duration_minutes}
                                            onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, estimated_duration_minutes: parseInt(e.target.value) || 0 }))}
                                            min="1"
                                            placeholder="120"
                                        />
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            Duration: {Math.floor(maintenanceDraft.estimated_duration_minutes / 60)}h {maintenanceDraft.estimated_duration_minutes % 60}m
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Contact Information */}
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={maintenanceDraft.contact_info.show_contact}
                                        onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, contact_info: { ...prev.contact_info, show_contact: e.target.checked } }))}
                                    />
                                    <Phone size={18} />
                                    <span style={{ fontWeight: '600' }}>Show Contact Information</span>
                                </label>
                                {maintenanceDraft.contact_info.show_contact && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginLeft: '1.75rem' }}>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <Mail size={16} />
                                                Email
                                            </label>
                                            <Input
                                                type="email"
                                                value={maintenanceDraft.contact_info.email}
                                                onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, contact_info: { ...prev.contact_info, email: e.target.value } }))}
                                                placeholder="helpdesk@ucc.edu.gh"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <Phone size={16} />
                                                Phone
                                            </label>
                                            <Input
                                                type="tel"
                                                value={maintenanceDraft.contact_info.phone}
                                                onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, contact_info: { ...prev.contact_info, phone: e.target.value } }))}
                                                placeholder="+233 XX XXX XXXX"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <Button variant="outline" onClick={() => setShowMaintenanceConfig(false)}>Cancel</Button>
                                <Button onClick={() => { saveMaintenanceConfig(); setShowMaintenanceConfig(false); }}>Save Configuration</Button>
                            </div>
                        </div>
                    )}

                    {maintenanceTab === 'schedule' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Schedule Section */}
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={18} /> Scheduled Maintenance
                                </h4>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={maintenanceDraft.scheduled?.enabled}
                                        onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, scheduled: { ...prev.scheduled!, enabled: e.target.checked } }))}
                                    />
                                    <span style={{ fontWeight: '600' }}>Enable Schedule</span>
                                </label>

                                {maintenanceDraft.scheduled?.enabled && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Start Time</label>
                                            <input
                                                type="datetime-local"
                                                className="input-field"
                                                value={maintenanceDraft.scheduled.start_time}
                                                onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, scheduled: { ...prev.scheduled!, start_time: e.target.value } }))}
                                                style={{ width: '100%', padding: '0.5rem' }}
                                            />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={maintenanceDraft.scheduled.auto_enable}
                                                    onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, scheduled: { ...prev.scheduled!, auto_enable: e.target.checked } }))}
                                                />
                                                Auto-activate at start
                                            </label>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>End Time</label>
                                            <input
                                                type="datetime-local"
                                                className="input-field"
                                                value={maintenanceDraft.scheduled.end_time}
                                                onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, scheduled: { ...prev.scheduled!, end_time: e.target.value } }))}
                                                style={{ width: '100%', padding: '0.5rem' }}
                                            />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={maintenanceDraft.scheduled.auto_disable}
                                                    onChange={(e) => setMaintenanceDraft(prev => ({ ...prev, scheduled: { ...prev.scheduled!, auto_disable: e.target.checked } }))}
                                                />
                                                Auto-disable at end
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Warning Activation Section */}
                            {!settings.maintenance_mode && (
                                <div style={{ background: '#fff0f0', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #fecaca' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                                        <Bell size={18} /> Broadcast Warning & Activate
                                    </h4>
                                    <p style={{ fontSize: '0.9rem', color: '#b91c1c', marginBottom: '1rem' }}>
                                        Send a warning to all active users before activating maintenance mode.
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'end', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Warning Period (Minutes)</label>
                                            <Input
                                                type="number"
                                                value={warningMinutes}
                                                onChange={(e) => setWarningMinutes(parseInt(e.target.value) || 0)}
                                                min="1"
                                            />
                                        </div>
                                        <Button onClick={activateWithWarning} style={{ background: '#dc2626', color: 'white', border: 'none' }}>
                                            <PlayCircle size={16} /> Activate with Warning
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <Button variant="outline" onClick={() => setShowMaintenanceConfig(false)}>
                                    Close
                                </Button>
                                <Button onClick={() => { saveMaintenanceConfig(); setShowMaintenanceConfig(false); }}>
                                    Save Schedule Only
                                </Button>
                            </div>
                        </div>
                    )}

                    {maintenanceTab === 'exemptions' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', color: '#166534' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    <ShieldAlert size={18} /> Bypass Access
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                    Configure who can access the system while maintenance mode is active. Super Admins are always exempt.
                                </p>
                            </div>

                            {/* Roles Selection */}
                            <div>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Exempt Roles</h4>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={true}
                                            disabled
                                        />
                                        Super Admin (Always)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={maintenanceDraft.exemptions?.roles.includes('agent')}
                                            onChange={(e) => {
                                                const newRoles = e.target.checked
                                                    ? [...(maintenanceDraft.exemptions?.roles || []), 'agent']
                                                    : (maintenanceDraft.exemptions?.roles || []).filter(r => r !== 'agent');
                                                setMaintenanceDraft(prev => ({ ...prev, exemptions: { ...prev.exemptions!, roles: newRoles } }));
                                            }}
                                        />
                                        support_agent
                                    </label>
                                </div>
                            </div>

                            {/* Emails */}
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Specific User Emails</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    Enter email addresses separated by commas to allow specific users access.
                                </p>
                                <textarea
                                    className="input-field"
                                    value={maintenanceDraft.exemptions?.emails.join(', ')}
                                    onChange={(e) => {
                                        const emails = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                        setMaintenanceDraft(prev => ({ ...prev, exemptions: { ...prev.exemptions!, emails } }));
                                    }}
                                    placeholder="student@ucc.edu.gh, another.user@example.com"
                                    rows={4}
                                    style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <Button variant="outline" onClick={() => setShowMaintenanceConfig(false)}>Cancel</Button>
                                <Button onClick={() => { saveMaintenanceConfig(); setShowMaintenanceConfig(false); }}>
                                    Save Rules
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        )
    );

    return (
        <div className="command-center fade-in">
            <div className="cc-tabs">
                <button className={`cc-tab ${activeTab === 'controls' ? 'active' : ''}`} onClick={() => setActiveTab('controls')}>Controls</button>
                <button className={`cc-tab ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}>Moderation</button>
                <button className={`cc-tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>Audit Logs</button>
            </div>

            <div className="cc-tab-content">
                {activeTab === 'controls' && (
                    <div className="fade-in">
                        {renderHealthMonitor()}
                        {renderControls()}
                    </div>
                )}
                {activeTab === 'moderation' && renderModeration()}
                {activeTab === 'audit' && renderAuditLogs()}
            </div>

            {/* Maintenance Configuration Modal */}
            {renderMaintenanceModal()}
        </div>
    );
};

export default CommandCenter;
