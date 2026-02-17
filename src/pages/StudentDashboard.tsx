import React, { useState, useEffect, ChangeEvent } from 'react';
import { io } from 'socket.io-client';
import { useNavigate, Link } from 'react-router-dom';
import {
    Clock,
    CheckCircle,
    MessageCircle,
    PlusCircle,
    Search,
    ChevronRight,
    AlertCircle,
    HelpCircle,
    User as UserIcon,
    Shield,
    AlertTriangle,
    Wrench,
    Mail,
    Phone,
    Bell,
} from 'lucide-react';
import { BASE_URL, api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTickets } from '../hooks/useTickets';
import { useUpdateAvatar } from '../hooks/useUsers';
import { generateDataExport } from '../lib/compliance';
import PrivacyCenter from '../components/PrivacyCenter';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import OnboardingTour from '../components/common/OnboardingTour';
import './StudentDashboard.css';

const StudentDashboard: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const { showInfo, showError, showWarning } = useToast();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showTour, setShowTour] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [showDataSettings, setShowDataSettings] = useState(false);
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [maintenanceConfig, setMaintenanceConfig] = useState<any>(null);
    const [maintenanceStartTime, setMaintenanceStartTime] = useState<number | null>(null);
    const [maintenanceWarning, setMaintenanceWarning] = useState<any>(null);
    const [isExempt, setIsExempt] = useState(false);
    const [subscribeEmail, setSubscribeEmail] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Fetch tickets using React Query
    const {
        data: tickets = [],
        isLoading: ticketsLoading,
        isFetching: ticketsFetching,
        isError: ticketsError,
        error: apiError
    } = useTickets({
        user: profile || user,
        role: 'student', // Explicitly specify student role to ensure correct query key
        enabled: !!user,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (ticketsFetching && !ticketsLoading) {
            setIsSyncing(true);
            const timer = setTimeout(() => setIsSyncing(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [ticketsFetching, ticketsLoading]);

    const { mutateAsync: updateAvatar } = useUpdateAvatar();

    const loading = ticketsLoading;

    // Use profile which should have the latest data including student_id and avatar_url
    const displayUser = profile || user;

    const avatarUrl = displayUser?.avatar_url
        ? (displayUser.avatar_url.startsWith('http') ? displayUser.avatar_url : `${BASE_URL}${displayUser.avatar_url}`)
        : null;

    // Check maintenance mode
    useEffect(() => {
        const checkMaintenanceMode = async () => {
            try {
                const settings = await api.system.getSettings();
                setMaintenanceMode(settings.maintenance_mode || false);
                setIsExempt(settings.is_exempt || false);
                setMaintenanceConfig(settings.maintenance_config || null);
                // Set start time for countdown (using current time as proxy for start)
                if (settings.maintenance_mode) {
                    setMaintenanceStartTime(Date.now());
                }
            } catch (err) {
                console.error('Failed to fetch system settings:', err);
            } finally {
                setLoadingSettings(false);
            }
        };
        checkMaintenanceMode();
    }, []);

    useEffect(() => {
        const newSocket = io(BASE_URL);

        newSocket.on('maintenance-warning', (data: any) => {
            setMaintenanceWarning(data);
            showWarning(`System Maintenance: ${data.message} in ${data.minutes_until} minutes.`);
        });

        newSocket.on('maintenance-activated', () => {
            api.system.getSettings().then(settings => {
                setMaintenanceMode(true);
                setMaintenanceConfig(settings.maintenance_config);
                setMaintenanceStartTime(Date.now());
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        const installedHandler = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    };

    useEffect(() => {
        if (user && profile && profile.has_completed_tour === false) {
            setShowTour(true);
        }
    }, [user, profile]);

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length
    };

    const filteredTickets = tickets.filter(t =>
        (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (String(t.id) || '').includes(searchQuery)
    );


    const handleExportData = () => {
        const userData = {
            profile: displayUser,
            tickets: tickets,
            messages: []
        };
        const blob = generateDataExport(userData);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ucc-helpdesk-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDeleteAccount = () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.")) {
            showInfo("Account deletion request submitted. An admin will process this within 7 days.");
        }
    };

    const handleAvatarUpdate = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) {
            showError('Image size must be less than 5MB');
            return;
        }

        try {
            setUpdatingProfile(true);
            await updateAvatar({ id: user.id, file });
            await refreshProfile();
        } catch (err) {
            console.error('Avatar update failed:', err);
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleSubscribe = async () => {
        if (!subscribeEmail || !subscribeEmail.includes('@')) {
            showError('Please enter a valid email address');
            return;
        }

        try {
            setIsSubscribing(true);
            await api.maintenance.subscribe(subscribeEmail);
            setIsSubscribed(true);
            showInfo('You will be notified when the system is back online.');
            setSubscribeEmail('');
        } catch (err) {
            console.error('Subscription failed:', err);
            showError('Failed to subscribe to updates.');
        } finally {
            setIsSubscribing(false);
        }
    };


    // Show maintenance screen if maintenance mode is active
    if (maintenanceMode && !isExempt) {
        // Calculate time remaining for countdown
        const [timeRemaining, setTimeRemaining] = React.useState(0);

        React.useEffect(() => {
            if (maintenanceConfig?.show_countdown && maintenanceStartTime) {
                const interval = setInterval(() => {
                    const endTime = maintenanceStartTime + (maintenanceConfig.estimated_duration_minutes * 60 * 1000);
                    const remaining = Math.max(0, endTime - Date.now());
                    setTimeRemaining(remaining);
                }, 1000);
                return () => clearInterval(interval);
            }
        }, [maintenanceStartTime]);

        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        return (
            <div className="maintenance-screen" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2rem'
            }}>
                <Card style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem 2rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <Wrench size={64} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-dark)' }}>
                        {maintenanceConfig?.message_title || 'System Under Maintenance'}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        {maintenanceConfig?.message_body || 'We\'re currently performing system maintenance to improve your experience. Please check back shortly.'}
                    </p>

                    {/* Countdown Timer */}
                    {maintenanceConfig?.show_countdown && timeRemaining > 0 && (
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            marginBottom: '1.5rem',
                            color: 'white'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Clock size={20} />
                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Estimated Time Remaining</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                            </div>
                        </div>
                    )}

                    {/* Contact Information */}
                    {maintenanceConfig?.contact_info?.show_contact && (
                        <div style={{
                            background: '#f8fafc',
                            borderRadius: '0.75rem',
                            padding: '1.25rem',
                            textAlign: 'left',
                            marginBottom: '1.5rem'
                        }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                                <HelpCircle size={16} /> Need urgent help?
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {maintenanceConfig.contact_info.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                        <Mail size={16} />
                                        <a href={`mailto:${maintenanceConfig.contact_info.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                            {maintenanceConfig.contact_info.email}
                                        </a>
                                    </div>
                                )}
                                {maintenanceConfig.contact_info.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                        <Phone size={16} />
                                        <a href={`tel:${maintenanceConfig.contact_info.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                            {maintenanceConfig.contact_info.phone}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Subscription Section */}
                    {
                        !isSubscribed ? (
                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Get Notified
                                </h4>
                                <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px', margin: '0 auto' }}>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={subscribeEmail}
                                        onChange={(e) => setSubscribeEmail(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #cbd5e1',
                                            outline: 'none'
                                        }}
                                    />
                                    <Button onClick={handleSubscribe} disabled={isSubscribing}>
                                        {isSubscribing ? '...' : <><Bell size={16} /> Notify Me</>}
                                    </Button>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                    We'll send a one-time email when the system is back online.
                                </p>
                            </div>
                        ) : (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', color: '#15803d', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={24} />
                                <strong>You're subscribed!</strong>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>We'll notify you as soon as we're back.</p>
                            </div>
                        )
                    }



                    <div style={{
                        background: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        marginBottom: '1.5rem'
                    }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                            <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            All existing tickets are safe and will be available once maintenance is complete.
                        </p>
                    </div>
                    <Link to="/login">
                        <Button variant="outline" size="lg">
                            Return to Login
                        </Button>
                    </Link>
                </Card >
            </div >
        );
    }

    return (
        <div className="container student-dashboard">
            {maintenanceMode && isExempt && (
                <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '0.75rem', textAlign: 'center', color: '#166534', marginBottom: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Shield size={18} />
                        <span><strong>Maintenance Bypass Active:</strong> You have special access to the system during maintenance.</span>
                    </div>
                </div>
            )}
            {maintenanceWarning && (
                <div style={{ background: '#fffbeb', borderBottom: '1px solid #fcd34d', padding: '0.75rem', textAlign: 'center', color: '#92400e', marginBottom: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={18} />
                        <span><strong>System Warning:</strong> {maintenanceWarning.message} (Approx. {maintenanceWarning.minutes_until} mins)</span>
                    </div>
                </div>
            )}
            {showTour && <OnboardingTour role="student" onComplete={() => setShowTour(false)} />}
            <header className="dashboard-header">
                <div className="header-greeting">
                    <div className="profile-pill">
                        <div className="pill-avatar">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="" />
                            ) : (
                                <UserIcon size={14} />
                            )}
                        </div>
                        <span className="pill-text">Welcome back, <strong>{displayUser?.full_name || displayUser?.email?.split('@')[0]}</strong></span>
                    </div>
                    <div className="user-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <h2>Hello, {displayUser?.full_name?.split(' ')[0] || 'Member'}!</h2>
                            <div className={`live-indicator ${isSyncing ? 'syncing' : ''}`}>
                                <div className="live-dot" />
                                <span>{isSyncing ? 'Syncing...' : 'Live Dashboard'}</span>
                            </div>
                        </div>
                        <p className="subtitle">Everything you need to manage your UCC support requests.</p>
                    </div>
                </div>

                <div className="header-actions">
                    {isInstallable && (
                        <Button
                            variant="outline"
                            className="install-app-btn"
                            onClick={handleInstallClick}
                            style={{ borderRadius: '12px' }}
                        >
                            <PlusCircle size={20} /> Install App
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowDataSettings(!showDataSettings)} className="privacy-btn" style={{ borderRadius: '12px' }}>
                        <Shield size={16} /> Privacy
                    </Button>
                    <Link to="/submit-ticket">
                        <Button className="new-ticket-btn">
                            <PlusCircle size={20} /> New Request
                        </Button>
                    </Link>
                </div>
            </header>

            {showDataSettings && (
                <PrivacyCenter
                    user={displayUser}
                    tickets={tickets}
                    onExport={handleExportData}
                    onDeleteAccount={handleDeleteAccount}
                    onClose={() => setShowDataSettings(false)}
                />
            )}

            {/* Quick Stats & Profile */}
            <div className="dashboard-top-section">
                <Card className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar" style={{
                            background: avatarUrl ? 'white' : 'var(--primary-light)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white'
                        }}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <span style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                    {displayUser?.full_name?.charAt(0) || displayUser?.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <div className="profile-info">
                            <h3 style={{ textTransform: 'capitalize' }}>
                                {displayUser?.full_name || displayUser?.email?.split('@')[0] || 'UCC Student'}
                            </h3>
                            <p className="student-id">Student ID: {displayUser?.student_id || 'N/A'}</p>
                            <p className="student-email">{displayUser?.email}</p>
                            <div style={{ marginTop: '0.5rem' }}>
                                <label htmlFor="avatar-update-input" className="sr-only" style={{ display: 'none' }}>Update Profile Picture</label>
                                <input
                                    type="file"
                                    id="avatar-update-input"
                                    hidden
                                    accept="image/*"
                                    onChange={handleAvatarUpdate}
                                    disabled={updatingProfile}
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    style={{ fontSize: '0.75rem', height: 'auto', padding: '4px 8px' }}
                                    onClick={() => document.getElementById('avatar-update-input')?.click()}
                                    disabled={updatingProfile}
                                >
                                    {updatingProfile ? 'Uploading...' : 'Change Photo'}
                                </Button>
                            </div>
                            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                                <Link to="/faq" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <HelpCircle size={14} /> Need help? Visit FAQ
                                </Link>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon icon-blue"><Clock size={28} /></div>
                        <div className="stat-content">
                            <h3>{stats.total}</h3>
                            <p>Total Submissions</p>
                        </div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-icon icon-yellow"><AlertCircle size={28} /></div>
                        <div className="stat-content">
                            <h3>{stats.open}</h3>
                            <p>Active Tickets</p>
                        </div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-icon icon-green"><CheckCircle size={28} /></div>
                        <div className="stat-content">
                            <h3>{stats.resolved}</h3>
                            <p>Resolved Cases</p>
                        </div>
                    </Card>
                </div>
            </div>

            <main className="dashboard-main fade-in-up">
                <Card className="tickets-list-card">
                    <div className="card-header-actions">
                        <div className="section-title">
                            <h2>Your Support History</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Track and manage your submitted concerns</p>
                        </div>
                        <div className="search-bar">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Filter cases by subject or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {ticketsError && tickets.length === 0 ? (
                        <div className="empty-state error-state">
                            <AlertCircle size={48} color="var(--danger)" />
                            <p>Failed to load your tickets</p>
                            <span className="error-message">{String(apiError?.message || apiError || 'Unknown connection error')}</span>
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
                                Try Again
                            </Button>
                        </div>
                    ) : (ticketsLoading && tickets.length === 0) ? (
                        <div className="empty-state">
                            <Clock className="animate-spin" size={48} />
                            <p>Loading your tickets...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="empty-state">
                            <MessageCircle size={48} />
                            <p>No tickets found. Have a concern?</p>
                            <Link to="/submit-ticket">Submit your first ticket</Link>
                        </div>
                    ) : (
                        <div className="tickets-table-wrapper">
                            <table className="tickets-table">
                                <thead>
                                    <tr>
                                        <th>Ticket ID</th>
                                        <th>Subject</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map(ticket => (
                                        <tr key={ticket.id}>
                                            <td className="font-mono text-sm">{String(ticket.id).substring(0, 8)}...</td>
                                            <td className="ticket-subject">{ticket.subject}</td>
                                            <td><span className="cat-badge">{ticket.type}</span></td>
                                            <td>
                                                <span className={`status-pill status-${(ticket.status || '').toLowerCase().replace(' ', '-')}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="details-link"
                                                    onClick={() => navigate(`/track-ticket?id=${ticket.id}`)}
                                                >
                                                    View Case <ChevronRight size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
};

export default StudentDashboard;
