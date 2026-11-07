import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Video, FileText, Calendar, ChevronRight,
    Clock, Plus, MessageSquare, TrendingUp, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useMentorBatches, useMentorMeetings } from '../../../hooks/mentor/useMentorQueries';
import { useAuth } from '../../../context/AuthContext';

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

const PerformanceChart = () => {
    const data = [
        { label: 'Mon', value: 65 },
        { label: 'Tue', value: 45 },
        { label: 'Wed', value: 85 },
        { label: 'Thu', value: 35 },
        { label: 'Fri', value: 90 },
        { label: 'Sat', value: 55 },
        { label: 'Sun', value: 75 },
    ];

    return (
        <div className="chart-placeholder">
            {data.map((item, i) => (
                <div key={i} className="chart-bar-wrap">
                    <div
                        className="chart-bar"
                        style={{ height: `${item.value}%` }}
                        data-value={`${item.value}%`}
                    />
                    <span className="chart-label">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const Overview = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: batchesData, isLoading: isLoadingBatches, isError: isBatchesError } = useMentorBatches();
    const { data: meetingsData, isLoading: isLoadingMeetings, isError: isMeetingsError } = useMentorMeetings({ limit: 5, filter: 'upcoming' });

    const batches = Array.isArray(batchesData) ? batchesData : [];
    const totalStudents = batches.reduce((acc, b) => acc + (b.studentsCount ?? b.studentCount ?? 0), 0);
    const totalBatches = batches.length;
    const totalResources = batches.reduce((acc, b) => acc + (b.resourcesCount ?? 0), 0);
    const upcomingMeetings = Array.isArray(meetingsData) ? meetingsData : (meetingsData?.items ?? []);

    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (isBatchesError || isMeetingsError) {
        return (
            <div className="m-section">
                <div className="m-empty-state">
                    <p className="m-empty-state__desc">Failed to load dashboard. Please refresh the page.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* 1. ENTERPRISE HEADER LIKE ADMIN SECTION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h1 className="page-title-enterprise" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--admin-text-primary, #111827)', margin: 0 }}>
                        👋 Hello, {user?.name?.split(' ')[0] || 'Mentor'}!
                    </h1>
                    <p className="page-subtitle-enterprise" style={{ fontSize: '14px', color: 'var(--admin-text-secondary, #6B7280)', margin: 0 }}>
                        {currentDate} · {currentTime}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge badge-primary" style={{ padding: '6px 14px', borderRadius: '8px', background: '#EEF2FF', color: '#4F46E5', fontWeight: '600', fontSize: '13px' }}>
                        Live Mentor Workspace
                    </span>
                    <button
                        className="btn-admin-primary"
                        style={{ height: '38px', padding: '0 16px', fontSize: '13.5px' }}
                        onClick={() => navigate('/mentor/sessions')}
                    >
                        <Plus size={16} /> New Session
                    </button>
                </div>
            </div>

            {/* 2. STAT CARDS EXACTLY LIKE ADMIN SECTION */}
            <div className="stats-grid" style={{ marginBottom: '8px' }}>
                <div className="stat-card-enterprise">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.08)', color: '#4F46E5' }}>
                            <Users size={20} />
                        </div>
                        <span className="stat-label-enterprise">Total Mentees</span>
                    </div>
                    <span className="stat-val-enterprise"><CountUp value={totalStudents} /></span>
                </div>

                <div className="stat-card-enterprise">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                            <Video size={20} />
                        </div>
                        <span className="stat-label-enterprise">Active Batches</span>
                    </div>
                    <span className="stat-val-enterprise"><CountUp value={totalBatches} /></span>
                </div>

                <div className="stat-card-enterprise">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                            <FileText size={20} />
                        </div>
                        <span className="stat-label-enterprise">Total Resources</span>
                    </div>
                    <span className="stat-val-enterprise"><CountUp value={totalResources} /></span>
                </div>

                <div className="stat-card-enterprise">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                            <Calendar size={20} />
                        </div>
                        <span className="stat-label-enterprise">Scheduled Meetings</span>
                    </div>
                    <span className="stat-val-enterprise"><CountUp value={upcomingMeetings.length} /></span>
                </div>
            </div>

            {/* 3. MAIN DASHBOARD CONTENT GRID */}
            <div className="dashboard-grid">
                <div className="dashboard-main">
                    {/* Performance & Attention Section */}
                    <section className="performance-section">
                        <div className="m-card performance-card" style={{ background: 'var(--admin-surface, #fff)', border: '1px solid var(--admin-border-color, #E5E7EB)', borderRadius: '14px', padding: '24px' }}>
                            <div className="flex-between" style={{ marginBottom: 'var(--space-20)' }}>
                                <h3 className="m-section-title" style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--admin-text-primary)' }}>
                                    <TrendingUp size={18} style={{ marginRight: '8px' }} />
                                    Weekly Engagement Overview
                                </h3>
                                <div className="m-badge m-badge--info">Last 7 Days</div>
                            </div>
                            <PerformanceChart />
                            <div className="stat-grid-v2" style={{ marginTop: 'var(--space-24)', gap: 'var(--space-12)' }}>
                                <div>
                                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--admin-text-muted)' }}>Completion Rate</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>94%</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--admin-text-muted)' }}>Avg. Assessment Score</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>8.4 / 10</div>
                                </div>
                            </div>
                        </div>

                        <div className="m-card" style={{ background: 'var(--admin-surface, #fff)', border: '1px solid var(--admin-border-color, #E5E7EB)', borderRadius: '14px', padding: '24px' }}>
                            <h3 className="m-section-title" style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: 'var(--admin-text-primary)' }}>
                                <AlertCircle size={18} style={{ marginRight: '8px' }} />
                                Attention Needed
                            </h3>
                            <div className="risk-list">
                                {[
                                    { name: 'Aman Kumar', risk: 'High', color: 'danger' },
                                    { name: 'Priya Singh', risk: 'Medium', color: 'warning' },
                                    { name: 'Rahul Verma', risk: 'Low', color: 'info' },
                                ].map((student, i) => (
                                    <div key={i} className="risk-item" style={{ padding: '10px 0', borderBottom: '1px solid var(--admin-border-color)' }}>
                                        <div className="m-user-row">
                                            <div className="m-user-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {student.name[0]}
                                            </div>
                                            <div>
                                                <div className="m-user-name" style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--admin-text-primary)' }}>{student.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>7d Inactive</div>
                                            </div>
                                        </div>
                                        <div className={`m-badge m-badge--${student.color}`}>{student.risk}</div>
                                    </div>
                                ))}
                            </div>
                            <button
                                className="btn-admin-outline"
                                style={{ width: '100%', marginTop: '16px', height: '38px', fontSize: '13px', justifyContent: 'center' }}
                                onClick={() => navigate('/mentor/mentorship')}
                            >
                                View All Students
                            </button>
                        </div>
                    </section>

                    {/* Upcoming Meetings Section */}
                    <section className="m-card" style={{ background: 'var(--admin-surface, #fff)', border: '1px solid var(--admin-border-color, #E5E7EB)', borderRadius: '14px', padding: '24px' }}>
                        <div className="flex-between" style={{ marginBottom: 'var(--space-20)' }}>
                            <h3 className="m-section-title" style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--admin-text-primary)' }}>
                                <Calendar size={18} style={{ marginRight: '8px' }} />
                                Upcoming Meetings
                            </h3>
                            <button className="btn-admin-outline" style={{ height: '32px', padding: '0 12px', fontSize: '12px' }} onClick={() => navigate('/mentor/batches')}>
                                View All Batches
                            </button>
                        </div>

                        {isLoadingMeetings ? (
                            <div className="meetings-grid-v2">
                                {[1, 2].map(i => <div key={i} className="m-skeleton m-skeleton--h80" />)}
                            </div>
                        ) : upcomingMeetings.length > 0 ? (
                            <div className="meetings-grid-v2">
                                {upcomingMeetings.map((mtg) => (
                                    <div key={mtg.id} className="meeting-card-v2" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border-color)', borderRadius: '10px', padding: '16px' }}>
                                        <div className="meeting-user">
                                            <div className="m-user-avatar meeting-avatar" style={{ borderRadius: '50%', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontWeight: 'bold' }}>
                                                {(mtg.title || 'M')[0]}
                                            </div>
                                            <div className="meeting-info">
                                                <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--admin-text-primary)' }}>{mtg.title}</h4>
                                                <div className="meeting-time-wrap" style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                                    <Clock size={14} />
                                                    <span>{new Date(mtg.scheduled_at || mtg.meetingDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="countdown-badge">Scheduled</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="meeting-actions">
                                            {mtg.meeting_link && (
                                                <a href={mtg.meeting_link} target="_blank" rel="noreferrer" className="btn-admin-primary" style={{ height: '32px', padding: '0 12px', fontSize: '12px', textDecoration: 'none' }}>
                                                    Join Call
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="m-empty-state" style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                <Calendar size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontSize: '14px' }}>No live meetings scheduled for today.</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* 4. ACTIVITY FEED (RIGHT SIDEBAR) */}
                <aside className="m-card dashboard-sidebar" style={{ background: 'var(--admin-surface, #fff)', border: '1px solid var(--admin-border-color, #E5E7EB)', borderRadius: '14px', padding: '24px' }}>
                    <h3 className="m-section-title" style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: 'var(--admin-text-primary)' }}>
                        <TrendingUp size={18} style={{ marginRight: '8px' }} />
                        Recent Activity
                    </h3>
                    <div className="timeline">
                        {[
                            { title: 'Assignment Reviewed', desc: 'Reviewed Web Architecture task for Anita', time: '15m ago', icon: CheckCircle2 },
                            { title: 'New Mentee Joined', desc: 'Prasad Wadkar joined Full Stack 2026', time: '1h ago', icon: Users },
                            { title: 'Session Live', desc: 'Decoupled Drupal 11 Overview uploaded', time: '3h ago', icon: Video },
                            { title: 'Cohort Notice Broadcasted', desc: 'Upcoming holiday schedule published', time: 'Yesterday', icon: FileText },
                        ].map((item, i) => (
                            <div key={i} className="timeline-item" style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--admin-border-color)' }}>
                                <div className="timeline-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F46E5', marginTop: '6px' }} />
                                <div className="timeline-content">
                                    <div className="timeline-title" style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--admin-text-primary)' }}>{item.title}</div>
                                    <div className="timeline-time" style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginBottom: '2px' }}>{item.time}</div>
                                    <div className="timeline-desc" style={{ fontSize: '12.5px', color: 'var(--admin-text-secondary)' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Overview;
