import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    FiBarChart2,
    FiLayers,
    FiBookOpen,
    FiUsers,
    FiFileText,
    FiMessageSquare,
    FiMessageCircle,
    FiBell,
    FiSun,
    FiMoon,
    FiLogOut,
    FiMenu,
    FiX,
    FiSettings,
    FiTrash2
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import ChatBot from '../ChatBot';
import '../../pages/admin/AdminDashboard.css';
import './MentorLayout.css';

const mentorNavItems = [
    { to: '/mentor', icon: FiBarChart2, label: 'Overview', end: true },
    { to: '/mentor/batches', icon: FiLayers, label: 'Batches' },
    { to: '/mentor/sessions', icon: FiBookOpen, label: 'Resources' },
    { to: '/mentor/mentorship', icon: FiUsers, label: 'Mentees' },
    { to: '/mentor/assignments', icon: FiFileText, label: 'Assignments' },
    { to: '/mentor/forum', icon: FiMessageSquare, label: 'Forum' },
    { to: '/mentor/messages', icon: FiMessageCircle, label: 'Messages' }
];

const MentorLayout = () => {
    const { user, logout, socket } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('mentor-theme') || 'light');
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [liveNotification, setLiveNotification] = useState(null);

    const isMessagesPage = location.pathname.includes('/messages') || location.pathname.includes('/chat/');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mentor-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Socket.io notification listener
    useEffect(() => {
        if (!socket) return;

        const handleNotification = (data) => {
            setUnreadNotifications(prev => prev + 1);
            if (data) {
                const title = data.title || data.name || 'New Notification';
                const message = data.message || data.content || data.description || 'You have an update in your dashboard.';
                setLiveNotification({
                    id: Date.now(),
                    title,
                    message,
                    createdAt: new Date()
                });
                setTimeout(() => setLiveNotification(null), 5000);
            }
        };

        socket.on('notification', handleNotification);
        socket.on('new_announcement', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('new_announcement', handleNotification);
        };
    }, [socket]);

    const loadNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data || []);
            await api.put('/notifications/read');
            setUnreadNotifications(0);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    const handleToggleNotifications = async () => {
        if (!showNotifications) {
            await loadNotifications();
        }
        setShowNotifications(state => !state);
    };

    const handleDeleteNotification = async (event, id) => {
        event.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications((current) => current.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = Date.now();
        const minutesDiff = Math.floor((now - date.getTime()) / (1000 * 60));

        if (minutesDiff < 1) return 'Just now';
        if (minutesDiff < 60) return `${minutesDiff}m ago`;
        const hoursDiff = Math.floor(minutesDiff / 60);
        if (hoursDiff < 24) return `${hoursDiff}h ago`;
        return `${Math.floor(hoursDiff / 24)}d ago`;
    };

    return (
        <div className="dashboard-page mentor-page-wrapper">
            {/* Top Navbar matching Admin section */}
            <nav className="admin-navbar">
                <div className="navbar-brand-mentor" onClick={() => navigate('/mentor')} style={{ cursor: 'pointer' }}>
                    <img src="/logo.png" alt="Logo" className="navbar-logo" style={{ height: '36px', width: 'auto' }} />
                    <span className="mentor-logo-text">Khushboo Pathshala</span>
                </div>

                {/* Mobile Menu Button */}
                <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                <div className="navbar-actions-mentor">
                    <div className="mentor-tabs-container nav-links-desktop">
                        <div className="mentor-tabs">
                            {mentorNavItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        className={({ isActive }) => `mentor-tab ${isActive ? 'active' : ''}`}
                                    >
                                        <Icon /> {item.label}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>

                    <div className="navbar-right-actions">
                        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'light' ? <FiMoon /> : <FiSun />}
                        </button>

                        <button className="icon-btn" style={{ position: 'relative' }} onClick={handleToggleNotifications}>
                            <FiBell />
                            {unreadNotifications > 0 && <span className="notification-dot"></span>}
                        </button>

                        <div className="user-info-pill" onClick={() => navigate('/mentor/settings')}>
                            <img
                                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor'}
                                alt={user?.name}
                                className="avatar-sm"
                            />
                            <span className="user-name-text">{user?.name?.split(' ')[0]} (Mentor)</span>
                        </div>

                        <button className="icon-btn" onClick={handleLogout} title="Logout">
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu via Portal */}
            {ReactDOM.createPortal(
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            className="mobile-menu-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <motion.div
                                className="mobile-menu"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.3 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="mobile-menu-header">
                                    <h3>Menu</h3>
                                    <button onClick={() => setIsMenuOpen(false)}>
                                        <FiX size={24} />
                                    </button>
                                </div>
                                <div className="mobile-menu-links">
                                    {mentorNavItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <NavLink
                                                key={item.to}
                                                to={item.to}
                                                end={item.end}
                                                className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <Icon /> <span>{item.label}</span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                                <div className="mobile-menu-footer">
                                    <button className="mobile-settings-btn" onClick={() => { navigate('/mentor/settings'); setIsMenuOpen(false); }}>
                                        <FiSettings />
                                        <span>Settings</span>
                                    </button>
                                    <button className="mobile-logout-btn" onClick={() => { logout(); navigate('/login'); setIsMenuOpen(false); }}>
                                        <FiLogOut />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Notifications Dropdown */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        className="kp-dropdown-menu kp-notification-menu"
                        style={{
                            position: 'absolute',
                            top: '70px',
                            right: '140px',
                            zIndex: 9999,
                            width: '320px',
                            background: 'var(--color-surface, #ffffff)',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid var(--admin-border-color, #E5E7EB)',
                            borderRadius: 'var(--radius-lg, 14px)'
                        }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        <div className="kp-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--admin-border-color, #E5E7EB)' }}>
                            <h4 style={{ margin: 0 }}>Notifications</h4>
                            <button className="btn-ghost btn-sm" onClick={loadNotifications} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--admin-primary, #4F46E5)' }}>Refresh</button>
                        </div>
                        <div className="kp-notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {notifications.length > 0 ? (
                                notifications.map((note) => (
                                    <div key={note.id} className={`kp-notification-item ${!note.read ? 'is-unread' : ''}`} style={{ padding: '16px', borderBottom: '1px solid var(--admin-border-color, #E5E7EB)', display: 'flex', gap: '12px' }}>
                                        <div className="kp-notification-body" style={{ flex: 1 }}>
                                            <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-primary, #111827)' }}>{note.title}</h5>
                                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--admin-text-secondary, #6B7280)' }}>{note.message}</p>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted, #9CA3AF)' }}>{formatTime(note.createdAt)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(event) => handleDeleteNotification(event, note.id)}
                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--admin-text-muted, #9CA3AF)' }}
                                            aria-label="Delete notification"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted, #9CA3AF)' }}>
                                    <p>All caught up. No notifications right now.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live Notification Popup */}
            <AnimatePresence>
                {liveNotification && (
                    <motion.div
                        className="kp-notification-live-popup"
                        style={{
                            position: 'fixed',
                            top: '70px',
                            right: '20px',
                            zIndex: 99999,
                            width: '320px',
                            background: 'var(--admin-surface, #ffffff)',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid var(--admin-border-color, #E5E7EB)',
                            borderRadius: '14px'
                        }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '14px' }}>
                            <div style={{ flex: 1 }}>
                                <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-primary, #111827)', fontWeight: '600' }}>{liveNotification.title}</h5>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--admin-text-secondary, #6B7280)', lineHeight: '1.4' }}>{liveNotification.message}</p>
                                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.75rem', color: 'var(--admin-text-muted, #9CA3AF)' }}>Just now</span>
                            </div>
                            <button type="button" onClick={() => setLiveNotification(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: 'var(--admin-text-muted, #9CA3AF)' }}>
                                <FiX size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area - Full Width */}
            <main className={`mentor-content-viewport ${isMessagesPage ? 'is-messaging' : ''}`}>
                <Outlet />
            </main>

            {!isMessagesPage && <ChatBot />}
        </div>
    );
};

export default MentorLayout;
