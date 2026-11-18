import React, { useState } from 'react';
import { FiCalendar, FiArrowLeft, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';
import ViewSessionFormModal from './ViewSessionFormModal';

const DEFAULT_SESSIONS = [
    {
        id: 1,
        topic: 'HTML programming',
        date: '02/07/2026',
        mentorAttendance: 'Present',
        menteeAttendance: 'Present',
        status: 'Complete',
        notes: 'Covered HTML semantics, accessibility attributes, DOM structure, and modern form validation.'
    },
    {
        id: 2,
        topic: 'Python programming',
        date: '05/08/2026',
        mentorAttendance: 'Absent',
        menteeAttendance: 'Present',
        status: 'Incomplete',
        notes: 'Mentor was unavailable due to an official conflict. Session rescheduled for next Tuesday.'
    },
    {
        id: 3,
        topic: 'Database & SQL queries',
        date: '12/08/2026',
        mentorAttendance: 'Present',
        menteeAttendance: 'Present',
        status: 'Complete',
        notes: 'Reviewed relational schema design, primary/foreign keys, joins, and indexing strategies.'
    },
    {
        id: 4,
        topic: 'React fundamentals & components',
        date: '19/08/2026',
        mentorAttendance: 'Present',
        menteeAttendance: 'Present',
        status: 'Complete',
        notes: 'Introduced JSX, component trees, props passing, and single-direction data flow principles.'
    },
    {
        id: 5,
        topic: 'State management & hooks',
        date: '26/08/2026',
        mentorAttendance: 'Present',
        menteeAttendance: 'Present',
        status: 'Complete',
        notes: 'Deep-dive into useState, useEffect, custom hooks, and best practices for avoiding memory leaks.'
    },
    {
        id: 6,
        topic: 'Project Architecture review',
        date: '02/09/2026',
        mentorAttendance: 'Present',
        menteeAttendance: 'Present',
        status: 'Complete',
        notes: 'Mentee demonstrated their mini-project code. Commended code cleanliness and advised on error handling.'
    }
];

const MenteeDetailsView = ({
    mentee,
    onBack,
    onOpenScheduleModal,
    onOpenCsrModal
}) => {
    const [activeTab, setActiveTab] = useState('Sessions');
    const [selectedSession, setSelectedSession] = useState(null);
    const [isViewFormOpen, setIsViewFormOpen] = useState(false);

    const menteeData = mentee || {
        name: 'Rahul Patil',
        roll: 'PUN/20-21/0012',
        email: 'rahul.patil@gmail.com',
        phone: '+91 8347892784',
        course: 'B.E Computer - 1st year',
        status: 'On Track',
        subject: 'Computer Science'
    };

    const handleViewForm = (session) => {
        setSelectedSession(session);
        setIsViewFormOpen(true);
    };

    return (
        <div className="kp-ml-wrapper">
            {/* Breadcrumbs */}
            <div className="kp-ml-breadcrumb">
                <span className="kp-ml-breadcrumb-link" onClick={onBack}>
                    Mentors Dashboard
                </span>
                <span className="kp-ml-breadcrumb-separator">/</span>
                <span className="kp-ml-breadcrumb-current">Mentee Details</span>
            </div>

            {/* Profile Header Card */}
            <div className="kp-ml-profile-card">
                {/* Left Side: Profile Info */}
                <div className="kp-ml-profile-left">
                    <div className="kp-ml-profile-avatar-large"></div>
                    <div className="kp-ml-profile-info">
                        <h1 className="kp-ml-profile-name">{menteeData.name}</h1>

                        {/* Badges */}
                        <div className="kp-ml-profile-badges">
                            <span className="kp-ml-badge-gray">
                                {menteeData.status || 'On Track'}
                            </span>
                            <span className="kp-ml-badge-gray">
                                Subject: {menteeData.subject || 'Computer Science'}
                            </span>
                        </div>

                        {/* Contact Info Grid */}
                        <div className="kp-ml-contact-grid">
                            <div className="kp-ml-contact-item">
                                <p className="kp-ml-contact-label">Email:</p>
                                <p className="kp-ml-contact-val">
                                    {menteeData.email || 'rahul.patil@gmail.com'}
                                </p>
                            </div>
                            <div className="kp-ml-contact-item">
                                <p className="kp-ml-contact-label">Phone No.</p>
                                <p className="kp-ml-contact-val">
                                    {menteeData.phone || '+91 8347892784'}
                                </p>
                            </div>
                            <div className="kp-ml-contact-item">
                                <p className="kp-ml-contact-label">Course Applied &amp; Year</p>
                                <p className="kp-ml-contact-val">
                                    {menteeData.course || 'B.E Computer - 1st year'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="kp-ml-profile-actions">
                    <button
                        className="kp-ml-btn-dark"
                        onClick={() => onOpenScheduleModal(menteeData.name)}
                    >
                        Schedule Call
                        <FiCalendar size={16} />
                    </button>
                    <button
                        className="kp-ml-btn-outline"
                        onClick={() => onOpenCsrModal(menteeData.name)}
                    >
                        CSR Feedback
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="kp-ml-tabs-bar">
                {['Sessions', 'Questions', 'Assignments', 'Artifacts', 'Progress'].map(tab => (
                    <button
                        key={tab}
                        className={`kp-ml-tab-btn ${activeTab === tab ? 'is-active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            {activeTab === 'Sessions' && (
                <div className="kp-ml-sessions-table-card">
                    {/* Table Header */}
                    <div className="kp-ml-detail-table-header">
                        <div>Topic Discussed</div>
                        <div>Session Date</div>
                        <div>Mentor's Attendance</div>
                        <div>Mentee's Attendance</div>
                        <div>Session Status</div>
                        <div style={{ textAlign: 'right' }}>Action</div>
                    </div>

                    {/* Table Body */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {DEFAULT_SESSIONS.map(session => (
                            <div key={session.id} className="kp-ml-detail-table-row">
                                <div className="kp-ml-detail-topic">{session.topic}</div>
                                <div className="kp-ml-detail-cell">{session.date}</div>
                                <div className="kp-ml-detail-cell">{session.mentorAttendance}</div>
                                <div className="kp-ml-detail-cell">{session.menteeAttendance}</div>
                                <div>
                                    <span
                                        className={
                                            session.status === 'Complete'
                                                ? 'kp-ml-status-badge-complete'
                                                : 'kp-ml-status-badge-incomplete'
                                        }
                                    >
                                        {session.status}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <button
                                        className="kp-ml-btn-view-form"
                                        onClick={() => handleViewForm(session)}
                                    >
                                        View Form
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'Questions' && (
                <div className="kp-ml-sessions-table-card" style={{ padding: '28px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#111827' }}>
                        Mentee Questions &amp; Queries
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <p style={{ fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
                                "How do asynchronous promises and async/await work behind the scenes in JavaScript?"
                            </p>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Asked on 18/07/2026 · Status: Answered</span>
                        </div>
                        <div style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <p style={{ fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
                                "Which database indexes should I prefer for high-volume read queries?"
                            </p>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Asked on 10/08/2026 · Status: In Review</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Assignments' && (
                <div className="kp-ml-sessions-table-card" style={{ padding: '28px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#111827' }}>
                        Curriculum Assignments
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
                                    Assignment 1: Responsive Portfolio in HTML &amp; CSS
                                </p>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Submitted on 08/07/2026</span>
                            </div>
                            <span className="kp-ml-status-badge-complete">Reviewed (95%)</span>
                        </div>
                        <div style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
                                    Assignment 2: Interactive React Weather App
                                </p>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Submitted on 28/08/2026</span>
                            </div>
                            <span className="kp-ml-status-badge-complete">Reviewed (92%)</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Artifacts' && (
                <div className="kp-ml-sessions-table-card" style={{ padding: '28px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#111827' }}>
                        Uploaded Artifacts &amp; Code Submissions
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <FiFileText size={20} color="#4b5563" />
                            <p style={{ fontWeight: '600', margin: '8px 0 4px 0', color: '#111827' }}>project_architecture.pdf</p>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>2.4 MB · Uploaded 02/09/2026</span>
                        </div>
                        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <FiFileText size={20} color="#4b5563" />
                            <p style={{ fontWeight: '600', margin: '8px 0 4px 0', color: '#111827' }}>sql_schema_diagram.png</p>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>850 KB · Uploaded 12/08/2026</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Progress' && (
                <div className="kp-ml-sessions-table-card" style={{ padding: '28px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#111827' }}>
                        Overall Learning Journey Progress
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                                <span>Curriculum Milestones Completed</span>
                                <span>78%</span>
                            </div>
                            <div className="kp-ml-progress-track" style={{ height: '10px' }}>
                                <div className="kp-ml-progress-fill" style={{ width: '78%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                                <span>Attendance Rate</span>
                                <span>88%</span>
                            </div>
                            <div className="kp-ml-progress-track" style={{ height: '10px' }}>
                                <div className="kp-ml-progress-fill" style={{ width: '88%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Back Button */}
            <div className="kp-ml-back-wrap">
                <button className="kp-ml-btn-back" onClick={onBack}>
                    Back
                </button>
            </div>

            {/* View Form Modal */}
            <ViewSessionFormModal
                isOpen={isViewFormOpen}
                onClose={() => setIsViewFormOpen(false)}
                session={selectedSession}
            />
        </div>
    );
};

export default MenteeDetailsView;
