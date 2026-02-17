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

const Home: React.FC = () => {
    const { t } = useLanguage() as any;
    const { user, profile } = useAuth();
    const { settings } = useSettings() as any;
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
                    <div className="hero-content fade-in-up">
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
                            <a href="#how-it-works" className="secondary-link">
                                How it works <ChevronRight size={18} />
                            </a>
                        </div>

                        <div className="stats-pills">
                            <div className="pill"><CheckCircle size={16} className="pill-icon" /> 24h Response Time</div>
                            <div className="pill"><CheckCircle size={16} className="pill-icon" /> Official Support</div>
                        </div>
                    </div>

                    <div className="hero-visual fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="visual-card-stack">
                            <div className="visual-card card-1">
                                <div className="card-header">
                                    <div className="avatar">JD</div>
                                    <div>
                                        <div className="card-name" style={{ color: '#1e293b' }}>John Doe</div>
                                        <div className="card-meta">Student ID: 1023456</div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <span className="status-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>Resolved</span>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>My portal login issue was fixed in under 2 hours. Thanks!</p>
                                </div>
                            </div>
                            <div className="visual-card card-2">
                                <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                                    <div className="avatar" style={{ background: '#f59e0b', color: 'white' }}>
                                        <LifeBuoy size={20} />
                                    </div>
                                    <div>
                                        <div className="card-name" style={{ color: '#1e293b' }}>Ticket #2938</div>
                                        <div className="card-meta">Portal Inquiry</div>
                                    </div>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>Fee clarification regarding semester 2...</p>
                                <div className="progress-bar" style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div className="progress-fill" style={{ width: '75%', height: '100%', background: '#f59e0b' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-section" id="how-it-works">
                <div className="container">
                    <div className="section-header fade-in-up">
                        <h2>How can we assist you?</h2>
                        <p>Select a category to get started with your inquiry</p>
                    </div>

                    <div className="grid-3">
                        <div className="category-card fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="cat-icon-wrapper icon-blue" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                <FileText size={32} />
                            </div>
                            <h3>Portal Issues</h3>
                            <p>Login problems, course registration errors, or profile updates.</p>
                            {isAdmin ? (
                                <Link to="/admin" className="card-link">View Portal Tickets &rarr;</Link>
                            ) : isStudent ? (
                                <Link to="/dashboard" className="card-link" onMouseEnter={prefetchDashboard}>View My Portal Issues &rarr;</Link>
                            ) : (
                                <Link to="/submit-ticket?type=portal" className="card-link">Report Issue &rarr;</Link>
                            )}
                        </div>

                        <div className="category-card fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div className="cat-icon-wrapper icon-green" style={{ background: '#dcfce7', color: '#15803d' }}>
                                <CreditCard size={32} />
                            </div>
                            <h3>Fee Clarifications</h3>
                            <p>Payment verification, outstanding balance queries, and receipts.</p>
                            {isAdmin ? (
                                <Link to="/admin" className="card-link">View Fee Inquiries &rarr;</Link>
                            ) : isStudent ? (
                                <Link to="/dashboard" className="card-link" onMouseEnter={prefetchDashboard}>Check My Fee Tickets &rarr;</Link>
                            ) : (
                                <Link to="/submit-ticket?type=fees" className="card-link">Inquire Now &rarr;</Link>
                            )}
                        </div>

                        <div className="category-card fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <div className="cat-icon-wrapper icon-purple" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                                <MessageCircle size={32} />
                            </div>
                            <h3>General Support</h3>
                            <p>Academic calendar, exam schedules, and administrative questions.</p>
                            {isAdmin ? (
                                <Link to="/admin" className="card-link">View General Inquiries &rarr;</Link>
                            ) : isStudent ? (
                                <Link to="/dashboard" className="card-link">Track My Inquiries &rarr;</Link>
                            ) : (
                                <Link to="/submit-ticket?type=academic" className="card-link">Ask Question &rarr;</Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-teaser-section">
                <div className="container">
                    <div className="faq-teaser-card fade-in-up" style={{ background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4rem', borderRadius: '32px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>Have a quick question?</h2>
                            <p style={{ opacity: 0.8, marginTop: '0.75rem', fontSize: '1.1rem' }}>Check our frequently asked questions for immediate answers.</p>
                        </div>
                        {settings.showHeaderFAQ && (
                            <Link to="/faq" onMouseEnter={() => queryClient.prefetchQuery({ queryKey: ['faq'], queryFn: () => api.faq.list() })}>
                                <Button variant="secondary" size="lg" style={{ background: 'white', color: '#0f172a', fontWeight: 800, padding: '1.25rem 2.5rem', borderRadius: '16px' }}>
                                    Visit FAQ Center
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
