import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { forumAPI, getApiErrorMessage } from '../../api';
import {
    FiMessageSquare,
    FiPlus,
    FiSearch,
    FiThumbsUp,
    FiCheckCircle,
    FiX,
    FiSend,
    FiClock,
    FiTag,
    FiCornerDownRight,
    FiAlertCircle,
    FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Forum = () => {
    const { user } = useAuth();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create question state
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newTags, setNewTags] = useState('React, JavaScript');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Active expanded discussion
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [activePostDetails, setActivePostDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await forumAPI.getPosts();
            setPosts(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to load forum posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setCreateError('');
        setCreating(true);

        try {
            const formattedTags = newTags.split(',').map(t => t.trim()).filter(Boolean);
            await forumAPI.createPost({
                title: newTitle,
                content: newContent,
                tags: formattedTags
            });
            setNewTitle('');
            setNewContent('');
            setShowCreateModal(false);
            await fetchPosts();
        } catch (err) {
            setCreateError(getApiErrorMessage(err, 'Failed to post discussion.'));
        } finally {
            setCreating(false);
        }
    };

    const toggleExpandPost = async (postId) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
            setActivePostDetails(null);
            return;
        }

        setExpandedPostId(postId);
        setLoadingDetails(true);
        try {
            const res = await forumAPI.getPostById(postId);
            setActivePostDetails(res.data);
        } catch (err) {
            console.error('Failed to load thread details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleUpvotePost = async (e, postId) => {
        e.stopPropagation();
        try {
            const res = await forumAPI.upvotePost(postId);
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, upvotes: res.data.upvotes } : p
            ));
            if (activePostDetails && activePostDetails.id === postId) {
                setActivePostDetails(prev => ({ ...prev, upvotes: res.data.upvotes }));
            }
        } catch (err) {
            console.error('Failed to upvote post:', err);
        }
    };

    const handleUpvoteAnswer = async (answerId) => {
        try {
            const res = await forumAPI.upvoteAnswer(answerId);
            if (activePostDetails) {
                setActivePostDetails(prev => ({
                    ...prev,
                    answers: (prev.answers || []).map(a =>
                        a.id === answerId ? { ...a, upvotes: res.data.upvotes } : a
                    )
                }));
            }
        } catch (err) {
            console.error('Failed to upvote answer:', err);
        }
    };

    const handlePostReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !expandedPostId) return;

        setSubmittingReply(true);
        try {
            await forumAPI.createAnswer(expandedPostId, replyText.trim());
            setReplyText('');
            // Refetch details
            const res = await forumAPI.getPostById(expandedPostId);
            setActivePostDetails(res.data);
            await fetchPosts();
        } catch (err) {
            alert('Failed to post reply.');
        } finally {
            setSubmittingReply(false);
        }
    };

    // Filtered posts
    const filteredPosts = useMemo(() => {
        return posts.filter(p => {
            if (selectedTag && !p.tags?.includes(selectedTag)) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    (p.title || '').toLowerCase().includes(term) ||
                    (p.content || '').toLowerCase().includes(term) ||
                    (p.author?.name || '').toLowerCase().includes(term)
                );
            }
            return true;
        });
    }, [posts, searchTerm, selectedTag]);

    // Available tags
    const allTags = useMemo(() => {
        const set = new Set();
        posts.forEach(p => {
            if (Array.isArray(p.tags)) p.tags.forEach(t => set.add(t));
        });
        return Array.from(set).slice(0, 6);
    }, [posts]);

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
                        Student Community Forum
                    </h1>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13.5px',
                        color: 'var(--admin-text-secondary)'
                    }}>
                        Collaborate with peers, troubleshoot technical bugs, and get verified mentor solutions.
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
                        <FiPlus size={16} /> Ask Question
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setSelectedTag('')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: !selectedTag ? '1.5px solid var(--admin-primary)' : '1px solid var(--admin-border-color)',
                            background: !selectedTag ? 'rgba(79, 70, 229, 0.08)' : 'var(--admin-bg)',
                            color: !selectedTag ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        All Topics
                    </button>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: selectedTag === tag ? '1.5px solid var(--admin-primary)' : '1px solid var(--admin-border-color)',
                                background: selectedTag === tag ? 'rgba(79, 70, 229, 0.08)' : 'var(--admin-bg)',
                                color: selectedTag === tag ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
                                fontWeight: 500,
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            #{tag}
                        </button>
                    ))}
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
                        onClick={fetchPosts}
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
                                height: '100px',
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

            {/* Empty state */}
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
                        {searchTerm ? 'No Threads Match Your Search' : 'No Forum Questions Yet'}
                    </h3>
                    <p style={{ margin: '0 auto 16px auto', maxWidth: '380px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                        {searchTerm
                            ? `We couldn't find any threads matching "${searchTerm}". Try another search.`
                            : 'Have a coding question or conceptual doubt? Ask the community and mentors!'}
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
                        + Ask First Question
                    </button>
                </div>
            )}

            {/* Threads List */}
            {!loading && filteredPosts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filteredPosts.map(post => {
                        const isExpanded = expandedPostId === post.id;

                        return (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'var(--admin-surface)',
                                    borderRadius: '12px',
                                    border: isExpanded ? '1.5px solid var(--admin-primary)' : '1.5px solid var(--admin-border-color)',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    boxShadow: 'var(--shadow-card)',
                                    transition: 'border-color 0.15s ease'
                                }}
                            >
                                {/* Author Strip */}
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
                                                    {post.author?.name || 'Community Member'}
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
                                </div>

                                {/* Title & Body */}
                                <div>
                                    <h3
                                        onClick={() => toggleExpandPost(post.id)}
                                        style={{
                                            margin: '0 0 6px 0',
                                            fontSize: '15.5px',
                                            fontWeight: 600,
                                            color: 'var(--admin-text-primary)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {post.title}
                                    </h3>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '13px',
                                        color: 'var(--admin-text-secondary)',
                                        lineHeight: 1.5,
                                        display: isExpanded ? 'block' : '-webkit-box',
                                        WebkitLineClamp: isExpanded ? 'unset' : 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {post.content}
                                    </p>
                                </div>

                                {/* Tags & Controls */}
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
                                            onClick={(e) => handleUpvotePost(e, post.id)}
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

                                        <button
                                            onClick={() => toggleExpandPost(post.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--admin-text-secondary)',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            <FiMessageSquare size={13} /> {post.answersCount || 0} answers
                                        </button>

                                        <button
                                            onClick={() => toggleExpandPost(post.id)}
                                            style={{
                                                padding: '5px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--admin-border-color)',
                                                background: isExpanded ? 'var(--admin-primary)' : 'var(--admin-bg)',
                                                color: isExpanded ? '#ffffff' : 'var(--admin-text-primary)',
                                                fontWeight: 600,
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {isExpanded ? 'Hide Replies' : 'View Answers'}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Answers View */}
                                {isExpanded && (
                                    <div style={{
                                        marginTop: '16px',
                                        paddingTop: '16px',
                                        borderTop: '1px solid var(--admin-border-color)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '14px'
                                    }}>
                                        <div style={{
                                            fontSize: '13.5px',
                                            fontWeight: 600,
                                            color: 'var(--admin-text-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <FiCornerDownRight size={15} style={{ color: 'var(--admin-primary)' }} />
                                            Responses ({activePostDetails?.answers?.length || 0})
                                        </div>

                                        {loadingDetails ? (
                                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                                                Loading answers...
                                            </div>
                                        ) : (activePostDetails?.answers || []).length === 0 ? (
                                            <div style={{
                                                padding: '16px',
                                                textAlign: 'center',
                                                color: 'var(--admin-text-muted)',
                                                border: '1px dashed var(--admin-border-color)',
                                                borderRadius: '8px',
                                                fontSize: '12.5px'
                                            }}>
                                                No answers yet. Share your knowledge or wait for a mentor response!
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {activePostDetails.answers.map(ans => {
                                                    const isMentor = ans.author?.role === 'MENTOR';

                                                    return (
                                                        <div
                                                            key={ans.id}
                                                            style={{
                                                                padding: '14px',
                                                                borderRadius: '8px',
                                                                border: isMentor ? '1.5px solid rgba(79, 70, 229, 0.3)' : '1px solid var(--admin-border-color)',
                                                                background: isMentor ? 'rgba(79, 70, 229, 0.02)' : 'var(--admin-bg)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <img
                                                                        src={ans.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ans.author?.id || 'ans'}`}
                                                                        alt={ans.author?.name}
                                                                        style={{ width: '26px', height: '26px', borderRadius: '50%' }}
                                                                    />
                                                                    <span style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--admin-text-primary)' }}>
                                                                        {ans.author?.name || 'Peer Response'}
                                                                    </span>
                                                                    {isMentor && (
                                                                        <span style={{
                                                                            fontSize: '10px',
                                                                            fontWeight: 600,
                                                                            padding: '1px 6px',
                                                                            borderRadius: '4px',
                                                                            background: 'rgba(79, 70, 229, 0.1)',
                                                                            color: 'var(--admin-primary)'
                                                                        }}>
                                                                            Verified Mentor
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    onClick={() => handleUpvoteAnswer(ans.id)}
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        color: 'var(--admin-text-secondary)',
                                                                        cursor: 'pointer',
                                                                        fontSize: '11.5px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    <FiThumbsUp size={11} /> {ans.upvotes || 0}
                                                                </button>
                                                            </div>

                                                            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--admin-text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                                                {ans.content}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Reply Box */}
                                        <form
                                            onSubmit={handlePostReply}
                                            style={{ display: 'flex', gap: '8px', marginTop: '6px' }}
                                        >
                                            <input
                                                type="text"
                                                required
                                                placeholder="Contribute your solution or answer..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    fontSize: '12.5px',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid var(--admin-border-color)',
                                                    background: 'var(--admin-bg)',
                                                    color: 'var(--admin-text-primary)',
                                                    outline: 'none'
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={submittingReply || !replyText.trim()}
                                                style={{
                                                    padding: '0 16px',
                                                    borderRadius: '8px',
                                                    background: 'var(--admin-primary)',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    fontWeight: 600,
                                                    fontSize: '12.5px',
                                                    cursor: (submittingReply || !replyText.trim()) ? 'not-allowed' : 'pointer',
                                                    opacity: (submittingReply || !replyText.trim()) ? 0.7 : 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <FiSend size={12} /> Reply
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Question Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)} style={{ zIndex: 1100 }}>
                    <div
                        className="modal-content"
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
                                    Ask the Community
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
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

                        <form onSubmit={handleCreatePost}>
                            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {createError && (
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
                                        <FiAlertCircle size={15} /> {createError}
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                        Question Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. How do I prevent unnecessary re-renders in useEffect?"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
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
                                        Details & Code Context *
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Describe what you tried, the error message, and what behavior you expected..."
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
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
                                        Tags (Comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="React, Hooks, Performance"
                                        value={newTags}
                                        onChange={(e) => setNewTags(e.target.value)}
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
                                    onClick={() => setShowCreateModal(false)}
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
                                    disabled={creating}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '8px',
                                        background: 'var(--admin-primary)',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        cursor: creating ? 'not-allowed' : 'pointer',
                                        opacity: creating ? 0.7 : 1
                                    }}
                                >
                                    {creating ? 'Posting...' : 'Post Question'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forum;
