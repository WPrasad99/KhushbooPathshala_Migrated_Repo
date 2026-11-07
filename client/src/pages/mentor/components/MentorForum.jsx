import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { forumAPI, getApiErrorMessage } from '../../../api';
import { useMentorBatches } from '../../../hooks/mentor/useMentorQueries';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMessageSquare,
    FiPlus,
    FiSearch,
    FiThumbsUp,
    FiCheckCircle,
    FiX,
    FiTrash2,
    FiSend,
    FiLayers,
    FiTag,
    FiClock,
    FiUser,
    FiAlertCircle,
    FiRefreshCw,
    FiCornerDownRight,
    FiArrowRight
} from 'react-icons/fi';

// --- CREATE THREAD MODAL ---
const CreateThreadModal = ({ batches, selectedBatchId, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [batchId, setBatchId] = useState(selectedBatchId || '');
    const [tags, setTags] = useState('React, Architecture');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formattedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
            await forumAPI.createPost({
                title,
                content,
                batchId: batchId || null,
                tags: formattedTags
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to publish discussion.'));
            setLoading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
                <motion.div
                    className="modal-content"
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ duration: 0.2 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        maxWidth: '560px',
                        width: '95%',
                        padding: 0,
                        overflow: 'hidden',
                        borderRadius: '16px',
                        border: '1.5px solid var(--admin-border-color)'
                    }}
                >
                    <div style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid var(--admin-border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--admin-surface)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(79, 70, 229, 0.08)',
                                color: 'var(--admin-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiMessageSquare size={18} />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                Start Discussion Thread
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--admin-text-muted)',
                                cursor: 'pointer',
                                padding: '6px'
                            }}
                        >
                            <FiX size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {error && (
                                <div style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    color: '#ef4444',
                                    fontSize: '12.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <FiAlertCircle size={15} /> {error}
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Target Cohort
                                </label>
                                <select
                                    value={batchId}
                                    onChange={(e) => setBatchId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '9px 12px',
                                        fontSize: '13px',
                                        borderRadius: '8px',
                                        border: '1.5px solid var(--admin-border-color)',
                                        background: 'var(--admin-surface)',
                                        color: 'var(--admin-text-primary)',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="">General Community (All Batches)</option>
                                    {(batches || []).map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Discussion Title / Topic *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Best practices for state management in React 19"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '9px 12px',
                                        fontSize: '13px',
                                        borderRadius: '8px',
                                        border: '1.5px solid var(--admin-border-color)',
                                        background: 'var(--admin-surface)',
                                        color: 'var(--admin-text-primary)',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Content / Problem Description *
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Explain your thought process, share code context, or ask a question..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '9px 12px',
                                        fontSize: '13px',
                                        borderRadius: '8px',
                                        border: '1.5px solid var(--admin-border-color)',
                                        background: 'var(--admin-surface)',
                                        color: 'var(--admin-text-primary)',
                                        outline: 'none',
                                        resize: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Topic Tags (Comma separated)
                                </label>
                                <input
                                    type="text"
                                    placeholder="React, CSS, Architecture, Database"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '9px 12px',
                                        fontSize: '13px',
                                        borderRadius: '8px',
                                        border: '1.5px solid var(--admin-border-color)',
                                        background: 'var(--admin-surface)',
                                        color: 'var(--admin-text-primary)',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{
                            padding: '14px 24px',
                            borderTop: '1px solid var(--admin-border-color)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            background: 'var(--admin-bg)'
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--admin-border-color)',
                                    background: 'var(--admin-surface)',
                                    color: 'var(--admin-text-secondary)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    background: 'var(--admin-primary)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Publishing...' : 'Start Discussion'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

// --- THREAD DETAIL & REPLY MODAL ---
const ThreadDetailModal = ({ postId, onClose, onRefreshList }) => {
    const { user } = useAuth();
    const [thread, setThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    useEffect(() => {
        loadThread();
    }, [postId]);

    const loadThread = async () => {
        setLoading(true);
        try {
            const res = await forumAPI.getPostById(postId);
            setThread(res.data);
        } catch (err) {
            console.error('Failed to load thread:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpvotePost = async () => {
        try {
            const res = await forumAPI.upvotePost(postId);
            setThread(prev => ({ ...prev, upvotes: res.data.upvotes }));
            if (onRefreshList) onRefreshList();
        } catch (err) {
            console.error('Failed to upvote thread:', err);
        }
    };

    const handleUpvoteAnswer = async (answerId) => {
        try {
            const res = await forumAPI.upvoteAnswer(answerId);
            setThread(prev => ({
                ...prev,
                answers: prev.answers.map(a =>
                    a.id === answerId ? { ...a, upvotes: res.data.upvotes } : a
                )
            }));
        } catch (err) {
            console.error('Failed to upvote answer:', err);
        }
    };

    const handlePostAnswer = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setSubmittingReply(true);
        try {
            await forumAPI.createAnswer(postId, replyText.trim());
            setReplyText('');
            await loadThread();
            if (onRefreshList) onRefreshList();
        } catch (err) {
            alert('Failed to post reply.');
        } finally {
            setSubmittingReply(false);
        }
    };

    const answers = thread?.answers || [];

    return createPortal(
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
                <motion.div
                    className="modal-content"
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ duration: 0.2 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        maxWidth: '820px',
                        width: '95%',
                        padding: 0,
                        overflow: 'hidden',
                        borderRadius: '16px',
                        border: '1.5px solid var(--admin-border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '85vh'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid var(--admin-border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--admin-surface)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(79, 70, 229, 0.08)',
                                color: 'var(--admin-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiMessageSquare size={18} />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                Thread Discussion
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--admin-text-muted)',
                                cursor: 'pointer',
                                padding: '6px'
                            }}
                        >
                            <FiX size={18} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                <FiRefreshCw className="spin" size={24} style={{ marginBottom: '8px' }} />
                                <div>Loading conversation...</div>
                            </div>
                        ) : thread ? (
                            <>
                                {/* Main Post */}
                                <div style={{
                                    padding: '20px',
                                    borderRadius: '12px',
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border-color)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img
                                                src={thread.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.author?.id || 'post'}`}
                                                alt={thread.author?.name}
                                                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--admin-text-primary)' }}>
                                                    {thread.author?.name || 'Community Member'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                    {thread.author?.role === 'MENTOR' ? 'Mentor' : 'Student'} • {new Date(thread.created_at ? thread.created_at * 1000 : Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleUpvotePost}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--admin-border-color)',
                                                background: 'var(--admin-surface)',
                                                color: 'var(--admin-primary)',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <FiThumbsUp size={13} /> {thread.upvotes || 0} Upvotes
                                        </button>
                                    </div>

                                    <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                        {thread.title}
                                    </h3>

                                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--admin-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                        {thread.content}
                                    </p>

                                    {Array.isArray(thread.tags) && thread.tags.length > 0 && (
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                            {thread.tags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        background: 'rgba(79, 70, 229, 0.08)',
                                                        color: 'var(--admin-primary)'
                                                    }}
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Answers Section */}
                                <div>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: 'var(--admin-text-primary)',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <FiCornerDownRight size={15} style={{ color: 'var(--admin-primary)' }} />
                                        Responses & Solutions ({answers.length})
                                    </div>

                                    {answers.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--admin-text-muted)', border: '1px dashed var(--admin-border-color)', borderRadius: '10px' }}>
                                            No responses posted yet. Be the first mentor to share guidance on this thread!
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {answers.map(ans => {
                                                const isMentor = ans.author?.role === 'MENTOR';

                                                return (
                                                    <div
                                                        key={ans.id}
                                                        style={{
                                                            padding: '16px',
                                                            borderRadius: '10px',
                                                            border: isMentor ? '1.5px solid rgba(79, 70, 229, 0.3)' : '1px solid var(--admin-border-color)',
                                                            background: isMentor ? 'rgba(79, 70, 229, 0.02)' : 'var(--admin-surface)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '8px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <img
                                                                    src={ans.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ans.author?.id || 'ans'}`}
                                                                    alt={ans.author?.name}
                                                                    style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                                                                />
                                                                <div>
                                                                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--admin-text-primary)' }}>
                                                                        {ans.author?.name || 'Mentor Response'}
                                                                    </span>
                                                                    {isMentor && (
                                                                        <span style={{
                                                                            marginLeft: '8px',
                                                                            fontSize: '10.5px',
                                                                            fontWeight: 600,
                                                                            padding: '2px 6px',
                                                                            borderRadius: '4px',
                                                                            background: 'rgba(79, 70, 229, 0.1)',
                                                                            color: 'var(--admin-primary)'
                                                                        }}>
                                                                            Mentor Verified
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleUpvoteAnswer(ans.id)}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: 'var(--admin-text-secondary)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}
                                                            >
                                                                <FiThumbsUp size={12} /> {ans.upvotes || 0}
                                                            </button>
                                                        </div>

                                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--admin-text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                                            {ans.content}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#ef4444' }}>Thread not found.</div>
                        )}
                    </div>

                    {/* Mentor Quick Reply Input */}
                    <form
                        onSubmit={handlePostAnswer}
                        style={{
                            padding: '16px 24px',
                            borderTop: '1px solid var(--admin-border-color)',
                            background: 'var(--admin-surface)',
                            display: 'flex',
                            gap: '10px'
                        }}
                    >
                        <textarea
                            rows={2}
                            required
                            placeholder="Provide your mentor guidance or solution..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '10px 12px',
                                fontSize: '13px',
                                borderRadius: '8px',
                                border: '1.5px solid var(--admin-border-color)',
                                background: 'var(--admin-bg)',
                                color: 'var(--admin-text-primary)',
                                outline: 'none',
                                resize: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={submittingReply || !replyText.trim()}
                            style={{
                                padding: '0 20px',
                                borderRadius: '8px',
                                background: 'var(--admin-primary)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: (submittingReply || !replyText.trim()) ? 'not-allowed' : 'pointer',
                                opacity: (submittingReply || !replyText.trim()) ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <FiSend size={14} /> {submittingReply ? 'Posting...' : 'Reply'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

// --- MAIN FORUM COMPONENT ---
const MentorForum = () => {
    const { user } = useAuth();
    const { data: batchesData } = useMentorBatches();
    const batches = Array.isArray(batchesData) ? batchesData : [];

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);

    useEffect(() => {
        loadPosts();
    }, [selectedBatchId]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const res = await forumAPI.getPosts(selectedBatchId || undefined);
            setPosts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load forum posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpvote = async (e, postId) => {
        e.stopPropagation();
        try {
            const res = await forumAPI.upvotePost(postId);
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, upvotes: res.data.upvotes } : p
            ));
        } catch (err) {
            console.error('Failed to upvote post:', err);
        }
    };

    const handleDelete = async (e, postId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this discussion thread?')) {
            try {
                await forumAPI.deletePost(postId);
                setPosts(prev => prev.filter(p => p.id !== postId));
            } catch (err) {
                alert('Failed to delete discussion thread.');
            }
        }
    };

    const filteredPosts = posts.filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (p.title || '').toLowerCase().includes(term) ||
            (p.content || '').toLowerCase().includes(term) ||
            (p.author?.name || '').toLowerCase().includes(term)
        );
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '22px',
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        color: 'var(--admin-text-primary)'
                    }}>
                        Community Discussion Forum
                    </h1>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13.5px',
                        color: 'var(--admin-text-secondary)'
                    }}>
                        Collaborate with students, address technical blockers, and share expert insights in real-time.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '9px 18px',
                            borderRadius: '8px',
                            background: 'var(--admin-primary)',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                        }}
                    >
                        <FiPlus size={16} /> Start Discussion
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{
                background: 'var(--admin-surface)',
                borderRadius: '12px',
                border: '1.5px solid var(--admin-border-color)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                        Cohort:
                    </span>
                    <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        style={{
                            padding: '7px 12px',
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: '1.5px solid var(--admin-border-color)',
                            background: 'var(--admin-bg)',
                            color: 'var(--admin-text-primary)',
                            outline: 'none',
                            minWidth: '200px'
                        }}
                    >
                        <option value="">All Cohorts & General</option>
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end', minWidth: '240px' }}>
                    <div style={{ position: 'relative', width: '240px' }}>
                        <FiSearch
                            size={14}
                            style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--admin-text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search discussions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '7px 10px 7px 30px',
                                fontSize: '12.5px',
                                borderRadius: '8px',
                                border: '1px solid var(--admin-border-color)',
                                background: 'var(--admin-bg)',
                                color: 'var(--admin-text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        onClick={loadPosts}
                        title="Refresh Forum"
                        style={{
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--admin-border-color)',
                            background: 'var(--admin-bg)',
                            color: 'var(--admin-text-secondary)',
                            cursor: 'pointer'
                        }}
                    >
                        <FiRefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            style={{
                                height: '110px',
                                borderRadius: '12px',
                                background: 'var(--admin-surface)',
                                border: '1.5px solid var(--admin-border-color)',
                                opacity: 0.6,
                                animation: 'pulse 1.5s infinite'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredPosts.length === 0 && (
                <div style={{
                    padding: '56px 24px',
                    borderRadius: '14px',
                    border: '1.5px dashed var(--admin-border-color)',
                    background: 'var(--admin-surface)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: 'rgba(79, 70, 229, 0.08)',
                        color: 'var(--admin-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto'
                    }}>
                        <FiMessageSquare size={26} />
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                        {searchTerm ? 'No Threads Match Your Search' : 'No Forum Threads Active'}
                    </h3>
                    <p style={{ margin: '0 auto 16px auto', maxWidth: '380px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                        {searchTerm
                            ? `We couldn't find any threads matching "${searchTerm}". Try another query.`
                            : 'Start the first discussion thread to initiate questions, share coding tips, and connect with students.'}
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            background: 'var(--admin-primary)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        + Start First Thread
                    </button>
                </div>
            )}

            {/* Threads List */}
            {!loading && filteredPosts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filteredPosts.map(post => {
                        const isAuthor = post.author?.id === user?.id;

                        return (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => setSelectedPostId(post.id)}
                                style={{
                                    background: 'var(--admin-surface)',
                                    borderRadius: '12px',
                                    border: '1.5px solid var(--admin-border-color)',
                                    padding: '18px 20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    boxShadow: 'var(--shadow-card)',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.15s ease'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                            src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.id || 'post'}`}
                                            alt={post.author?.name}
                                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--admin-text-primary)' }}>
                                                    {post.author?.name || 'Anonymous'}
                                                </span>
                                                <span style={{
                                                    fontSize: '10.5px',
                                                    fontWeight: 600,
                                                    padding: '1px 6px',
                                                    borderRadius: '4px',
                                                    background: post.author?.role === 'MENTOR' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: post.author?.role === 'MENTOR' ? 'var(--admin-primary)' : 'var(--admin-success, #10B981)'
                                                }}>
                                                    {post.author?.role === 'MENTOR' ? 'Mentor' : 'Student'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                {new Date(post.createdAt || (post.created_at ? post.created_at * 1000 : Date.now())).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>

                                    {isAuthor && (
                                        <button
                                            onClick={(e) => handleDelete(e, post.id)}
                                            title="Delete Thread"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--admin-text-muted)',
                                                cursor: 'pointer',
                                                padding: '6px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--admin-text-muted)'}
                                        >
                                            <FiTrash2 size={15} />
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <h3 style={{
                                        margin: '0 0 6px 0',
                                        fontSize: '15.5px',
                                        fontWeight: 600,
                                        color: 'var(--admin-text-primary)'
                                    }}>
                                        {post.title}
                                    </h3>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '13px',
                                        color: 'var(--admin-text-secondary)',
                                        lineHeight: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {post.content}
                                    </p>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    marginTop: '4px'
                                }}>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {Array.isArray(post.tags) && post.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    background: 'var(--admin-bg)',
                                                    border: '1px solid var(--admin-border-color)',
                                                    color: 'var(--admin-text-secondary)'
                                                }}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <button
                                            onClick={(e) => handleUpvote(e, post.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--admin-primary)',
                                                fontWeight: 600,
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            <FiThumbsUp size={13} /> {post.upvotes || 0}
                                        </button>

                                        <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <FiMessageSquare size={13} /> {post.answersCount || 0} answers
                                        </span>

                                        <span style={{
                                            fontSize: '12.5px',
                                            fontWeight: 600,
                                            color: 'var(--admin-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            Join Discussion <FiArrowRight size={13} />
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Thread Modal */}
            {showCreateModal && (
                <CreateThreadModal
                    batches={batches}
                    selectedBatchId={selectedBatchId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={loadPosts}
                />
            )}

            {/* Thread Details Modal */}
            {selectedPostId && (
                <ThreadDetailModal
                    postId={selectedPostId}
                    onClose={() => setSelectedPostId(null)}
                    onRefreshList={loadPosts}
                />
            )}
        </div>
    );
};

export default MentorForum;

