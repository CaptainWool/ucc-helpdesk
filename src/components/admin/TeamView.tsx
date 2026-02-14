import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { User } from '../../types';

interface TeamViewProps {
    agents: User[];
    profile: User | null;
}

const TeamView: React.FC<TeamViewProps> = ({ agents, profile }) => {
    const navigate = useNavigate();

    return (
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
                <div className="table-responsive">
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
                                            <span className="date-text">
                                                {agent.created_at ? new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default TeamView;
