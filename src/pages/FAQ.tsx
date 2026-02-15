import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    PlusCircle,
    ChevronLeft,
    ExternalLink,
    Eye,
    ThumbsUp,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './FAQ.css';

const FAQ: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "How do I reset my portal password?",
            answer: "You can reset your password by visiting the student portal login page and clicking on 'Forgot Password'. You will need your student email address to receive the reset link.",
            category: "Portal Access"
        },
        {
            question: "When is the deadline for fee payment?",
            answer: "Fee payment deadlines are typically set for the middle of the semester. Please check the official academic calendar on the UCC website for specific dates for this academic year.",
            category: "Financial"
        },
        {
            question: "How do I register for my courses?",
            answer: "Course registration is done through the portal during the first two weeks of the semester. Select your courses and click 'Submit' to finalize your registration.",
            category: "Academic"
        },
        {
            question: "How long does it take for a ticket to be resolved?",
            answer: "We aim to respond to all tickets within 24-48 hours. More complex issues may take longer, but you will receive updates as the ticket progresses.",
            category: "General"
        },
        {
            question: "Can I edit a ticket after submission?",
            answer: "Once a ticket is submitted, you cannot edit the original message, but you can add new messages and attachments to provide more information.",
            category: "General"
        }
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="container faq-page fade-in">
            <header className="page-header">
                <Button variant="ghost" onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={20} /> Back
                </Button>
                <h1>Frequently Asked Questions</h1>
                <p>Find quick answers to common questions about UCC CoDE services.</p>

                <div className="faq-search">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search for answers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div className="faq-grid">
                <div className="faq-list">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, index) => (
                            <Card
                                key={index}
                                className={`faq-card-modern ${openIndex === index ? 'expanded' : ''}`}
                                onClick={() => toggleFaq(index)}
                            >
                                <div className="faq-card-content">
                                    <div className="faq-meta">
                                        <span className="category-pill">{faq.category}</span>
                                    </div>
                                    <h3>{faq.question}</h3>
                                    <div className="faq-answer-preview">
                                        {faq.answer}
                                    </div>
                                </div>
                                <div className="faq-footer">
                                    <div className="faq-stats">
                                        <span><Eye size={14} /> {Math.floor(Math.random() * 500) + 100}</span>
                                        <span><ThumbsUp size={14} /> {Math.floor(Math.random() * 50) + 90}%</span>
                                    </div>
                                    <div className="expand-icon">
                                        Read <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="empty-faq" style={{ gridColumn: '1 / -1' }}>
                            <Search size={48} />
                            <p>No answers found for "<strong>{searchQuery}</strong>"</p>
                            <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
                        </Card>
                    )}
                </div>

                <aside className="faq-sidebar">
                    <Card className="support-card">
                        <MessageCircle size={32} color="var(--primary)" />
                        <h3>Couldn't find what you need?</h3>
                        <p>If your question isn't answered here, please submit a support ticket.</p>
                        <Button
                            style={{ width: '100%', marginTop: '1rem' }}
                            onClick={() => navigate(user ? '/submit-ticket' : '/login')}
                        >
                            <PlusCircle size={18} /> New Support Ticket
                        </Button>
                    </Card>

                    <Card className="links-card">
                        <h3>Quick Links</h3>
                        <ul className="resource-links">
                            <li><a href="https://portal.ucc.edu.gh" target="_blank" rel="noreferrer">UCC Student Portal <ExternalLink size={14} /></a></li>
                            <li><a href="https://ucc.edu.gh" target="_blank" rel="noreferrer">Main UCC Website <ExternalLink size={14} /></a></li>
                            <li><a href="https://code.ucc.edu.gh" target="_blank" rel="noreferrer">CoDE Homepage <ExternalLink size={14} /></a></li>
                        </ul>
                    </Card>
                </aside>
            </div>
        </div>
    );
};

export default FAQ;
