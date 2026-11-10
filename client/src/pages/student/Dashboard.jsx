import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiCheckCircle,
    FiBookOpen,
    FiTrendingUp,
    FiCalendar,
    FiFileText,
    FiVideo,
    FiClock,
    FiExternalLink,
    FiMessageCircle,
    FiBell,
    FiActivity,
    FiArrowRight,
    FiAlertCircle,
    FiRefreshCw
} from 'react-icons/fi';
import { userAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StudentAssignmentSection from '../../components/StudentAssignmentSection';
import StudentResourcesSection from '../../components/StudentResourcesSection';
import '../../pages/admin/AdminDashboard.css';
import './Dashboard.css';

// Animated CountUp for metric cards
const CountUp = ({ value, duration = 1200 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const targetVal = Number(value) || 0;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeProgress * targetVal));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setCount(targetVal);
            }
        };
        window.requestAnimationFrame(step);
    }, [value, duration]);

    return <span>{count}</span>;
};

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isAssignmentsView = location.pathname.includes('/assignments');
    const isResourcesView = location.pathname.includes('/resources');
    const isOverview = !isAssignmentsView && !isResourcesView;

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userAPI.getStudentDashboard();
            setDashboardData(response.data);
        } catch (err) {
            console.error('Failed to fetch student dashboard:', err);
            setError('Unable to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const {
        stats = {},
        upcomingSessions = [],
        announcements = [],
        batches = [],
        recentActivities = [],
        loginDates = []
    } = dashboardData || {};

    const activeBatch = batches[0] || null;

    // Collect all unique mentors assigned to the student's batches
    const assignedMentors = useMemo(() => {
        const list = [];
        const seen = new Set();
        if (Array.isArray(dashboardData?.mentors)) {
            dashboardData.mentors.forEach(m => {
                if (m && m.id && !seen.has(m.id)) {
                    seen.add(m.id);
                    list.push(m);
                }
            });
        }
        if (Array.isArray(batches)) {
            batches.forEach(b => {
                if (Array.isArray(b.mentors)) {
                    b.mentors.forEach(m => {
                        if (m && m.id && !seen.has(m.id)) {
                            seen.add(m.id);
                            list.push(m);
                        }
                    });
                } else if (b.mentor && !seen.has(b.mentor.id)) {
                    seen.add(b.mentor.id);
                    list.push(b.mentor);
                }
            });
        }
        return list;
    }, [dashboardData, batches]);

    const activeMentor = assignedMentors[0] || activeBatch?.mentor || null;

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isAssignmentsView) {
        return (
            <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <StudentAssignmentSection />
            </div>
        );
    }

    if (isResourcesView) {
        return (
            <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <StudentResourcesSection />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* 1. Header Section Matching Admin/Mentor Layout */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 600,
                        color: 'var(--admin-text-primary, #111827)',
                        margin: 0,
                        letterSpacing: '-0.02em'
                    }}>
                        👋 Hello, {user?.name?.split(' ')[0] || 'Student'}!
                    </h1>
                    <p style={{
                        fontSize: '13.5px',
                        color: 'var(--admin-text-secondary, #6B7280)',
                        margin: 0
                    }}>
                        {currentDate} · {currentTime}
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {activeBatch && (
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'rgba(79, 70, 229, 0.08)',
                            color: 'var(--admin-primary)',
                            fontWeight: 600,
                            fontSize: '13px',
                            border: '1px solid rgba(79, 70, 229, 0.2)'
                        }}>
                            Cohort: {activeBatch.name}
                        </span>
                    )}
                    <button
                        onClick={() => navigate('/student/assignments')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: 'var(--admin-primary)',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                        }}
                    >
                        <FiFileText size={15} /> My Tasks
                    </button>
                </div>
            </div>

            {/* Error Notification */}
            {error && (
                <div style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                        <FiAlertCircle size={20} />
                        <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{error}</span>
                    </div>
                    <button
                        onClick={fetchDashboard}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #ef4444',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* 2. Stat Cards Grid Matching Admin/Mentor Overview */}
            <div className="stats-grid" style={{ marginBottom: '8px' }}>
                {/* Attendance Card */}
                <div className="stat-card-enterprise">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                            <FiTrendingUp size={20} />
                        </div>
                        <span className="stat-label-enterprise">Attendance Rate</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span className="stat-val-enterprise">
                            <CountUp value={stats?.attendancePercentage ?? 0} />%
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                            ({stats?.attendanceCount || 0} of {stats?.totalCourses || 4} modules)
                        </span>
                    </div>
                </div>

                {/* Assignments Card */}
                <div className="stat-card-enterprise">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.08)', color: '#4F46E5' }}>
                            <FiCheckCircle size={20} />
                        </div>
                        <span className="stat-label-enterprise">Assignments</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span className="stat-val-enterprise">
                            <CountUp value={stats?.submittedAssignments || 0} />
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                            / {stats?.totalAssignments || 1} submitted
                        </span>
                    </div>
                </div>

                {/* Courses & Cohort Card */}
                <div className="stat-card-enterprise">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                            <FiBookOpen size={20} />
                        </div>
                        <span className="stat-label-enterprise">Learning Modules</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span className="stat-val-enterprise">
                            <CountUp value={stats?.totalCourses || 4} />
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                            active courses
                        </span>
                    </div>
                </div>

                {/* Learning Streak Card */}
                <div className="stat-card-enterprise">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                            <FiCalendar size={20} />
                        </div>
                        <span className="stat-label-enterprise">Active Streak</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span className="stat-val-enterprise">
                            <CountUp value={stats?.activeDays || loginDates.length || 1} />
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                            active days
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. Main Dashboard 2-Column Enterprise Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
                gap: '24px',
                alignItems: 'start'
            }} className="student-home-grid">
                {/* Left Column: Sessions & Announcements */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Live Sessions & Meetings */}
                    <div style={{
                        background: 'var(--admin-surface)',
                        borderRadius: '12px',
                        border: '1.5px solid var(--admin-border-color)',
                        padding: '20px',
                        boxShadow: 'var(--shadow-card)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'rgba(79, 70, 229, 0.08)',
                                    color: 'var(--admin-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FiVideo size={16} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                    Live Mentorship Sessions
                                </h3>
                            </div>
                            <button
                                onClick={() => navigate('/student/mentor')}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--admin-primary)',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                View Hub <FiArrowRight size={13} />
                            </button>
                        </div>

                        {upcomingSessions.length === 0 ? (
                            <div style={{
                                padding: '36px 16px',
                                textAlign: 'center',
                                color: 'var(--admin-text-muted)',
                                border: '1px dashed var(--admin-border-color)',
                                borderRadius: '10px'
                            }}>
                                <FiVideo size={28} style={{ opacity: 0.3, marginBottom: '6px' }} />
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>No upcoming meetings scheduled right now.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {upcomingSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--admin-border-color)',
                                            background: 'var(--admin-bg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img
                                                src={session.mentor?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.mentor?.name || 'mentor'}`}
                                                alt={session.mentor?.name}
                                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                                    {session.title}
                                                </h4>
                                                <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                                    <span>Mentor: {session.mentor?.name || 'Assigned Mentor'}</span>
                                                    <span>•</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--admin-primary)', fontWeight: 500 }}>
                                                        <FiClock size={12} /> {session.scheduledAt}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {session.meetingLink && (
                                            <a
                                                href={session.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    padding: '7px 14px',
                                                    borderRadius: '8px',
                                                    background: 'var(--admin-primary)',
                                                    color: '#ffffff',
                                                    fontSize: '12.5px',
                                                    fontWeight: 600,
                                                    textDecoration: 'none',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                Join Session <FiExternalLink size={13} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Announcements Feed */}
                    <div style={{
                        background: 'var(--admin-surface)',
                        borderRadius: '12px',
                        border: '1.5px solid var(--admin-border-color)',
                        padding: '20px',
                        boxShadow: 'var(--shadow-card)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                color: '#F59E0B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiBell size={16} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                Cohort Announcements
                            </h3>
                        </div>

                        {announcements.length === 0 ? (
                            <div style={{
                                padding: '32px 16px',
                                textAlign: 'center',
                                color: 'var(--admin-text-muted)',
                                border: '1px dashed var(--admin-border-color)',
                                borderRadius: '10px'
                            }}>
                                <div style={{ fontSize: '13px' }}>No announcements broadcasted yet.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {announcements.map((ann) => (
                                    <div
                                        key={ann.id}
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--admin-border-color)',
                                            background: 'var(--admin-bg)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--admin-text-primary)' }}>
                                                {ann.title}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                                            {ann.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Mentor Profile & Learning Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Mentor Card */}
                    <div style={{
                        background: 'var(--admin-surface)',
                        borderRadius: '12px',
                        border: '1.5px solid var(--admin-border-color)',
                        padding: '20px',
                        boxShadow: 'var(--shadow-card)'
                    }}>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--admin-primary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {assignedMentors.length > 1 ? `Assigned Mentors (${assignedMentors.length})` : 'Assigned Guidance'}
                        </span>
                        <h3 style={{ margin: '4px 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                            {assignedMentors.length > 1 ? 'Your Assigned Mentors' : 'Your Dedicated Mentor'}
                        </h3>

                        {assignedMentors.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {assignedMentors.map((mentor, mIdx) => (
                                    <div
                                        key={mentor.id || mIdx}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                            padding: assignedMentors.length > 1 ? '12px' : '0',
                                            background: assignedMentors.length > 1 ? 'var(--admin-bg)' : 'transparent',
                                            borderRadius: '10px',
                                            border: assignedMentors.length > 1 ? '1px solid var(--admin-border-color)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <img
                                                    src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`}
                                                    alt={mentor.name}
                                                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--admin-text-primary)' }}>
                                                        {mentor.name}
                                                    </div>
                                                    <div style={{ fontSize: '11.5px', color: 'var(--admin-text-secondary)' }}>
                                                        {mentor.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/student/chat/${mentor.id}`)}
                                                style={{
                                                    padding: '7px 12px',
                                                    borderRadius: '8px',
                                                    background: 'var(--admin-primary)',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={`Chat with ${mentor.name}`}
                                            >
                                                <FiMessageCircle size={14} /> Message
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <p style={{
                                    margin: 0,
                                    fontSize: '12px',
                                    color: 'var(--admin-text-secondary)',
                                    lineHeight: 1.5,
                                    padding: '8px 10px',
                                    background: 'var(--admin-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--admin-border-color)'
                                }}>
                                    Mentors provide 1-on-1 code reviews, curriculum doubt clearing, and career guidance.
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                padding: '24px 16px',
                                textAlign: 'center',
                                color: 'var(--admin-text-muted)',
                                border: '1px dashed var(--admin-border-color)',
                                borderRadius: '8px'
                            }}>
                                <div style={{ fontSize: '13px' }}>Mentor assignment in progress for your cohort.</div>
                            </div>
                        )}
                    </div>

                    {/* Recent Learning Activity */}
                    <div style={{
                        background: 'var(--admin-surface)',
                        borderRadius: '12px',
                        border: '1.5px solid var(--admin-border-color)',
                        padding: '20px',
                        boxShadow: 'var(--shadow-card)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10B981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiActivity size={16} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                Recent Learning Stream
                            </h3>
                        </div>

                        {recentActivities.length === 0 ? (
                            <div style={{
                                padding: '24px 16px',
                                textAlign: 'center',
                                color: 'var(--admin-text-muted)',
                                border: '1px dashed var(--admin-border-color)',
                                borderRadius: '8px'
                            }}>
                                <div style={{ fontSize: '13px' }}>No activities logged today. Explore lessons to begin tracking.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {recentActivities.slice(0, 4).map((act) => (
                                    <div
                                        key={act.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            background: 'var(--admin-bg)',
                                            border: '1px solid var(--admin-border-color)',
                                            fontSize: '12.5px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FiCheckCircle size={14} style={{ color: 'var(--admin-success, #10B981)' }} />
                                            <span style={{ color: 'var(--admin-text-primary)', fontWeight: 500 }}>
                                                {act.description}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                            {new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
