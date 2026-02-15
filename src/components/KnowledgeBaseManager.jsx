import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, HelpCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Button from './common/Button';
import Card from './common/Card';
import './KnowledgeBaseManager.css';

const KnowledgeBaseManager = () => {
    const { showSuccess, showError } = useToast();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingArticle, setEditingArticle] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'General',
        status: 'published'
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const data = await api.faq.list();
            setArticles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching articles:', error);
            // Fallback to empty if not implemented
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingArticle) {
                await api.faq.update(editingArticle.id, formData);
            } else {
                await api.faq.create(formData);
            }
            setIsFormOpen(false);
            setEditingArticle(null);
            setFormData({ question: '', answer: '', category: 'General', status: 'published' });
            fetchArticles();
            showSuccess(`Article ${editingArticle ? 'updated' : 'created'} successfully`);
        } catch (error) {
            console.error('Error saving article:', error);
            showError('Failed to save article');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this article?')) return;
        try {
            await api.faq.delete(id);
            showSuccess('Article deleted successfully');
            fetchArticles();
        } catch (error) {
            console.error('Error deleting article:', error);
        }
    };

    const openEdit = (article) => {
        setEditingArticle(article);
        setFormData({
            question: article.question,
            answer: article.answer,
            category: article.category || 'General',
            status: article.status || 'published'
        });
        setIsFormOpen(true);
    };

    const filteredArticles = articles.filter(a =>
        a.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="kb-manager fade-in">
            <div className="kb-header">
                <div className="kb-title-block">
                    <h2>Knowledge Base Management</h2>
                    <p>Create and manage solution guides for students</p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus size={18} /> New Article
                </Button>
            </div>

            <div className="kb-toolbar">
                <div className="search-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="articles-grid">
                {loading ? (
                    <div className="loading-state">Loading articles...</div>
                ) : filteredArticles.length > 0 ? (
                    filteredArticles.map(article => (
                        <Card key={article.id} className="article-card-compact">
                            <div className="article-content">
                                <div className="article-meta">
                                    <span className="category-pill">{article.category}</span>
                                    {article.status === 'published' ?
                                        <span className="status-pill live"><CheckCircle size={12} /> Live</span> :
                                        <span className="status-pill draft"><Clock size={12} /> Draft</span>
                                    }
                                </div>
                                <h4>{article.question}</h4>
                                <p>{String(article.answer || '').substring(0, 100)}...</p>
                                <div className="article-stats">
                                    <span><Eye size={12} /> {article.views || 0} views</span>
                                    <span><HelpCircle size={12} /> {article.helpfulness_score || 0}%</span>
                                    {article.updated_at && (
                                        <span title="Last Updated">
                                            <Clock size={12} /> {new Date(article.updated_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="article-actions">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(article)}><Edit2 size={14} /></Button>
                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(article.id)}><Trash2 size={14} /></Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="empty-kb">
                        <HelpCircle size={48} />
                        <p>No articles found. Start building your knowledge base!</p>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <div className="kb-modal-overlay">
                    <Card className="kb-modal">
                        <h3>{editingArticle ? 'Edit Article' : 'Create Article'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="General">General</option>
                                    <option value="Portal">Portal & Login</option>
                                    <option value="Fees">Fees & Finance</option>
                                    <option value="Academic">Academic & Grades</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Question / Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Answer / Content</label>
                                <textarea
                                    required
                                    rows="6"
                                    value={formData.answer}
                                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="published"
                                            checked={formData.status === 'published'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        /> Published
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="draft"
                                            checked={formData.status === 'draft'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        /> Draft
                                    </label>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                <Button type="submit">Save Article</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBaseManager;
