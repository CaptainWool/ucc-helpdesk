import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, HelpCircle, ThumbsUp, ThumbsDown, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { FAQS as STATIC_FAQS } from '../lib/constants';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './FAQ.css';

const FAQItem = ({ article, onHelpful }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [voted, setVoted] = useState(false);

    const handleVote = (helpful) => {
        if (voted) return;
        setVoted(true);
        onHelpful(article.id, helpful);
    };

    return (
        <div className={`faq-item ${isOpen ? 'open' : ''}`}>
            <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
                <div className="faq-q-text">
                    <span className="faq-category">{article.category}</span>
                    <span>{article.question}</span>
                </div>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isOpen && (
                <div className="faq-answer fade-in">
                    <div className="answer-content">{article.answer}</div>
                    <div className="faq-helpfulness">
                        <span>Was this helpful?</span>
                        <div className="vote-btns">
                            <button
                                className={`vote-btn ${voted === 'yes' ? 'voted' : ''}`}
                                onClick={() => handleVote(true)}
                                disabled={voted}
                            >
                                <ThumbsUp size={14} /> Yes
                            </button>
                            <button
                                className={`vote-btn ${voted === 'no' ? 'voted' : ''}`}
                                onClick={() => handleVote(false)}
                                disabled={voted}
                            >
                                <ThumbsDown size={14} /> No
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FAQ = () => {
    const { profile } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadFaqs = async () => {
            try {
                const dynamicFaqs = await api.faq.list();
                if (dynamicFaqs && dynamicFaqs.length > 0) {
                    setArticles(dynamicFaqs);
                } else {
                    // Fallback to static if none found
                    const flattened = STATIC_FAQS.flatMap(cat =>
                        cat.items.map(item => ({ ...item, category: cat.category, id: Math.random() }))
                    );
                    setArticles(flattened);
                }
            } catch (error) {
                console.error("Failed to load dynamic FAQs:", error);
                const flattened = STATIC_FAQS.flatMap(cat =>
                    cat.items.map(item => ({ ...item, category: cat.category, id: Math.random() }))
                );
                setArticles(flattened);
            } finally {
                setLoading(false);
            }
        };
        loadFaqs();
    }, []);

    const handleHelpful = async (id, isHelpful) => {
        try {
            await api.faq.trackHelpfulness(id, isHelpful);
        } catch (error) {
            console.error("Helpfulness tracking failed:", error);
        }
    };

    const filteredArticles = articles.filter(item =>
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by category
    const categories = [...new Set(filteredArticles.map(a => a.category))];

    return (
        <div className="container faq-container">
            <div className="faq-header">
                <HelpCircle size={48} className="header-icon" />
                <h1>Knowledge Base</h1>
                <p>Instant solutions for your common campus inquiries.</p>
                <div className="faq-search-wrapper">
                    <Search className="search-icon" size={20} />
                    <label htmlFor="faq-search" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>Search FAQ</label>
                    <input
                        id="faq-search"
                        type="search"
                        placeholder="Search for answers (e.g. 'fees', 'portal')..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="faq-search-input"
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="faq-list">
                {loading ? (
                    <div className="faq-loading">
                        <Loader2 className="animate-spin" size={32} />
                        <p>Searching knowledge base...</p>
                    </div>
                ) : categories.length > 0 ? (
                    categories.map((cat, index) => (
                        <div key={index} className="faq-section">
                            <h2 className="section-title">{cat}</h2>
                            <Card className="faq-card-modern">
                                {filteredArticles
                                    .filter(a => a.category === cat)
                                    .map((article) => (
                                        <FAQItem key={article.id} article={article} onHelpful={handleHelpful} />
                                    ))
                                }
                            </Card>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <HelpCircle size={48} />
                        <p>We couldn't find an exact match for "{searchTerm}"</p>
                        <Link to="/submit-ticket">
                            <Button variant="primary">Ask Our Team Directly</Button>
                        </Link>
                    </div>
                )}
            </div>

            {(!profile || profile?.role === 'student') && (
                <div className="faq-cta-card">
                    <div className="cta-content">
                        <h3>Still need help?</h3>
                        <p>Our support team is available Mon-Fri, 8am-5pm.</p>
                    </div>
                    <Link to="/submit-ticket">
                        <Button variant="primary">Open a Support Ticket</Button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default FAQ;
