import React, { useState, useEffect, ChangeEvent } from 'react';
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
} from 'lucide-react';
import { BASE_URL } from '../lib/api';
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
    const { showInfo, showError } = useToast();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showTour, setShowTour] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [showDataSettings, setShowDataSettings] = useState(false);
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Fetch tickets using React Query
    const { data: tickets = [], isLoading: ticketsLoading } = useTickets({
        user: profile || user,
        role: 'student', // Explicitly specify student role to ensure correct query key
        enabled: !!user,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const { mutateAsync: updateAvatar } = useUpdateAvatar();

    const loading = ticketsLoading;

    // Use profile which should have the latest data including student_id and avatar_url
    const displayUser = profile || user;

    const avatarUrl = displayUser?.avatar_url
        ? (displayUser.avatar_url.startsWith('http') ? displayUser.avatar_url : `${BASE_URL}${displayUser.avatar_url}`)
        : null;

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
            tickets: tickets
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


    return (
        <div className="container student-dashboard">
            {showTour && <OnboardingTour role="student" onComplete={() => setShowTour(false)} />}
            <header className="dashboard-header">
                <div className="header-greeting">
                    <div className="profile-pill">
                        <div className="pill-avatar">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="" />
                            ) : (
                                <UserIcon size={16} />
                            )}
                        </div>
                        <span className="pill-text">Welcome back, <strong>{displayUser?.full_name || displayUser?.email?.split('@')[0]}</strong></span>
                    </div>
                    <div className="user-info">
                        <h2>Hello, {displayUser?.full_name?.split(' ')[0] || 'Student'}! 👋</h2>
                        <p className="subtitle">Here's what's happening with your support requests.</p>
                    </div>
                </div>

                <div className="header-actions">
                    {isInstallable && (
                        <Button
                            variant="outline"
                            className="install-app-btn"
                            onClick={handleInstallClick}
                        >
                            <PlusCircle size={20} /> Install App
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowDataSettings(!showDataSettings)} className="privacy-btn">
                        <Shield size={16} /> {showDataSettings ? 'Hide Privacy' : 'My Data'}
                    </Button>
                    <Link to="/submit-ticket">
                        <Button className="new-ticket-btn">
                            <PlusCircle size={20} /> New Ticket
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
                        <div className="stat-icon icon-blue"><Clock size={24} /></div>
                        <div className="stat-content">
                            <h3>{stats.total}</h3>
                            <p>Total Requests</p>
                        </div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-icon icon-yellow"><AlertCircle size={24} /></div>
                        <div className="stat-content">
                            <h3>{stats.open}</h3>
                            <p>Pending Issues</p>
                        </div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-icon icon-green"><CheckCircle size={24} /></div>
                        <div className="stat-content">
                            <h3>{stats.resolved}</h3>
                            <p>Resolved</p>
                        </div>
                    </Card>
                </div>
            </div>

            <main className="dashboard-main">
                <Card className="tickets-list-card">
                    <div className="card-header-actions">
                        <h2>Your Support Tickets</h2>
                        <div className="search-bar">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by subject or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {filteredTickets.length === 0 ? (
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
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/track-ticket?id=${ticket.id}`)}
                                                >
                                                    View Details <ChevronRight size={16} />
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
