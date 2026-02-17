import React, { useState, useEffect, memo } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap,
    LogOut,
    Sparkles,
    User as UserIcon,
    LayoutDashboard,
    Users,
    Shield,
    Terminal,
    Settings,
    Download,
    BarChart2,
    BookOpen,
    HelpCircle,
    CheckCircle,
    Bell,
    Wrench,
    Clock,
    Mail,
    Phone,
    AlertTriangle
} from 'lucide-react';
import { api, BASE_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { analyzeTicketAI } from '../lib/ai';
import { useSettings } from '../contexts/SettingsContext';
import { useTickets, useUpdateTicket, useResolveTicket, useDeleteTicket, useAssignTicket } from '../hooks/useTickets';
import { useUsers } from '../hooks/useUsers';
import Button from '../components/common/Button';
import Analytics from '../components/Analytics';
import PredictiveInsights from '../components/PredictiveInsights';
import AccessibilityChecker from '../components/common/AccessibilityChecker';
import ComplianceOverview from '../components/ComplianceOverview';
import AdminSettings from '../components/AdminSettings';
import { requestNotificationPermission } from '../lib/notifications';
import Card from '../components/common/Card';
import OnboardingTour from '../components/common/OnboardingTour';
import CommandCenter from '../components/CommandCenter';
import KnowledgeBaseManager from '../components/KnowledgeBaseManager';
import FAQManager from '../components/admin/FAQManager';
import TicketsView from '../components/admin/TicketsView';
import TeamView from '../components/admin/TeamView';
import { Ticket, User } from '../types';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
    const { user, profile, signOut, impersonateUser } = useAuth();
    const queryClient = useQueryClient();

    // Fetch tickets with React Query
    const {
        data: tickets = [],
        isLoading: ticketsLoading,
        isError: ticketsError,
        error: apiError
    } = useTickets({
        user: profile,
        refetchInterval: 30000
    });

    // Fetch agents with React Query
    const { data: agents = [] } = useUsers('agent,super_admin', {
        enabled: profile?.role === 'agent' || profile?.role === 'super_admin'
    });

    // Mutations
    const { resolveTicket } = useResolveTicket();
    const { mutateAsync: deleteTicket } = useDeleteTicket();
    const { assignTicket } = useAssignTicket();
    const { mutateAsync: updateTicket } = useUpdateTicket();

    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('tickets');
    const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showTour, setShowTour] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [maintenanceWarning, setMaintenanceWarning] = useState<any>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [isExempt, setIsExempt] = useState(false);
    const [maintenanceConfig, setMaintenanceConfig] = useState<any>(null);
    const [subscribeEmail, setSubscribeEmail] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const { showSuccess, showError, showWarning } = useToast();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };



    useEffect(() => {
        if (profile && profile.has_completed_tour === false) {
            setShowTour(true);
        }
        requestNotificationPermission();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [profile]);

    useEffect(() => {
        const checkMaintenanceMode = async () => {
            try {
                const settings = await api.system.getSettings();
                setMaintenanceMode(settings.maintenance_mode || false);
                setIsExempt(settings.is_exempt || false);
                setMaintenanceConfig(settings.maintenance_config || null);
            } catch (err) {
                console.error('Failed to fetch system settings:', err);
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

        // Admins don't get kicked out, but we could notify them
        newSocket.on('maintenance-activated', () => {
            showSuccess("System has entered maintenance mode.");
            // Optionally refresh settings context if used
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const handleResolve = async (id: string) => {
        await resolveTicket(id);
    };

    const handleDeleteTicket = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;
        try {
            await deleteTicket(id);
        } catch (error) {
            // Handled by hook
        }
    };

    const handleAssign = async (ticketId: string, agentEmail = user?.email || '') => {
        if (!agentEmail) return;
        await assignTicket(ticketId, agentEmail);
    };



    const filteredTickets = tickets.filter(ticket => {
        const subject = (ticket.subject || '').toLowerCase();
        const studentName = (ticket.full_name || '').toLowerCase();
        const ticketId = (ticket.id || '').toString();
        const search = searchTerm.toLowerCase();

        const matchesSearch = subject.includes(search) ||
            studentName.includes(search) ||
            ticketId.includes(search);

        const matchesStatus = filter === 'all' || (ticket.status || '').toLowerCase() === filter.toLowerCase();
        const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const toggleSelectAll = () => {
        if (selectedTicketIds.length === filteredTickets.length) {
            setSelectedTicketIds([]);
        } else {
            setSelectedTicketIds(filteredTickets.map(t => t.id));
        }
    };

    const toggleSelectTicket = (id: string) => {
        setSelectedTicketIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedTicketIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedTicketIds.length} tickets?`)) return;

        setIsBulkUpdating(true);
        try {
            for (const id of selectedTicketIds) {
                await deleteTicket(id);
                if (false && id) { } // Keep for reference if needed, but unused for local state now
            }
            setSelectedTicketIds([]);
            showSuccess('Selected tickets deleted successfully');
        } catch (err: any) {
            console.error('Bulk delete error:', err);
            showError(`Failed to delete some tickets: ${err.message}`);
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleExport = () => {
        const headers = ['ID', 'Student', 'Subject', 'Status', 'Priority', 'Assigned To', 'Date'];
        const csvContent = [
            headers.join(','),
            ...filteredTickets.map(t => [
                t.id, `"${t.full_name}"`, `"${t.subject}"`, t.status, t.priority, t.assigned_to_email || '', new Date(t.created_at).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            showSuccess('You will be notified when the system is back online.');
            setSubscribeEmail('');
        } catch (err) {
            console.error('Subscription failed:', err);
            showError('Failed to subscribe to updates.');
        } finally {
            setIsSubscribing(false);
        }
    };

    // Show maintenance screen if maintenance mode is active and user is NOT exempt
    if (maintenanceMode && !isExempt) {
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
                        {maintenanceConfig?.message_body || 'We\'re currently performing system maintenance to improve your experience. Agents are restricted at this time.'}
                    </p>

                    {maintenanceConfig?.contact_info?.show_contact && (
                        <div style={{ marginTop: '2rem', textAlign: 'left', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem' }}>
                            <h4 style={{ marginTop: 0 }}>Emergency Contact</h4>
                            {maintenanceConfig.contact_info.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Mail size={16} /> {maintenanceConfig.contact_info.email}
                                </div>
                            )}
                            {maintenanceConfig.contact_info.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={16} /> {maintenanceConfig.contact_info.phone}
                                </div>
                            )}
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

                    <div style={{ marginTop: '2rem' }}>
                        <Button variant="outline" onClick={handleLogout}>Log Out</Button>
                    </div>
                </Card >
            </div >
        );
    }

    return (
        <div className="dashboard-layout fade-in">
            {maintenanceMode && isExempt && (
                <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '0.75rem', textAlign: 'center', color: '#166534', position: 'sticky', top: 0, zIndex: 1000 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Shield size={18} />
                        <span><strong>Maintenance Bypass Active:</strong> You have special access ({profile?.role}) during maintenance.</span>
                    </div>
                </div>
            )}
            {maintenanceWarning && (
                <div style={{ background: '#fffbeb', borderBottom: '1px solid #fcd34d', padding: '0.75rem', textAlign: 'center', color: '#92400e', position: 'sticky', top: 0, zIndex: 1000 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span role="img" aria-label="warning">⚠️</span>
                        <span><strong>System Warning:</strong> {maintenanceWarning.message} (Approx. {maintenanceWarning.minutes_until} mins)</span>
                    </div>
                </div>
            )}
            {showTour && <OnboardingTour role={profile?.role === 'super_admin' ? 'super_admin' : 'agent'} onComplete={() => setShowTour(false)} />}

            <header className="admin-top-bar">
                <div className="top-bar-left">
                    <div className="brand-pill">
                        <GraduationCap size={20} />
                        <span>CoDE Admin</span>
                    </div>
                </div>

                <div className="top-bar-right">
                    <div className="admin-profile-section">
                        <div className="profile-info">
                            <span className="profile-name">{profile?.full_name || user?.email?.split('@')[0] || 'Admin'}</span>
                            <span className="profile-role">{(profile?.role || 'agent').replace('_', ' ')}</span>
                        </div>
                        <div className="profile-avatar-small">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url.startsWith('http') ? profile.avatar_url : `${BASE_URL}${profile.avatar_url}`} alt="" />
                            ) : (
                                <UserIcon size={16} />
                            )}
                        </div>
                    </div>
                    <div className="top-actions">
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="top-logout-btn">
                            <LogOut size={16} />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content-wrapper">
                <div className="content-page-header">
                    <div className="header-titles">
                        <h1>{(activeTab === 'kb' ? 'Knowledge Base' : (activeTab || 'Dashboard').charAt(0).toUpperCase() + (activeTab || 'Dashboard').slice(1))}</h1>
                        <p>Welcome back, {profile?.full_name || 'Coordinator'}</p>
                    </div>

                    <div className="header-status-pill">
                        <div className="pulse-dot green"></div>
                        <span>Live Sync Active</span>
                    </div>
                </div>

                <nav className="admin-main-nav">
                    <div className="nav-group">
                        <Button
                            variant={activeTab === 'tickets' ? "primary" : "ghost"}
                            onClick={() => setActiveTab('tickets')}
                            className={activeTab === 'tickets' ? 'nav-active' : ''}
                        >
                            <LayoutDashboard size={18} /> <span>Tickets</span>
                        </Button>
                        <Button
                            variant={activeTab === 'kb' ? "primary" : "ghost"}
                            onClick={() => setActiveTab('kb')}
                        >
                            <BookOpen size={18} /> <span>Knowledge Base</span>
                        </Button>
                        <Button
                            variant={activeTab === 'ai' ? "primary" : "ghost"}
                            onClick={() => setActiveTab('ai')}
                        >
                            <Sparkles size={18} /> <span>AI Assistant</span>
                        </Button>
                        <Button
                            variant={activeTab === 'compliance' ? "primary" : "ghost"}
                            onClick={() => setActiveTab('compliance')}
                        >
                            <Shield size={18} /> <span>Compliance</span>
                        </Button>
                        {profile?.role === 'super_admin' && (
                            <>
                                <Button variant={activeTab === 'team' ? "primary" : "ghost"} onClick={() => setActiveTab('team')}>
                                    <Users size={18} /> <span>Team</span>
                                </Button>
                                <Button variant={activeTab === 'command' ? "primary" : "ghost"} onClick={() => setActiveTab('command')}>
                                    <Terminal size={18} /> <span>Command</span>
                                </Button>
                                <Button variant={activeTab === 'settings' ? "primary" : "ghost"} onClick={() => setActiveTab('settings')}>
                                    <Settings size={18} /> <span>Settings</span>
                                </Button>
                                <Button variant={activeTab === 'faq' ? "primary" : "ghost"} onClick={() => setActiveTab('faq')}>
                                    <HelpCircle size={18} /> <span>FAQ Manager</span>
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="nav-actions">
                        <Button variant="secondary" size="sm" onClick={() => setShowAnalytics(!showAnalytics)}>
                            <BarChart2 size={16} /> <span>{showAnalytics ? 'Hide Analytics' : 'Analytics'}</span>
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleExport}>
                            <Download size={16} /> <span>Export</span>
                        </Button>
                    </div>
                </nav>

                <div className="stats-strip">
                    <div className="mini-stat">
                        <span className="mini-stat-label">Assigned</span>
                        <div className="mini-stat-value">{tickets.filter(t => t.assigned_to_email === user?.email).length}</div>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-stat-label">Pending</span>
                        <div className="mini-stat-value text-blue">{tickets.filter(t => t.status === 'Open').length}</div>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-stat-label">Urgent</span>
                        <div className="mini-stat-value text-orange">{tickets.filter(t => t.status === 'Open' && t.priority === 'Urgent').length}</div>
                    </div>
                </div>

                <div className="admin-views-container">
                    {showAnalytics && <div className="analytics-section"><Analytics tickets={tickets} /></div>}
                    {activeTab === 'command' && <CommandCenter />}
                    {activeTab === 'ai' && <PredictiveInsights />}
                    {activeTab === 'compliance' && <ComplianceOverview tickets={tickets} />}
                    {activeTab === 'kb' && <KnowledgeBaseManager />}
                    {activeTab === 'faq' && <FAQManager />}
                    {activeTab === 'settings' && <AdminSettings />}
                    {ticketsError ? (
                        <Card className="error-card" style={{ borderColor: 'var(--danger-border)', backgroundColor: 'var(--danger-bg-subtle)' }}>
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Shield size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
                                <h2 style={{ color: 'var(--danger)' }}>Data Sync Error</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                                    {(apiError as any)?.message || 'We could not sync with the helpdesk servers. Please check your connection or login again.'}
                                </p>
                                <Button onClick={() => window.location.reload()} variant="primary">
                                    Refresh Dashboard
                                </Button>
                            </div>
                        </Card>
                    ) : activeTab === 'tickets' && (
                        <TicketsView
                            tickets={filteredTickets}
                            isLoading={ticketsLoading}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            filter={filter}
                            setFilter={setFilter}
                            priorityFilter={priorityFilter}
                            setPriorityFilter={setPriorityFilter}
                            selectedTicketIds={selectedTicketIds}
                            toggleSelectAll={toggleSelectAll}
                            toggleSelectTicket={toggleSelectTicket}
                            onBulkDelete={handleBulkDelete}
                            onSelectTicket={() => { }} // No longer using modal
                            onResolve={handleResolve}
                            onDelete={handleDeleteTicket}
                            onAssign={handleAssign}
                            onImpersonate={async (id) => {
                                if (id) {
                                    await impersonateUser(id);
                                    navigate('/dashboard');
                                }
                            }}
                            agents={agents}
                            profile={profile}
                            currentTime={currentTime}
                        />
                    )}
                    {activeTab === 'team' && <TeamView agents={agents} profile={profile} />}
                </div>
            </div>

            <AccessibilityChecker />
        </div>
    );
};

export default memo(AdminDashboard);
