import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, LifeBuoy, CreditCard, MessageCircle, ChevronRight, CheckCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import './Home.css';

const Home = () => {
    const { t } = useLanguage();
    const { user, profile } = useAuth();
    const { settings } = useSettings();
    const queryClient = useQueryClient();

    const prefetchDashboard = () => {
        if (!user) return;
        const queryKey = profile?.role === 'student' ? ['tickets', user.id] : ['admin-tickets'];
        queryClient.prefetchQuery({
            queryKey,
            queryFn: () => api.tickets.list(),
            staleTime: 1000 * 60 * 5,
        });
    };
    const isAdmin = profile?.role === 'agent' || profile?.role === 'super_admin';
    const isStudent = profile?.role === 'student';

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            {t('hero_title')} <br />
                            <span className="text-highlight">U.C.C (CoDE)</span>
                        </h1>
                        <p className="hero-subtitle">
                            {t('hero_subtitle')}
                        </p>
                        <div className="hero-actions">
                            {isAdmin ? (
                                <Link to="/admin" onMouseEnter={prefetchDashboard}>
                                    <Button size="lg" className="hero-cta">
                                        Manage Dashboard <ChevronRight size={20} />
                                    </Button>
                                </Link>
                            ) : (isStudent || !user) && settings.showHeaderSubmit ? (
                                <Link to="/submit-ticket">
                                    <Button size="lg" className="hero-cta">
                                        {t('btn_submit')} <ChevronRight size={20} />
                                    </Button>
                                </Link>
                            ) : null}
                            <a href="#how-it-works" className="secondary-link">How it works</a>
                        </div>

                        <div className="stats-pills">
                            <div className="pill"><CheckCircle size={16} className="pill-icon" /> 24h Response Time</div>
                            <div className="pill"><CheckCircle size={16} className="pill-icon" /> Official Support</div>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="visual-card-stack">
                            <Card className="visual-card card-1">
                                <div className="card-header">
                                    <div className="avatar">JD</div>
                                    <div>
                                        <div className="card-name">John Doe</div>
                                        <div className="card-meta">Student ID: 1023456</div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="status-badge status-resolved">Resolved</div>
                                    <p>My portal login issue was fixed in under 2 hours. Thanks!</p>
                                </div>
                            </Card>
                            <Card className="visual-card card-2">
                                <div className="card-icon-wrapper"><LifeBuoy size={24} /></div>
                                <h3>Support Ticket #2938</h3>
                                <p>Fee clarification regarding semester 2...</p>
                                <div className="progress-bar"><div className="progress-fill"></div></div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-section" id="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2>How can we assist you?</h2>
                        <p>Select a category to get started with your inquiry</p>
                    </div>

                    <div className="grid-3">
                        <Card className="category-card">
                            <div className="cat-icon-wrapper icon-blue"><FileText size={32} /></div>
                            <h3>Portal Issues</h3>
                            <p>Login problems, course registration errors, or profile updates.</p>
                            {isAdmin ? (
                                <Link to="/admin" className="card-link">View Portal Tickets &rarr;</Link>
                            ) : isStudent ? (
                                <Link to="/dashboard" className="card-link" onMouseEnter={prefetchDashboard}>View My Portal Issues &rarr;</Link>
                            ) : (
                                <Link to="/submit-ticket?type=portal" className="card-link">Report Issue &rarr;</Link>
                            )}
                        </Card>

                        <Card className="category-card">
                            <div className="cat-icon-wrapper icon-green"><CreditCard size={32} /></div>
                            <h3>Fee Clarifications</h3>
                            <p>Payment verification, outstanding balance queries, and receipts.</p>
                            {isAdmin ? (
                                <Link to="/admin" className="card-link">View Fee Inquiries &rarr;</Link>
                            ) : isStudent ? (
                                <Link to="/dashboard" className="card-link" onMouseEnter={prefetchDashboard}>Check My Fee Tickets &rarr;</Link>
                            ) : (
                                <Link to="/submit-ticket?type=fees" className="card-link">Inquire Now &rarr;</Link>
                            )}
                        </Card>

                        <Card className="category-card">
                            <div className="cat-icon-wrapper icon-purple"><MessageCircle size={32} /></div>
                            <h3>General Inquiries</h3>
                            <p>Academic calendar, exam schedules, and other administrative questions.</p>
                            {isAdmin ? (
                                <Link to="/admin" className="card-link">View General Inquiries &rarr;</Link>
                            ) : isStudent ? (
                                <Link to="/dashboard" className="card-link">Track My Inquiries &rarr;</Link>
                            ) : (
                                <Link to="/submit-ticket?type=academic" className="card-link">Ask Question &rarr;</Link>
                            )}
                        </Card>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-teaser-section">
                <div className="container">
                    <Card className="faq-teaser-card" style={{ background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>Have a quick question?</h2>
                            <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>Check our frequently asked questions for immediate answers.</p>
                        </div>
                        {settings.showHeaderFAQ && (
                            <Link to="/faq" onMouseEnter={() => queryClient.prefetchQuery({ queryKey: ['faq'], queryFn: api.faq.list })}>
                                <Button variant="secondary" size="lg" style={{ background: 'white', color: 'var(--primary)' }}>
                                    Visit FAQ Center
                                </Button>
                            </Link>
                        )}
                    </Card>
                </div>
            </section>
        </div>
    );
};

export default Home;
