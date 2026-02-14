import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, BookOpen, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import './FAQManager.css';

const FAQManager = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'Student Portal & Registration'
    });
    const { showSuccess, showError } = useToast();

    const categories = [
        'Student Portal & Registration',
        'Fees & Payments',
        'Academic & CoDE Specific',
        'ID Cards & Certificates',
        'General Inquiries'
    ];

    useEffect(() => {
        loadFAQs();
    }, []);

    const loadFAQs = async () => {
        try {
            setLoading(true);
            const data = await api.faq.list();
            setFaqs(data || []);
        } catch (error) {
            console.error('Failed to load FAQs:', error);
            showError('Failed to load FAQs');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setIsAdding(true);
        setEditingId(null);
        setFormData({
            question: '',
            answer: '',
            category: 'Student Portal & Registration'
        });
    };

    const handleEdit = (faq) => {
        setEditingId(faq.id);
        setIsAdding(false);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category
        });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({
            question: '',
            answer: '',
            category: 'Student Portal & Registration'
        });
    };

    const handleSave = async () => {
        if (!formData.question.trim() || !formData.answer.trim()) {
            showError('Question and answer are required');
            return;
        }

        try {
            if (isAdding) {
                await api.faq.create(formData);
                showSuccess('FAQ added successfully!');
            } else if (editingId) {
                await api.faq.update(editingId, formData);
                showSuccess('FAQ updated successfully!');
            }
            handleCancel();
            await loadFAQs();
        } catch (error) {
            console.error('Save failed:', error);
            showError(isAdding ? 'Failed to add FAQ' : 'Failed to update FAQ');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) {
            return;
        }

        try {
            await api.faq.delete(id);
            showSuccess('FAQ deleted successfully');
            await loadFAQs();
        } catch (error) {
            console.error('Delete failed:', error);
            showError('Failed to delete FAQ');
        }
    };

    const filteredFAQs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedFAQs = categories.reduce((acc, category) => {
        acc[category] = filteredFAQs.filter(faq => faq.category === category);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="faq-manager-loading">
                <div className="spinner"></div>
                <p>Loading FAQ Manager...</p>
            </div>
        );
    }

    return (
        <div className="faq-manager">
            <div className="faq-manager-header">
                <div className="header-left">
                    <BookOpen size={32} className="header-icon" />
                    <div>
                        <h2>Knowledge Base Manager</h2>
                        <p>Manage FAQ articles to help students self-serve common inquiries</p>
                    </div>
                </div>
                <Button onClick={handleAdd} disabled={isAdding || editingId}>
                    <Plus size={18} /> Add New FAQ
                </Button>
            </div>

            <div className="faq-stats">
                <Card className="stat-card">
                    <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{faqs.length}</div>
                        <div className="stat-label">Total FAQs</div>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{categories.length}</div>
                        <div className="stat-label">Categories</div>
                    </div>
                </Card>
            </div>

            <div className="faq-search-bar">
                <Search size={20} />
                <input
                    type="search"
                    placeholder="Search FAQs by question, answer, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                />
            </div>

            {(isAdding || editingId) && (
                <Card className="faq-form-card fade-in">
                    <h3>{isAdding ? 'Add New FAQ' : 'Edit FAQ'}</h3>
                    <div className="faq-form">
                        <div className="form-group">
                            <label htmlFor="faq-category">Category</label>
                            <select
                                id="faq-category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="form-select"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="faq-question">Question</label>
                            <input
                                id="faq-question"
                                type="text"
                                placeholder="Enter the question students will ask..."
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                className="form-input"
                                autoComplete="off"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="faq-answer">Answer</label>
                            <textarea
                                id="faq-answer"
                                placeholder="Provide a clear, helpful answer..."
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                className="form-textarea"
                                rows={5}
                            />
                        </div>
                        <div className="form-actions">
                            <Button variant="ghost" onClick={handleCancel}>
                                <X size={18} /> Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                <Save size={18} /> {isAdding ? 'Add FAQ' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="faq-list">
                {categories.map(category => {
                    const categoryFAQs = groupedFAQs[category];
                    if (categoryFAQs.length === 0) return null;

                    return (
                        <div key={category} className="faq-category-section">
                            <h3 className="category-title">{category} ({categoryFAQs.length})</h3>
                            <div className="faq-items">
                                {categoryFAQs.map(faq => (
                                    <Card key={faq.id} className="faq-item-card">
                                        <div className="faq-item-header">
                                            <h4>{faq.question}</h4>
                                            <div className="faq-actions">
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleEdit(faq)}
                                                    disabled={isAdding || (editingId && editingId !== faq.id)}
                                                    title="Edit FAQ"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleDelete(faq.id)}
                                                    disabled={isAdding || editingId}
                                                    title="Delete FAQ"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="faq-answer">{faq.answer}</p>
                                        <div className="faq-meta">
                                            <span className="meta-badge helpful">
                                                👍 {faq.helpful_count || 0} Helpful
                                            </span>
                                            <span className="meta-badge unhelpful">
                                                👎 {faq.unhelpful_count || 0} Not Helpful
                                            </span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredFAQs.length === 0 && (
                <div className="no-faqs">
                    <BookOpen size={64} />
                    <h3>No FAQs Found</h3>
                    <p>
                        {searchTerm
                            ? `No results for "${searchTerm}". Try a different search term.`
                            : 'Get started by adding your first FAQ article.'}
                    </p>
                    {!searchTerm && !isAdding && (
                        <Button onClick={handleAdd}>
                            <Plus size={18} /> Add First FAQ
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default FAQManager;
