import React from 'react';
import { Search, Trash2, Eye, User, CheckCircle, Download } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const TicketsView = ({
    tickets,
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    priorityFilter,
    setPriorityFilter,
    selectedTicketIds,
    toggleSelectAll,
    toggleSelectTicket,
    onBulkDelete,
    onSelectTicket,
    onResolve,
    onDelete,
    onAssign,
    onImpersonate,
    agents,
    profile,
    currentTime
}) => {

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

    return (
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
                        <Button variant="danger" size="sm" onClick={onBulkDelete}>
                            <Trash2 size={16} /> Delete ({selectedTicketIds.length})
                        </Button>
                    )}
                </div>
            </div>

            <Card className="tickets-list-card">
                <table className="tickets-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all-tickets" name="select-all-tickets" aria-label="Select all tickets" checked={selectedTicketIds.length > 0 && selectedTicketIds.length === tickets.length} onChange={toggleSelectAll} /></th>
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
                        {tickets.length > 0 ? (
                            tickets.map(ticket => {
                                const sla = getSLAStatus(ticket.sla_deadline, ticket.status);
                                const text = sla.label;
                                const color = sla.class;
                                return (
                                    <tr key={ticket.id} className={selectedTicketIds.includes(ticket.id) ? 'row-selected' : ''}>
                                        <td><input type="checkbox" id={`select-ticket-${ticket.id}`} name={`select-ticket-${ticket.id}`} aria-label={`Select ticket ${ticket.subject}`} checked={selectedTicketIds.includes(ticket.id)} onChange={() => toggleSelectTicket(ticket.id)} /></td>
                                        <td>
                                            <div className="subject-cell" onClick={() => onSelectTicket(ticket)}>
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
                                                    onChange={(e) => onAssign(ticket.id, e.target.value)}
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
                                                <Button size="sm" variant="ghost" onClick={() => onSelectTicket(ticket)} title="View & Reply">
                                                    <Eye size={14} />
                                                </Button>
                                                {(profile?.role === 'super_admin' || profile?.role === 'agent') && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        title="View platform as this student"
                                                        onClick={() => onImpersonate(ticket.student_id_ref)}
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
                                                            onDelete(ticket.id);
                                                            if (selectedTicketIds.includes(ticket.id)) {
                                                                // Logic to handle selection state if needed, usually parent handles it or refetch overrides
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                )}
                                                {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                                                    <Button size="sm" variant="primary" onClick={() => onResolve(ticket.id)}>
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
    );
};

export default TicketsView;
