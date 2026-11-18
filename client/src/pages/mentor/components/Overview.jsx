import React, { useState } from 'react';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import './MentorLanding.css';

// Components & Modals
import MenteeDetailsView from './MenteeDetailsView';
import ScheduleCallModal from './ScheduleCallModal';
import CsrFeedbackModal from './CsrFeedbackModal';
import MarkAvailabilityModal from './MarkAvailabilityModal';

const MENTEES_LIST = [
    {
        id: 1,
        name: 'Sharvari Shobhane',
        roll: 'PUN/20-21/0010',
        progress: 72,
        sessions: '6/12',
        email: 'sharvari.shobhane@gmail.com',
        phone: '+91 9823456710',
        course: 'B.E Computer - 2nd year',
        status: 'On Track',
        subject: 'Data Structures & Algorithms'
    },
    {
        id: 2,
        name: 'Neha Patel',
        roll: 'PUN/20-21/0011',
        progress: 32,
        sessions: '3/12',
        email: 'neha.patel@gmail.com',
        phone: '+91 9876543211',
        course: 'B.E Information Tech - 1st year',
        status: 'Needs Attention',
        subject: 'Object Oriented Programming'
    },
    {
        id: 3,
        name: 'Rahul Patil',
        roll: 'PUN/20-21/0012',
        progress: 50,
        sessions: '6/12',
        email: 'rahul.patil@gmail.com',
        phone: '+91 8347892784',
        course: 'B.E Computer - 1st year',
        status: 'On Track',
        subject: 'Computer Science'
    },
    {
        id: 4,
        name: 'Gayatri Mahadik',
        roll: 'PUN/20-21/0013',
        progress: 50,
        sessions: '6/12',
        email: 'gayatri.mahadik@gmail.com',
        phone: '+91 8765432190',
        course: 'B.E Computer - 1st year',
        status: 'On Track',
        subject: 'Web Technologies'
    },
    {
        id: 5,
        name: 'Aditya Badhe',
        roll: 'PUN/20-21/0014',
        progress: 50,
        sessions: '6/12',
        email: 'aditya.badhe@gmail.com',
        phone: '+91 9456781234',
        course: 'B.E Computer - 1st year',
        status: 'On Track',
        subject: 'Database Systems'
    },
    {
        id: 6,
        name: 'Sudhir Nair',
        roll: 'PUN/20-21/0015',
        progress: 50,
        sessions: '6/12',
        email: 'sudhir.nair@gmail.com',
        phone: '+91 9345678901',
        course: 'B.E Electronics - 2nd year',
        status: 'On Track',
        subject: 'Embedded Systems'
    },
    {
        id: 7,
        name: 'Aditi Chavan',
        roll: 'PUN/20-21/0016',
        progress: 50,
        sessions: '6/12',
        email: 'aditi.chavan@gmail.com',
        phone: '+91 9123456789',
        course: 'B.E Computer - 1st year',
        status: 'On Track',
        subject: 'Computer Networks'
    },
    {
        id: 8,
        name: 'Bhargav Gondaliya',
        roll: 'PUN/20-21/0017',
        progress: 50,
        sessions: '6/12',
        email: 'bhargav.g@gmail.com',
        phone: '+91 8976543210',
        course: 'B.E Computer - 1st year',
        status: 'On Track',
        subject: 'Operating Systems'
    }
];

const UPCOMING_SESSIONS = [
    { id: 1, day: '02', month: 'July 2026', name: 'Sharvari Shobhane', time: '2.30 - 3.30pm Online' },
    { id: 2, day: '05', month: 'July 2026', name: 'Sudhir Nair', time: '5 - 6pm Online' },
    { id: 3, day: '08', month: 'July 2026', name: 'Aditi Chavan', time: '2.30 - 3.30pm Online' },
    { id: 4, day: '15', month: 'July 2026', name: 'Rahul Patil', time: '2.30 - 3.30pm Online' },
    { id: 5, day: '22', month: 'July 2026', name: 'Gayatri Mahadik', time: '2.30 - 3.30pm Online' },
    { id: 6, day: '25', month: 'July 2026', name: 'Gayatri Mahadik', time: '2.30 - 3.30pm Online' },
    { id: 7, day: '26', month: 'July 2026', name: 'Gayatri Mahadik', time: '2.30 - 3.30pm Online' },
    { id: 8, day: '27', month: 'July 2026', name: 'Gayatri Mahadik', time: '2.30 - 3.30pm Online' }
];

const Overview = () => {
    const { user } = useAuth();

    // Navigation state to Mentee Details view
    const [selectedMentee, setSelectedMentee] = useState(null);

    // Modal state
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isCsrModalOpen, setIsCsrModalOpen] = useState(false);
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [activeMenteeForSchedule, setActiveMenteeForSchedule] = useState('Rahul Patil');
    const [activeMenteeForCsr, setActiveMenteeForCsr] = useState('Rahul Patil');

    const handleOpenSchedule = (menteeName = 'Rahul Patil') => {
        setActiveMenteeForSchedule(menteeName);
        setIsScheduleModalOpen(true);
    };

    const handleOpenCsr = (menteeName = 'Rahul Patil') => {
        setActiveMenteeForCsr(menteeName);
        setIsCsrModalOpen(true);
    };

    // If a mentee is selected, display the Mentee Details View (Attachment 1)
    if (selectedMentee) {
        return (
            <>
                <MenteeDetailsView
                    mentee={selectedMentee}
                    onBack={() => setSelectedMentee(null)}
                    onOpenScheduleModal={handleOpenSchedule}
                    onOpenCsrModal={handleOpenCsr}
                />

                {/* Modals */}
                <ScheduleCallModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    mentees={MENTEES_LIST}
                    defaultMentee={activeMenteeForSchedule}
                />

                <CsrFeedbackModal
                    isOpen={isCsrModalOpen}
                    onClose={() => setIsCsrModalOpen(false)}
                    mentees={MENTEES_LIST}
                    menteeName={activeMenteeForCsr}
                />
            </>
        );
    }

    // Default: Main Mentor Dashboard Landing View (Attachment 2)
    return (
        <div className="kp-ml-wrapper">
            {/* Header Section */}
            <header className="kp-ml-header">
                <div>
                    <h1 className="kp-ml-header-title">
                        Welcome, {user?.name || 'Rakesh Kamble'}
                    </h1>
                    <div className="kp-ml-status-pill">
                        <span className="kp-ml-status-dot"></span>
                        Excellent Performance <span className="kp-ml-status-divider">•</span> ratings 4.8 / 5
                    </div>
                </div>

                <div className="kp-ml-header-actions">
                    <button
                        className="kp-ml-btn-outline"
                        onClick={() => setIsAvailabilityModalOpen(true)}
                    >
                        Mark Availability
                    </button>
                    <button
                        className="kp-ml-btn-dark"
                        onClick={() => handleOpenSchedule('Rahul Patil')}
                    >
                        Schedule Call
                        <FiCalendar size={16} />
                    </button>
                </div>
            </header>

            {/* Performance KPIs Section */}
            <section className="kp-ml-kpi-section">
                <h2 className="kp-ml-kpi-title">Performance KPI's</h2>
                <div className="kp-ml-kpi-grid">
                    {/* Card 1 */}
                    <div className="kp-ml-kpi-card">
                        <h3 className="kp-ml-kpi-label">Overall Rating</h3>
                        <p className="kp-ml-kpi-value">4.8</p>
                        <p className="kp-ml-kpi-subtext">Excellent</p>
                    </div>

                    {/* Card 2 */}
                    <div className="kp-ml-kpi-card">
                        <h3 className="kp-ml-kpi-label">Mentoring hours</h3>
                        <p className="kp-ml-kpi-value">142h</p>
                        <p className="kp-ml-kpi-subtext">this cycle</p>
                    </div>

                    {/* Card 3 */}
                    <div className="kp-ml-kpi-card">
                        <h3 className="kp-ml-kpi-label">Rewards Points</h3>
                        <p className="kp-ml-kpi-value">3,250</p>
                        <p className="kp-ml-kpi-subtext">+180 recent</p>
                    </div>

                    {/* Card 4 */}
                    <div className="kp-ml-kpi-card">
                        <h3 className="kp-ml-kpi-label">Mentees Assigned</h3>
                        <p className="kp-ml-kpi-value">6</p>
                        <p className="kp-ml-kpi-subtext">2 new added</p>
                    </div>

                    {/* Card 5 */}
                    <div className="kp-ml-kpi-card">
                        <h3 className="kp-ml-kpi-label">Sessions Conducted</h3>
                        <p className="kp-ml-kpi-value">20</p>
                        <p className="kp-ml-kpi-subtext">Excellent</p>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <div className="kp-ml-main-grid">
                {/* Left Column: Assigned Mentees */}
                <div className="kp-ml-panel">
                    <h2 className="kp-ml-panel-title">Assigned Mentees</h2>

                    {/* Table Header */}
                    <div className="kp-ml-table-header">
                        <div>List of Mentees</div>
                        <div>Progress</div>
                        <div style={{ textAlign: 'center' }}>Sessions</div>
                        <div style={{ textAlign: 'right', paddingRight: '20px' }}>Action</div>
                    </div>

                    {/* Table Body */}
                    <div className="kp-ml-table-body">
                        {MENTEES_LIST.map((mentee) => (
                            <div key={mentee.id} className="kp-ml-table-row">
                                <div className="kp-ml-mentee-cell">
                                    <div className="kp-ml-avatar-circle"></div>
                                    <div>
                                        <p className="kp-ml-mentee-name">{mentee.name}</p>
                                        <p className="kp-ml-mentee-id">{mentee.roll}</p>
                                    </div>
                                </div>

                                <div className="kp-ml-progress-cell">
                                    <div className="kp-ml-progress-track">
                                        <div
                                            className="kp-ml-progress-fill"
                                            style={{ width: `${mentee.progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="kp-ml-progress-text">{mentee.progress}%</p>
                                </div>

                                <div className="kp-ml-session-cell">{mentee.sessions}</div>

                                <div className="kp-ml-action-cell">
                                    <button
                                        className="kp-ml-btn-table-action"
                                        onClick={() => setSelectedMentee(mentee)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* View All Mentees Button */}
                    <div className="kp-ml-view-all-wrap">
                        <button
                            className="kp-ml-btn-view-all"
                            onClick={() => setSelectedMentee(MENTEES_LIST[2])} /* Opens Rahul Patil details */
                        >
                            View all mentees
                        </button>
                    </div>
                </div>

                {/* Right Column: Upcoming Sessions */}
                <div className="kp-ml-panel">
                    <h2 className="kp-ml-panel-title">Upcoming Sessions</h2>

                    <div className="kp-ml-sessions-list">
                        {UPCOMING_SESSIONS.map((session) => (
                            <div key={session.id} className="kp-ml-session-item">
                                <div className="kp-ml-session-info">
                                    <div className="kp-ml-session-date-box">
                                        <div className="kp-ml-session-date-day">{session.day}</div>
                                        <div className="kp-ml-session-date-month">{session.month}</div>
                                    </div>
                                    <div className="kp-ml-session-name">{session.name}</div>
                                </div>
                                <div className="kp-ml-session-badge">{session.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ScheduleCallModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                mentees={MENTEES_LIST}
                defaultMentee={activeMenteeForSchedule}
            />

            <CsrFeedbackModal
                isOpen={isCsrModalOpen}
                onClose={() => setIsCsrModalOpen(false)}
                mentees={MENTEES_LIST}
                menteeName={activeMenteeForCsr}
            />

            <MarkAvailabilityModal
                isOpen={isAvailabilityModalOpen}
                onClose={() => setIsAvailabilityModalOpen(false)}
            />
        </div>
    );
};

export default Overview;
