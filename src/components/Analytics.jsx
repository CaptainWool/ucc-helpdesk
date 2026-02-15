import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, PieChart as PieIcon, ShieldCheck, Activity, Users } from 'lucide-react';
import Card from './common/Card';
import './Analytics.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = ({ tickets }) => {
    // Calculate Status Stats
    const statusData = useMemo(() => {
        if (!Array.isArray(tickets)) return [];
        const stats = tickets.reduce((acc, ticket) => {
            const status = ticket.status || 'Open';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        return Object.keys(stats).map(key => ({
            name: key,
            value: stats[key]
        }));
    }, [tickets]);

    // Calculate Type Stats
    const typeData = useMemo(() => {
        const stats = tickets.reduce((acc, ticket) => {
            const type = ticket.type || 'Other';
            // Capitalize first letter
            const label = type.charAt(0).toUpperCase() + type.slice(1);
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});

        return Object.keys(stats).map(key => ({
            name: key,
            count: stats[key]
        }));
    }, [tickets]);

    // Calculate SLA Compliance
    const slaCompliance = useMemo(() => {
        const resolved = tickets.filter(t => t.status === 'Resolved' && t.resolved_at);
        if (resolved.length === 0) return 0;

        const metCount = resolved.filter(t => {
            const deadline = new Date(t.sla_deadline);
            const resolvedTime = new Date(t.resolved_at);
            return resolvedTime <= deadline;
        }).length;

        return Math.round((metCount / resolved.length) * 100);
    }, [tickets]);

    const totalTickets = tickets.length;
    const resolutionRate = useMemo(() => {
        const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
        return tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0;
    }, [tickets]);

    return (
        <div className="analytics-container fade-in">
            <div className="analytics-grid">
                {/* Key Metrics */}
                <Card className="metric-card">
                    <Activity size={24} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
                    <h3>Total Tickets</h3>
                    <p className="metric-value">{totalTickets}</p>
                </Card>
                <Card className="metric-card">
                    <ShieldCheck size={24} color={slaCompliance < 80 ? '#ef4444' : '#10b981'} style={{ margin: '0 auto 1rem' }} />
                    <h3>SLA Compliance</h3>
                    <p className="metric-value" style={{ color: slaCompliance < 80 ? '#ef4444' : '#10b981' }}>
                        {slaCompliance}%
                    </p>
                </Card>
                <Card className="metric-card">
                    <Activity size={24} color="#8b5cf6" style={{ margin: '0 auto 1rem' }} />
                    <h3>Resolution Rate</h3>
                    <p className="metric-value">{resolutionRate}%</p>
                </Card>
            </div>

            <div className="charts-grid">
                {/* Status Distribution */}
                <Card className="chart-card">
                    <h3><PieIcon size={20} color="#3b82f6" /> Ticket Status</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Type Distribution */}
                <Card className="chart-card">
                    <h3><BarChart3 size={20} color="#8b5cf6" /> Issues by Category</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={typeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#3b82f6"
                                    name="Tickets"
                                    radius={[6, 6, 0, 0]}
                                    barSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
