import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mentorshipAPI } from '../../api';
import {
    FiUsers,
    FiCalendar,
    FiMessageCircle,
    FiVideo,
    FiExternalLink,
    FiMail,
    FiPhone,
    FiClock,
    FiPlus,
    FiX,
    FiCheckCircle,
    FiAlertCircle,
    FiLayers,
    FiSend
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MentorProgram = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [mentorship, setMentorship] = useState(null);
    const [batches, setBatches] = useState([]);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTopic, setScheduleTopic] = useState('');
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleSuccess, setScheduleSuccess] = useState(false);

    useEffect(() => {
        fetchMentorshipData();
    }, []);

    const fetchMentorshipData = async () => {
        try {
            setLoading(true);
            const [mentorshipRes, batchesRes, upcomingRes] = await Promise.all([
                mentorshipAPI.get(),
                mentorshipAPI.getBatches(),
                mentorshipAPI.getMeetings('upcoming')
            ]);
            setMentorship(mentorshipRes.data);
            setBatches(Array.isArray(batchesRes.data) ? batchesRes.data : []);
            setUpcomingMeetings(Array.isArray(upcomingRes.data) ? upcomingRes.data : (upcomingRes.data?.items ?? []));
        } catch (error) {
            console.error('Failed to fetch mentorship data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleMeet = async (e) => {
        e.preventDefault();
        const mentor = mentorship?.mentor || (mentorship?.mentors && mentorship.mentors[0]) || batches[0]?.mentor;

        setScheduleLoading(true);
        try {
            await mentorshipAPI.createMeeting({
                mentorId: mentor?.id,
                scheduledAt: scheduleDate,
                meetingDate: scheduleDate,
                title: scheduleTopic || `1-on-1 Mentorship with ${user?.name || 'Student'}`,
                discussionSummary: scheduleTopic || `1-on-1 session requested by ${user?.name || 'Student'}`
            });
            setScheduleSuccess(true);
            setTimeout(() => {
                setShowScheduleModal(false);
                setScheduleSuccess(false);
                setScheduleDate('');
                setScheduleTopic('');
                fetchMentorshipData();
            }, 1200);
        } catch (err) {
            console.error('Failed to schedule meeting:', err);
            alert('Failed to schedule session. Please try again.');
        } finally {
            setScheduleLoading(false);
        }
    };

    const activeMentor = mentorship?.mentor || (mentorship?.mentors && mentorship.mentors[0]) || null;
    const activeBatch = batches[0] || null;

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
                        Mentorship Hub
                    </h1>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13.5px',
                        color: 'var(--admin-text-secondary)'
                    }}>
                        Connect with industry mentors, book 1-on-1 sessions, and accelerate your engineering journey.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowScheduleModal(true)}
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
                        <FiCalendar size={15} /> Book 1:1 Session
                    </button>
                </div>
            </div>

            {/* Top Row: Mentor Profile Card & Quick Info */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
                gap: '24px',
                alignItems: 'start'
            }} className="mentor-hub-grid">
                {/* Mentor Card */}
                <div style={{
                    background: 'var(--admin-surface)',
                    borderRadius: '12px',
                    border: '1.5px solid var(--admin-border-color)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--admin-primary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Dedicated Mentor
                        </span>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--admin-success, #10B981)'
                        }}>
                            Verified Mentor
                        </span>
                    </div>

                    {activeMentor ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <img
                                    src={activeMentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeMentor.name}`}
                                    alt={activeMentor.name}
                                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6' }}
                                />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                        {activeMentor.name}
                                    </h3>
                                    <div style={{ fontSize: '12.5px', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>
                                        Senior Engineering Mentor • Cybage Software
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FiMail size={12} /> {activeMentor.email}
                                        </span>
                                        {activeMentor.phone && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiPhone size={12} /> {activeMentor.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: 'var(--admin-text-secondary)',
                                lineHeight: 1.5,
                                padding: '12px 14px',
                                background: 'var(--admin-bg)',
                                borderRadius: '8px',
                                border: '1px solid var(--admin-border-color)'
                            }}>
                                Your assigned mentor provides personalized code reviews, architectural feedback, and professional career mentorship throughout your curriculum.
                            </p>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => navigate(`/student/chat/${activeMentor.id}`)}
                                    style={{
                                        flex: 1,
                                        padding: '9px 16px',
                                        borderRadius: '8px',
                                        background: 'var(--admin-primary)',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <FiMessageCircle size={15} /> Message Mentor
                                </button>
                                <button
                                    onClick={() => setShowScheduleModal(true)}
                                    style={{
                                        padding: '9px 16px',
                                        borderRadius: '8px',
                                        background: 'var(--admin-bg)',
                                        color: 'var(--admin-text-primary)',
                                        border: '1px solid var(--admin-border-color)',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <FiCalendar size={14} /> Schedule 1:1
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            padding: '36px 16px',
                            textAlign: 'center',
                            color: 'var(--admin-text-muted)',
                            border: '1px dashed var(--admin-border-color)',
                            borderRadius: '10px'
                        }}>
                            <FiUsers size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                Mentor Assignment In Progress
                            </div>
                            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                                Your cohort mentor will appear here shortly once assignments are finalized.
                            </div>
                        </div>
                    )}
                </div>

                {/* Cohort Overview Card */}
                <div style={{
                    background: 'var(--admin-surface)',
                    borderRadius: '12px',
                    border: '1.5px solid var(--admin-border-color)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
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
                            <FiLayers size={16} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                            Active Learning Cohort
                        </h3>
                    </div>

                    {activeBatch ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                    {activeBatch.name}
                                </div>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(79, 70, 229, 0.08)',
                                    color: 'var(--admin-primary)'
                                }}>
                                    {activeBatch.code || 'COHORT-2026'}
                                </span>
                            </div>

                            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                                {activeBatch.description || 'Full-stack software engineering cohort focused on modern industry practices.'}
                            </p>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '8px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: 'var(--admin-bg)',
                                border: '1px solid var(--admin-border-color)'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Status</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-success, #10B981)', marginTop: '2px' }}>
                                        Active
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Mentees</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)', marginTop: '2px' }}>
                                        {activeBatch.studentCount || 3} Enrolled
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                            No active cohort found.
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Mentorship Sessions */}
            <div style={{
                background: 'var(--admin-surface)',
                borderRadius: '12px',
                border: '1.5px solid var(--admin-border-color)',
                padding: '20px 24px',
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
                            Upcoming Mentorship Sessions ({upcomingMeetings.length})
                        </h3>
                    </div>
                </div>

                {upcomingMeetings.length === 0 ? (
                    <div style={{
                        padding: '36px 16px',
                        textAlign: 'center',
                        color: 'var(--admin-text-muted)',
                        border: '1px dashed var(--admin-border-color)',
                        borderRadius: '10px'
                    }}>
                        <FiCalendar size={28} style={{ opacity: 0.3, marginBottom: '6px' }} />
                        <div style={{ fontSize: '13.5px', fontWeight: 500 }}>No upcoming 1-on-1 sessions scheduled.</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "Book 1:1 Session" above to schedule time with your mentor.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {upcomingMeetings.map((meeting) => (
                            <div
                                key={meeting.id}
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
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                        {meeting.title || meeting.discussion_summary || 'Mentorship Discussion'}
                                    </h4>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--admin-primary)', fontWeight: 500 }}>
                                            <FiClock size={12} /> {meeting.scheduled_at || meeting.scheduledAt}
                                        </span>
                                        <span>•</span>
                                        <span style={{ color: 'var(--admin-success, #10B981)', fontWeight: 600 }}>
                                            Confirmed
                                        </span>
                                    </div>
                                </div>

                                {meeting.meeting_link && (
                                    <a
                                        href={meeting.meeting_link}
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
                                        Join Video Call <FiExternalLink size={13} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)} style={{ zIndex: 1100 }}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '520px',
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
                                    <FiCalendar size={18} />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                    Book 1:1 Mentorship Session
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowScheduleModal(false)}
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

                        {scheduleSuccess ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <FiCheckCircle size={40} style={{ color: 'var(--admin-success, #10B981)', marginBottom: '10px' }} />
                                <h3 style={{ margin: 0, color: 'var(--admin-text-primary)' }}>Request Sent!</h3>
                                <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
                                    Your mentor has been notified and will confirm the session link.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleScheduleMeet}>
                                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                            Date & Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
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
                                            Discussion Agenda / Questions *
                                        </label>
                                        <textarea
                                            rows={3}
                                            required
                                            placeholder="What would you like to review? (e.g. Code review on React task, Career guidance...)"
                                            value={scheduleTopic}
                                            onChange={(e) => setScheduleTopic(e.target.value)}
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
                                        onClick={() => setShowScheduleModal(false)}
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
                                        disabled={scheduleLoading}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '8px',
                                            background: 'var(--admin-primary)',
                                            color: '#ffffff',
                                            border: 'none',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            cursor: scheduleLoading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {scheduleLoading ? 'Sending...' : 'Confirm Request'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorProgram;
