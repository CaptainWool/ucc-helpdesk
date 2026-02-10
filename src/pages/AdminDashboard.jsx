import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GraduationCap, CheckCircle, ExternalLink, LogOut, Sparkles, Eye, User, LayoutDashboard, Users, Shield, Terminal, Settings, Download, BarChart2, Trash2, BookOpen } from 'lucide-react';
import { api, BASE_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { analyzeTicketAI } from '../lib/ai';
import { useSettings } from '../contexts/SettingsContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import TicketChat from '../components/TicketChat';
import Analytics from '../components/Analytics';
import AIIntelligencePanel from '../components/AIIntelligencePanel';
import PredictiveInsights from '../components/PredictiveInsights';
import AccessibilityChecker from '../components/common/AccessibilityChecker';
import ComplianceOverview from '../components/ComplianceOverview';
import AdminSettings from '../components/AdminSettings';
import { requestNotificationPermission, sendNotification } from '../lib/notifications';
import OnboardingTour from '../components/common/OnboardingTour';
import CommandCenter from '../components/CommandCenter';
import KnowledgeBaseManager from '../components/KnowledgeBaseManager';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [agents, setAgents] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'team'
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [selectedTicketIds, setSelectedTicketIds] = useState([]);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showTour, setShowTour] = useState(false);

    // AI State
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [ticketMessages, setTicketMessages] = useState([]);

    const { user, profile, signOut, impersonateUser } = useAuth();
    const { settings, updateSetting } = useSettings();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTickets();
        if (profile?.role === 'agent' || profile?.role === 'super_admin') {
            fetchAgents();
        }

        // Check for tour
        if (profile && profile.has_completed_tour === false) {
            setShowTour(true);
        }

        // Realtime replacement: Polling for new tickets every 30 seconds
        const pollInterval = setInterval(() => {
            fetchTickets();
        }, 30000);

        // Request notification permission
        requestNotificationPermission();

        // Update time every second for SLA countdown
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        return () => {
            clearInterval(pollInterval);
            clearInterval(timer);
        };
    }, [profile]);

    // Reset analysis when ticket changes
    useEffect(() => {
        setAiAnalysis(null);
        // Prevent body scroll when modal is open
        if (selectedTicket) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [selectedTicket]);

    const fetchTickets = async () => {
        try {
            const data = await api.tickets.list();
            setTickets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };

    const fetchAgents = async () => {
        try {
            const data = await api.auth.getUsers('agent,super_admin');
            setAgents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching agents:', error);
        }
    };

    const handleResolve = async (id) => {
        try {
            await api.tickets.update(id, { status: 'Resolved' });
            fetchTickets();
        } catch (error) {
            console.error('Error updating ticket:', error);
            alert('Failed to update ticket status');
        }
    };

    const handleDeleteTicket = async (id) => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;
        try {
            await api.tickets.delete(id);
            if (selectedTicket?.id === id) {
                setSelectedTicket(null);
            }
            fetchTickets();
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert(`Failed to delete ticket: ${error.message || error.error || 'Server error'}`);
        }
    };

    const handleAssign = async (ticketId, agentEmail = user.email) => {
        try {
            await api.tickets.update(ticketId, { assigned_to_email: agentEmail });
            fetchTickets();
        } catch (error) {
            console.error('Error assigning ticket:', error);
            alert('Failed to assign ticket');
        }
    };

    const handlePriorityChange = async (ticketId, newPriority) => {
        try {
            await api.tickets.update(ticketId, { priority: newPriority });
            fetchTickets();
        } catch (error) {
            console.error('Error updating priority:', error);
            alert('Failed to update priority');
        }
    };

    const handleDepartmentChange = async (agentId, department) => {
        try {
            await api.auth.updateUser(agentId, { department });
            fetchAgents();
        } catch (error) {
            console.error('Error updating department:', error);
            alert('Failed to update department');
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleAnalyzeTicket = async () => {
        if (!selectedTicket) return;
        setAnalyzing(true);
        try {
            const result = await analyzeTicketAI(selectedTicket.subject, selectedTicket.description);
            setAiAnalysis(result);

            // Auto-update priority based on AI analysis
            if (result && result.priority) {
                const priorityMap = { 'P1': 'Urgent', 'P2': 'High', 'P3': 'Medium', 'P4': 'Low', 'Urgent': 'Urgent', 'High': 'High', 'Medium': 'Medium', 'Low': 'Low' };
                const dbPriority = priorityMap[result.priority] || result.priority;
                await handlePriorityChange(selectedTicket.id, dbPriority);
            }
        } catch (error) {
            console.error('AI Analysis failed:', error);
            alert(`AI Analysis Error: ${error.message || "Could not complete analysis"}`);
        } finally {
            setAnalyzing(false);
        }
    };

    // Bulk Action Handlers
    const toggleSelectAll = () => {
        if (selectedTicketIds.length === filteredTickets.length) {
            setSelectedTicketIds([]);
        } else {
            setSelectedTicketIds(filteredTickets.map(t => t.id));
        }
    };

    const toggleSelectTicket = (id) => {
        setSelectedTicketIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkResolve = async () => {
        if (selectedTicketIds.length === 0) return;
        setIsBulkUpdating(true);
        try {
            // Sequential updates as the current API might not support bulk update directly
            for (const id of selectedTicketIds) {
                await api.tickets.update(id, {
                    status: 'Resolved',
                    resolved_at: new Date().toISOString()
                });
            }
            setSelectedTicketIds([]);
            fetchTickets();
        } catch (err) {
            console.error('Bulk resolve error:', err);
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleBulkAssign = async () => {
        if (selectedTicketIds.length === 0) return;
        setIsBulkUpdating(true);
        try {
            for (const id of selectedTicketIds) {
                await api.tickets.update(id, { assigned_to_email: user.email });
            }
            setSelectedTicketIds([]);
            fetchTickets();
        } catch (err) {
            console.error('Bulk assign error:', err);
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTicketIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedTicketIds.length} tickets?`)) return;

        setIsBulkUpdating(true);
        try {
            for (const id of selectedTicketIds) {
                await api.tickets.delete(id);
                if (selectedTicket?.id === id) {
                    setSelectedTicket(null);
                }
            }
            setSelectedTicketIds([]);
            fetchTickets();
            alert('Selected tickets deleted successfully');
        } catch (err) {
            console.error('Bulk delete error:', err);
            alert(`Failed to delete tickets: ${err.message || 'Check your permissions.'}`);
            fetchTickets(); // Refresh anyway to show what's left
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
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getSLAStatus = (deadline, status) => {
        if (status === 'Resolved' || status === 'Closed') return { label: 'Met', class: 'sla-met' };
        if (!deadline) return { label: '--', class: 'sla-none' };

        const target = new Date(deadline);
        const diffMs = target - currentTime;

        if (diffMs < 0) return { label: 'BREACHED', class: 'sla-breached' };

        const totalSeconds = Math.floor(diffMs / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        // Return countdown format H:MM:SS
        const countdownLabel = `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;

        if (h < 2) return { label: countdownLabel, class: 'sla-critical' };
        if (h < 8) return { label: countdownLabel, class: 'sla-warning' };
        return { label: countdownLabel, class: 'sla-ok' };
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

    const renderAiAnalysis = () => {
        if (analyzing) return <p className="text-sm text-gray-500" style={{ marginTop: '1rem' }}>Thinking... <Sparkles size={12} className="inline-spin" /></p>;
        if (aiAnalysis) {
            return (
                <div className="ai-analysis-box" style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={14} /> AI Insights</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div><strong>Sentiment:</strong> {aiAnalysis.sentiment}</div>
                        <div><strong>Priority:</strong> {aiAnalysis.priority}</div>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#15803d', fontStyle: 'italic' }}>"{aiAnalysis.summary}"</p>
                </div>
            );
        }
        return <Button size="sm" variant="secondary" onClick={handleAnalyzeTicket} style={{ marginTop: '1rem' }}><Sparkles size={14} style={{ marginRight: '0.5rem' }} /> AI Analysis & Priority</Button>;
    };

    return (
        <div className="dashboard-layout fade-in">
            {showTour && <OnboardingTour role="admin" onComplete={() => setShowTour(false)} />}

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
                                <User size={16} />
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
                            className={activeTab === 'kb' ? 'nav-active' : ''}
                        >
                            <BookOpen size={18} /> <span>Knowledge Base</span>
                        </Button>

                        <Button
                            variant={activeTab === 'ai' ? "primary" : "ghost"}
                            onClick={() => setActiveTab('ai')}
                            className={activeTab === 'ai' ? 'nav-active' : ''}
                        >
                            <Sparkles size={18} /> <span>AI Assistant</span>
                        </Button>

                        <Button
                            variant={activeTab === 'compliance' ? "primary" : "ghost"}
                            onClick={() => setActiveTab('compliance')}
                            className={activeTab === 'compliance' ? 'nav-active' : ''}
                        >
                            <Shield size={18} /> <span>Compliance</span>
                        </Button>

                        {profile?.role === 'super_admin' && (
                            <>
                                <Button
                                    variant={activeTab === 'team' ? "primary" : "ghost"}
                                    onClick={() => setActiveTab('team')}
                                    className={activeTab === 'team' ? 'nav-active' : ''}
                                >
                                    <Users size={18} /> <span>Team</span>
                                </Button>
                                <Button
                                    variant={activeTab === 'command' ? "primary" : "ghost"}
                                    onClick={() => setActiveTab('command')}
                                    className={activeTab === 'command' ? 'nav-active' : ''}
                                >
                                    <Terminal size={18} /> <span>Command</span>
                                </Button>
                                <Button
                                    variant={activeTab === 'settings' ? "primary" : "ghost"}
                                    onClick={() => setActiveTab('settings')}
                                    className={activeTab === 'settings' ? 'nav-active' : ''}
                                >
                                    <Settings size={18} /> <span>Settings</span>
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
                        <span className="mini-stat-label">Total Assigned</span>
                        <div className="mini-stat-value">{tickets.filter(t => t.assigned_to_email === user?.email).length}</div>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-stat-label">Pending Response</span>
                        <div className="mini-stat-value text-blue">{tickets.filter(t => t.status === 'Open').length}</div>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-stat-label">SLA At Risk</span>
                        <div className="mini-stat-value text-orange">{tickets.filter(t => t.status === 'Open' && t.priority === 'Urgent').length}</div>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-stat-label">Resolved Today</span>
                        <div className="mini-stat-value text-green">{tickets.filter(t => t.status === 'Resolved').length}</div>
                    </div>
                </div>

                <div className="admin-views-container">
                    {showAnalytics && <div className="analytics-section"><Analytics tickets={tickets} /></div>}

                    {activeTab === 'command' && <CommandCenter />}
                    {activeTab === 'ai' && (
                        <div className="ai-assistant-view fade-in">
                            <PredictiveInsights />
                        </div>
                    )}
                    {activeTab === 'compliance' && <ComplianceOverview tickets={tickets} />}
                    {activeTab === 'kb' && <KnowledgeBaseManager />}
                    {activeTab === 'settings' && <AdminSettings />}

                    {activeTab === 'tickets' && (
                        <div className="tickets-view fade-in">
                            <div className="toolbar">
                                <div className="search-wrapper">
                                    <Search className="search-icon" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search tickets by subject, UID or student name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                <div className="filter-group">
                                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
                                        <option value="all">All Status</option>
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="filter-select">
                                        <option value="all">All Priority</option>
                                        <option value="Urgent">Urgent</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                    {selectedTicketIds.length > 0 && (
                                        <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                                            <Trash2 size={16} /> Delete ({selectedTicketIds.length})
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Card className="tickets-list-card">
                                <table className="tickets-table">
                                    <thead>
                                        <tr>
                                            <th><input type="checkbox" checked={selectedTicketIds.length > 0 && selectedTicketIds.length === filteredTickets.length} onChange={toggleSelectAll} /></th>
                                            <th>Subject</th>
                                            <th>Student</th>
                                            <th>SLA / Created</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Assignee</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTickets.length > 0 ? (
                                            filteredTickets.map(ticket => {
                                                const sla = getSLAStatus(ticket.sla_deadline, ticket.status);
                                                const text = sla.label;
                                                const color = sla.class;
                                                return (
                                                    <tr key={ticket.id} className={selectedTicketIds.includes(ticket.id) ? 'row-selected' : ''}>
                                                        <td><input type="checkbox" checked={selectedTicketIds.includes(ticket.id)} onChange={() => toggleSelectTicket(ticket.id)} /></td>
                                                        <td>
                                                            <div className="subject-cell" onClick={() => setSelectedTicket(ticket)}>
                                                                <span className="ticket-subject">{ticket.subject}</span>
                                                                <span className="ticket-id-tag">#{ticket.student_id ? ticket.student_id.toString().slice(-4) : 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="student-cell">
                                                                <span className="student-name">{ticket.full_name || 'N/A'}</span>
                                                                <span className="student-uid">{ticket.student_id}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="sla-cell">
                                                                <span className={`sla-status ${color}`}>{text}</span>
                                                                <span className="created-at">{new Date(ticket.created_at).toLocaleString()}</span>
                                                            </div>
                                                        </td>
                                                        <td><span className={`status-pill ${ticket.status.toLowerCase()}`}>{ticket.status}</span></td>
                                                        <td><span className={`priority-pill ${ticket.priority?.toLowerCase() || 'medium'}`}>{ticket.priority || 'Medium'}</span></td>
                                                        <td>
                                                            <div className="assign-cell">
                                                                <select
                                                                    value={ticket.assigned_to_email || ''}
                                                                    onChange={(e) => handleAssign(ticket.id, e.target.value)}
                                                                    className="mini-assign-select"
                                                                >
                                                                    <option value="">Unassigned</option>
                                                                    {agents.map(agent => (
                                                                        <option key={agent.id} value={agent.email}>{agent.full_name || agent.email}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="action-btns">
                                                                <Button size="sm" variant="ghost" onClick={() => setSelectedTicket(ticket)} title="View & Reply">
                                                                    <Eye size={14} />
                                                                </Button>
                                                                {(profile?.role === 'super_admin' || profile?.role === 'agent') && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        title="View platform as this student"
                                                                        onClick={async () => {
                                                                            if (ticket.student_id_ref) {
                                                                                await impersonateUser(ticket.student_id_ref);
                                                                                navigate('/dashboard');
                                                                            }
                                                                        }}
                                                                    >
                                                                        <User size={14} />
                                                                    </Button>
                                                                )}
                                                                {/* Delete restricted to Staff (Admins and Coordinators) */}
                                                                {(profile?.role === 'super_admin' || profile?.role === 'agent') && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        title="Delete Ticket"
                                                                        className="text-red-500 hover:bg-red-50"
                                                                        onClick={() => {
                                                                            handleDeleteTicket(ticket.id);
                                                                            if (selectedTicket?.id === ticket.id) {
                                                                                setSelectedTicket(null);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                )}
                                                                {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                                                                    <Button size="sm" variant="primary" onClick={() => handleResolve(ticket.id)}>
                                                                        <CheckCircle size={14} />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan="8" className="empty-table">No tickets found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="team-management-view fade-in">
                            <div className="view-header">
                                <div className="header-titles">
                                    <h2>Team Management</h2>
                                    <p>Manage coordinator expertise and smart routing</p>
                                </div>
                                {profile?.role === 'super_admin' && (
                                    <Button size="sm" onClick={() => navigate('/admin-signup')}>
                                        <Users size={16} style={{ marginRight: '8px' }} />
                                        Register New Coordinator
                                    </Button>
                                )}
                            </div>

                            <div className="team-stats-row">
                                <div className="team-mini-card">
                                    <Users size={20} />
                                    <div className="count">{agents.length}</div>
                                    <label>Total Staff</label>
                                </div>
                                <div className="team-mini-card green">
                                    <Shield size={20} />
                                    <div className="count">{agents.filter(a => a.role === 'super_admin').length}</div>
                                    <label>Admins</label>
                                </div>
                            </div>

                            <Card className="team-list-card">
                                <table className="team-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '30%' }}>Agent Details</th>
                                            <th style={{ width: '12%' }}>Staff ID</th>
                                            <th style={{ width: '12%' }}>Role</th>
                                            <th style={{ width: '15%' }}>Department</th>
                                            <th style={{ width: '20%' }}>Expertise Area</th>
                                            <th style={{ width: '11%' }}>Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {agents.map(agent => (
                                            <tr key={agent.id}>
                                                <td>
                                                    <div className="agent-info">
                                                        <div className="agent-avatar-mini" style={{
                                                            background: agent.role === 'super_admin' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--primary-light)',
                                                            color: agent.role === 'super_admin' ? 'white' : 'var(--primary)'
                                                        }}>
                                                            {(agent.full_name || agent.email)?.[0]?.toUpperCase() || 'A'}
                                                        </div>
                                                        <div className="names">
                                                            <span className="name">{agent.full_name || 'Coordinator'}</span>
                                                            <span className="email">{agent.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="staff-id-badge">
                                                        {agent.staff_id || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`role-tag ${agent.role}`}>
                                                        {agent.role === 'super_admin' ? 'Super Admin' : 'Coordinator'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="dept-cell">
                                                        <span className="dept-name">{agent.department || 'General'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="expertise-cell">
                                                        <span className="expertise-desc">{agent.expertise || 'General Support'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="date-cell">
                                                        <span className="date-text">{new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {selectedTicket && (
                <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="header-badge">#{selectedTicket.student_id ? selectedTicket.student_id.toString().slice(-4) : '---'}</div>
                            <h2>{selectedTicket.subject}</h2>
                            <button className="close-btn" onClick={() => setSelectedTicket(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="ticket-meta-grid">
                                <div className="meta-card">
                                    <label>Status</label>
                                    <span className={`status-pill ${selectedTicket.status.toLowerCase()}`}>{selectedTicket.status}</span>
                                </div>
                                <div className="meta-card">
                                    <label>Priority</label>
                                    <select value={selectedTicket.priority || 'Medium'} onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value)} className="modal-priority-select">
                                        <option value="Urgent">Urgent</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div className="meta-card">
                                    <label>Student</label>
                                    <span className="meta-value">{selectedTicket.full_name}</span>
                                </div>
                                <div className="meta-card">
                                    <label>Category</label>
                                    <span className="meta-value text-capitalize">{selectedTicket.type || 'General'}</span>
                                </div>
                            </div>

                            <div className="ticket-description">
                                <h3>Full Description</h3>
                                <div className="description-text">{selectedTicket.description}</div>
                            </div>

                            {renderAiAnalysis()}

                            {selectedTicket.attachment_url && (
                                <div className="attachment-section">
                                    <h3>Attached Evidence</h3>
                                    <a href={selectedTicket.attachment_url.startsWith('http') ? selectedTicket.attachment_url : `${BASE_URL}${selectedTicket.attachment_url}`} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                        <Download size={16} /> Download Attachment
                                    </a>
                                </div>
                            )}

                            <div className="modal-chat-section">
                                <TicketChat ticketId={selectedTicket.id} role="admin" ticketData={selectedTicket} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <AccessibilityChecker />
        </div>
    );
};

export default memo(AdminDashboard);
