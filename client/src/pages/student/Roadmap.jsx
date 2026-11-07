import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMap,
    FiClock,
    FiPlus,
    FiList,
    FiTrash2,
    FiTarget,
    FiChevronDown,
    FiChevronUp,
    FiBookOpen,
    FiCheckCircle,
    FiCompass,
    FiArrowRight,
    FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { roadmapAPI, getApiErrorMessage } from '../../api';

const Roadmap = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'

    // Generation State
    const [topic, setTopic] = useState('');
    const [days, setDays] = useState(14);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    // Data State
    const [currentRoadmap, setCurrentRoadmap] = useState(null);
    const [historyList, setHistoryList] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Timeline state
    const [expandedDays, setExpandedDays] = useState({ 0: true });

    useEffect(() => {
        fetchHistory(false);
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory(true);
        }
    }, [activeTab]);

    const fetchHistory = async (showLoading = true) => {
        if (showLoading) setIsLoadingHistory(true);
        try {
            const res = await roadmapAPI.getHistory();
            if (res.success && Array.isArray(res.data)) {
                setHistoryList(res.data);
                // If no current roadmap is open and history exists, load the latest one
                if (!currentRoadmap && res.data.length > 0 && activeTab === 'current') {
                    setCurrentRoadmap(res.data[0]);
                }
            }
        } catch (err) {
            console.error('Failed to load roadmap history', err);
        } finally {
            if (showLoading) setIsLoadingHistory(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const res = await roadmapAPI.generate(topic.trim(), days);
            if (res.success && res.data) {
                setCurrentRoadmap(res.data);
                setExpandedDays({ 0: true });
                setActiveTab('current');
                fetchHistory(false);
            }
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to generate roadmap. Please check your connection and try again.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNewRoadmap = () => {
        setCurrentRoadmap(null);
        setTopic('');
        setDays(14);
        setActiveTab('current');
        setExpandedDays({ 0: true });
        setError(null);
    };

    const handleViewHistoryItem = (item) => {
        setCurrentRoadmap(item);
        setActiveTab('current');
        setExpandedDays({ 0: true });
    };

    const handleDeleteHistory = async (e, id) => {
        e.stopPropagation();
        try {
            await roadmapAPI.delete(id);
            setHistoryList(prev => prev.filter(item => item.id !== id));
            if (currentRoadmap?.id === id) {
                setCurrentRoadmap(null);
            }
        } catch (err) {
            console.error('Failed to delete roadmap', err);
        }
    };

    const toggleDay = (index) => {
        setExpandedDays(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const toggleAllDays = (expand) => {
        if (!currentRoadmap?.content?.days) return;
        const newExpanded = {};
        currentRoadmap.content.days.forEach((_, idx) => {
            newExpanded[idx] = expand;
        });
        setExpandedDays(newExpanded);
    };

    const quickTopics = [
        'React & Next.js Masterclass',
        'Full Stack Node.js & Express',
        'Data Structures & Algorithms in Python',
        'Cloud Computing & Docker Essentials'
    ];

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '28px 24px 60px 24px',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Top Header matching Admin/Mentor standard */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '28px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'var(--admin-text-primary)',
                        margin: '0 0 6px 0',
                        letterSpacing: '-0.02em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <FiTarget style={{ color: 'var(--admin-primary)' }} /> AI Learning Roadmap
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--admin-text-secondary)'
                    }}>
                        Enter any skill or target stack and let Gemini map out an interactive, step-by-step curriculum.
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--admin-surface)',
                    border: '1.5px solid var(--admin-border-color)',
                    padding: '4px',
                    borderRadius: '10px'
                }}>
                    <button
                        onClick={() => setActiveTab('current')}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'current' ? 'var(--admin-primary)' : 'transparent',
                            color: activeTab === 'current' ? '#ffffff' : 'var(--admin-text-secondary)',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <FiTarget size={15} /> Current Roadmap
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'history' ? 'var(--admin-primary)' : 'transparent',
                            color: activeTab === 'history' ? '#ffffff' : 'var(--admin-text-secondary)',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <FiList size={15} /> History {historyList.length > 0 && `(${historyList.length})`}
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <main>
                <AnimatePresence mode="wait">
                    {/* CURRENT ROADMAP TAB */}
                    {activeTab === 'current' && (
                        <motion.div
                            key="current"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.2 }}
                        >
                            {!currentRoadmap ? (
                                /* INPUT GENERATION CARD */
                                <div style={{
                                    background: 'var(--admin-surface)',
                                    borderRadius: '16px',
                                    border: '1.5px solid var(--admin-border-color)',
                                    padding: '40px 32px',
                                    maxWidth: '680px',
                                    margin: '20px auto',
                                    boxShadow: 'var(--shadow-card)',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
                                            <FiCompass size={28} />
                                        </div>
                                        <h2 style={{
                                            fontSize: '22px',
                                            fontWeight: 700,
                                            color: 'var(--admin-text-primary)',
                                            margin: '0 0 8px 0'
                                        }}>
                                            What skill do you want to conquer?
                                        </h2>
                                        <p style={{
                                            fontSize: '14px',
                                            color: 'var(--admin-text-secondary)',
                                            margin: 0,
                                            lineHeight: 1.5
                                        }}>
                                            Gemini AI will structure a tailored day-by-day learning schedule with topics and milestones.
                                        </p>
                                    </div>

                                    {error && (
                                        <div style={{
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            border: '1px solid rgba(239, 68, 68, 0.25)',
                                            color: 'var(--admin-danger)',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            marginBottom: '24px'
                                        }}>
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleGenerate}>
                                        <div style={{ marginBottom: '22px' }}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: 'var(--admin-text-primary)',
                                                marginBottom: '8px'
                                            }}>
                                                Topic / Technology / Career Target
                                            </label>
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g. Full Stack Web Development with React and Node.js"
                                                required
                                                disabled={isGenerating}
                                                style={{
                                                    width: '100%',
                                                    padding: '13px 16px',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid var(--admin-border-color)',
                                                    background: 'var(--admin-bg)',
                                                    color: 'var(--admin-text-primary)',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>

                                        {/* Quick Suggested Topics */}
                                        <div style={{ marginBottom: '24px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '8px' }}>
                                                Suggested Targets:
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {quickTopics.map((item) => (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onClick={() => setTopic(item)}
                                                        disabled={isGenerating}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--admin-border-color)',
                                                            background: topic === item ? 'rgba(79, 70, 229, 0.1)' : 'var(--admin-bg)',
                                                            color: topic === item ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        {item}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '28px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '10px'
                                            }}>
                                                <label style={{
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: 'var(--admin-text-primary)'
                                                }}>
                                                    Plan Duration (Days)
                                                </label>
                                                <span style={{
                                                    background: 'rgba(79, 70, 229, 0.1)',
                                                    color: 'var(--admin-primary)',
                                                    padding: '4px 12px',
                                                    borderRadius: '16px',
                                                    fontWeight: 700,
                                                    fontSize: '12px'
                                                }}>
                                                    {days} Days
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <input
                                                    type="range"
                                                    min="3"
                                                    max="45"
                                                    value={days}
                                                    onChange={(e) => setDays(Number(e.target.value))}
                                                    disabled={isGenerating}
                                                    style={{
                                                        flex: 1,
                                                        accentColor: 'var(--admin-primary)',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '11px',
                                                color: 'var(--admin-text-secondary)',
                                                marginTop: '6px'
                                            }}>
                                                <span>3 Days (Sprint)</span>
                                                <span>14 Days (Standard)</span>
                                                <span>45 Days (Mastery)</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isGenerating || !topic.trim()}
                                            style={{
                                                width: '100%',
                                                padding: '13px',
                                                borderRadius: '10px',
                                                background: 'var(--admin-primary)',
                                                color: '#ffffff',
                                                border: 'none',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                cursor: isGenerating || !topic.trim() ? 'not-allowed' : 'pointer',
                                                opacity: isGenerating || !topic.trim() ? 0.7 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <FiRefreshCw className="spin-animation" size={16} /> Generating AI Roadmap...
                                                </>
                                            ) : (
                                                <>
                                                    Generate Learning Roadmap <FiArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                /* ACTIVE ROADMAP TIMELINE */
                                <div>
                                    {/* Roadmap Header Summary Card */}
                                    <div style={{
                                        background: 'var(--admin-surface)',
                                        borderRadius: '14px',
                                        border: '1.5px solid var(--admin-border-color)',
                                        padding: '24px 28px',
                                        marginBottom: '24px',
                                        boxShadow: 'var(--shadow-card)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        flexWrap: 'wrap',
                                        gap: '20px'
                                    }}>
                                        <div style={{ flex: 1, minWidth: '280px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <span style={{
                                                    background: 'rgba(79, 70, 229, 0.1)',
                                                    color: 'var(--admin-primary)',
                                                    padding: '3px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.04em',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {currentRoadmap.days} Days Plan
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                                                    Created {currentRoadmap.createdAt ? new Date(currentRoadmap.createdAt).toLocaleDateString() : 'Just now'}
                                                </span>
                                            </div>
                                            <h2 style={{
                                                fontSize: '20px',
                                                fontWeight: 700,
                                                color: 'var(--admin-text-primary)',
                                                margin: '0 0 8px 0'
                                            }}>
                                                {currentRoadmap.content?.title || currentRoadmap.topic}
                                            </h2>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                color: 'var(--admin-text-secondary)',
                                                lineHeight: 1.5,
                                                maxWidth: '750px'
                                            }}>
                                                {currentRoadmap.content?.description || `Personalized ${currentRoadmap.days}-day structured path for mastering ${currentRoadmap.topic}.`}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button
                                                onClick={() => toggleAllDays(true)}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid var(--admin-border-color)',
                                                    background: 'var(--admin-bg)',
                                                    color: 'var(--admin-text-secondary)',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Expand All
                                            </button>
                                            <button
                                                onClick={() => toggleAllDays(false)}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '8px',
                                                    border: '1.5px solid var(--admin-border-color)',
                                                    background: 'var(--admin-bg)',
                                                    color: 'var(--admin-text-secondary)',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Collapse All
                                            </button>
                                            <button
                                                onClick={handleNewRoadmap}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    background: 'var(--admin-primary)',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <FiPlus size={15} /> New Target
                                            </button>
                                        </div>
                                    </div>

                                    {/* Timeline Items */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {Array.isArray(currentRoadmap.content?.days) && currentRoadmap.content.days.length > 0 ? (
                                            currentRoadmap.content.days.map((dayNode, index) => {
                                                const isExpanded = !!expandedDays[index];

                                                return (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.03 }}
                                                        style={{
                                                            background: 'var(--admin-surface)',
                                                            borderRadius: '12px',
                                                            border: isExpanded ? '1.5px solid var(--admin-primary)' : '1.5px solid var(--admin-border-color)',
                                                            overflow: 'hidden',
                                                            boxShadow: 'var(--shadow-card)',
                                                            transition: 'border-color 0.15s ease'
                                                        }}
                                                    >
                                                        {/* Clickable Day Strip */}
                                                        <div
                                                            onClick={() => toggleDay(index)}
                                                            style={{
                                                                padding: '16px 20px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                cursor: 'pointer',
                                                                userSelect: 'none',
                                                                background: isExpanded ? 'rgba(79, 70, 229, 0.02)' : 'transparent'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                                                <span style={{
                                                                    padding: '5px 12px',
                                                                    borderRadius: '6px',
                                                                    background: isExpanded ? 'var(--admin-primary)' : 'rgba(79, 70, 229, 0.08)',
                                                                    color: isExpanded ? '#ffffff' : 'var(--admin-primary)',
                                                                    fontSize: '12px',
                                                                    fontWeight: 700
                                                                }}>
                                                                    Day {dayNode.day || index + 1}
                                                                </span>
                                                                <h3 style={{
                                                                    margin: 0,
                                                                    fontSize: '15px',
                                                                    fontWeight: 600,
                                                                    color: 'var(--admin-text-primary)'
                                                                }}>
                                                                    {dayNode.title}
                                                                </h3>
                                                            </div>

                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                color: 'var(--admin-text-secondary)'
                                                            }}>
                                                                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                                                                    {dayNode.topics?.length ? `${dayNode.topics.length} topics` : ''}
                                                                </span>
                                                                {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                                            </div>
                                                        </div>

                                                        {/* Expanded Day Details */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    style={{
                                                                        padding: '0 20px 20px 20px',
                                                                        borderTop: '1px solid var(--admin-border-color)'
                                                                    }}
                                                                >
                                                                    <p style={{
                                                                        marginTop: '16px',
                                                                        marginBottom: '16px',
                                                                        fontSize: '14px',
                                                                        color: 'var(--admin-text-secondary)',
                                                                        lineHeight: 1.6
                                                                    }}>
                                                                        {dayNode.description}
                                                                    </p>

                                                                    {Array.isArray(dayNode.topics) && dayNode.topics.length > 0 && (
                                                                        <div>
                                                                            <h4 style={{
                                                                                margin: '0 0 10px 0',
                                                                                fontSize: '13px',
                                                                                fontWeight: 600,
                                                                                color: 'var(--admin-text-primary)',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '6px'
                                                                            }}>
                                                                                <FiBookOpen size={14} style={{ color: 'var(--admin-primary)' }} />
                                                                                Key Learning Points:
                                                                            </h4>
                                                                            <div style={{
                                                                                display: 'grid',
                                                                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                                                                gap: '8px'
                                                                            }}>
                                                                                {dayNode.topics.map((t, idx) => (
                                                                                    <div
                                                                                        key={idx}
                                                                                        style={{
                                                                                            padding: '8px 12px',
                                                                                            borderRadius: '8px',
                                                                                            background: 'var(--admin-bg)',
                                                                                            border: '1px solid var(--admin-border-color)',
                                                                                            fontSize: '13px',
                                                                                            color: 'var(--admin-text-primary)',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '8px'
                                                                                        }}
                                                                                    >
                                                                                        <FiCheckCircle size={14} style={{ color: 'var(--admin-success)', flexShrink: 0 }} />
                                                                                        <span>{t}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {Array.isArray(dayNode.tasks) && dayNode.tasks.length > 0 && (
                                                                        <div style={{ marginTop: '14px' }}>
                                                                            <h4 style={{
                                                                                margin: '0 0 10px 0',
                                                                                fontSize: '13px',
                                                                                fontWeight: 600,
                                                                                color: 'var(--admin-text-primary)',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '6px'
                                                                            }}>
                                                                                <FiTarget size={14} style={{ color: 'var(--admin-warning, #F59E0B)' }} />
                                                                                Practical Exercises & Deliverables:
                                                                            </h4>
                                                                            <div style={{
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                gap: '6px'
                                                                            }}>
                                                                                {dayNode.tasks.map((task, tidx) => (
                                                                                    <div
                                                                                        key={tidx}
                                                                                        style={{
                                                                                            padding: '8px 12px',
                                                                                            borderRadius: '8px',
                                                                                            background: 'rgba(245, 158, 11, 0.05)',
                                                                                            border: '1px solid rgba(245, 158, 11, 0.15)',
                                                                                            fontSize: '13px',
                                                                                            color: 'var(--admin-text-primary)',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '8px'
                                                                                        }}
                                                                                    >
                                                                                        <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '11px' }}>#{tidx + 1}</span>
                                                                                        <span>{task}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <div style={{
                                                padding: '40px',
                                                textAlign: 'center',
                                                background: 'var(--admin-surface)',
                                                borderRadius: '12px',
                                                border: '1.5px solid var(--admin-border-color)',
                                                color: 'var(--admin-text-secondary)'
                                            }}>
                                                No daily modules found in this roadmap.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isLoadingHistory ? (
                                <div style={{
                                    padding: '60px 20px',
                                    textAlign: 'center',
                                    background: 'var(--admin-surface)',
                                    borderRadius: '14px',
                                    border: '1.5px solid var(--admin-border-color)'
                                }}>
                                    <FiRefreshCw className="spin-animation" size={28} style={{ color: 'var(--admin-primary)', marginBottom: '12px' }} />
                                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--admin-text-secondary)' }}>
                                        Loading saved roadmaps...
                                    </p>
                                </div>
                            ) : historyList.length === 0 ? (
                                <div style={{
                                    padding: '60px 20px',
                                    textAlign: 'center',
                                    background: 'var(--admin-surface)',
                                    borderRadius: '14px',
                                    border: '1.5px dashed var(--admin-border-color)'
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
                                        <FiClock size={28} />
                                    </div>
                                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                        No Roadmap History
                                    </h3>
                                    <p style={{ margin: '0 auto 18px auto', maxWidth: '360px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                                        You haven't generated any AI study plans yet. Create one today to get a customized learning path!
                                    </p>
                                    <button
                                        onClick={handleNewRoadmap}
                                        style={{
                                            padding: '9px 20px',
                                            borderRadius: '8px',
                                            background: 'var(--admin-primary)',
                                            color: '#ffffff',
                                            border: 'none',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        + Generate First Roadmap
                                    </button>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                    gap: '16px'
                                }}>
                                    {historyList.map(item => (
                                        <motion.div
                                            key={item.id}
                                            whileHover={{ y: -3 }}
                                            onClick={() => handleViewHistoryItem(item)}
                                            style={{
                                                background: 'var(--admin-surface)',
                                                borderRadius: '12px',
                                                border: currentRoadmap?.id === item.id ? '1.5px solid var(--admin-primary)' : '1.5px solid var(--admin-border-color)',
                                                padding: '20px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                boxShadow: 'var(--shadow-card)',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <span style={{
                                                        background: 'rgba(79, 70, 229, 0.1)',
                                                        color: 'var(--admin-primary)',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 700
                                                    }}>
                                                        {item.days} Days
                                                    </span>
                                                    <button
                                                        onClick={(e) => handleDeleteHistory(e, item.id)}
                                                        title="Delete roadmap"
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--admin-text-secondary)',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        <FiTrash2 size={15} />
                                                    </button>
                                                </div>
                                                <h3 style={{
                                                    margin: '0 0 6px 0',
                                                    fontSize: '16px',
                                                    fontWeight: 600,
                                                    color: 'var(--admin-text-primary)'
                                                }}>
                                                    {item.topic}
                                                </h3>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '13px',
                                                    color: 'var(--admin-text-secondary)',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {item.content?.description || `Personalized learning path covering ${item.topic}.`}
                                                </p>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: '16px',
                                                paddingTop: '12px',
                                                borderTop: '1px solid var(--admin-border-color)',
                                                fontSize: '12px',
                                                color: 'var(--admin-text-secondary)'
                                            }}>
                                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                <span style={{ color: 'var(--admin-primary)', fontWeight: 600 }}>
                                                    View Plan →
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Roadmap;
