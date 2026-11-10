import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    FiBarChart2,
    FiBookOpen,
    FiMap,
    FiFileText,
    FiUsers,
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
import api, { chatAPI } from '../../api';
import ChatBot from '../ChatBot';
import '../../pages/admin/AdminDashboard.css';
import './MentorLayout.css';

const studentNavItems = [
    { to: '/student', icon: FiBarChart2, label: 'Overview', end: true },
    { to: '/student/roadmap', icon: FiMap, label: 'Roadmap' },
    { to: '/student/courses', icon: FiBookOpen, label: 'Courses' },
    { to: '/student/assignments', icon: FiFileText, label: 'Assignments' },
    { to: '/student/mentor', icon: FiUsers, label: 'Mentorship' },
    { to: '/student/forum', icon: FiMessageSquare, label: 'Forum' },
    { to: '/student/messages', icon: FiMessageCircle, label: 'Messages' }
];

const StudentLayout = () => {
    const { user, logout, socket } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('student-theme') || 'light');
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadChatMessages, setUnreadChatMessages] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [liveNotification, setLiveNotification] = useState(null);

    const isMessagesPage = location.pathname.includes('/messages') || location.pathname.includes('/chat/');

    // Fetch initial notifications & unread counts on mount
    useEffect(() => {
        loadNotifications();
    }, []);

    // Clear unread messages when user visits the messages page
    useEffect(() => {
        if (isMessagesPage) {
            chatAPI.markRead().catch(() => {});
            setUnreadChatMessages(0);
        }
    }, [isMessagesPage]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('student-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Socket.io notification & message listener
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

        const handleChatMessage = (msg) => {
            const isOwn = (msg?.senderId || msg?.sender?.id) === user?.id;
            if (!isOwn && msg) {
                if (!isMessagesPage) {
                    setUnreadChatMessages(prev => prev + 1);
                }
                const senderName = msg.sender?.name || 'Contact';
                setLiveNotification({
                    id: Date.now(),
                    title: `💬 New message from ${senderName}`,
                    message: msg.content || 'Sent an attachment',
                    createdAt: new Date()
                });
                setTimeout(() => setLiveNotification(null), 5000);
            }
        };

        socket.on('notification', handleNotification);
        socket.on('new_announcement', handleNotification);
        socket.on('message:new', handleChatMessage);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('new_announcement', handleNotification);
            socket.off('message:new', handleChatMessage);
        };
    }, [socket, user?.id, isMessagesPage]);

    const loadNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
            setNotifications(list);
            const unreadChat = list.filter(n => !n.isRead && n.type === 'CHAT').length;
            setUnreadChatMessages(unreadChat);
            const otherUnread = list.filter(n => !n.isRead && n.type !== 'CHAT').length;
            setUnreadNotifications(otherUnread);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    const handleToggleNotifications = async () => {
        if (!showNotifications) {
            await loadNotifications();
            api.get('/notifications', { params: { action: 'read' } }).catch(() => {});
            setUnreadNotifications(0);
        }
        setShowNotifications(state => !state);
    };

    const handleDeleteNotification = async (event, id) => {
        event.stopPropagation();
        try {
            await api.get('/notifications', { params: { action: 'delete', id } });
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
            {/* Top Navbar matching Admin and Mentor layout */}
            <nav className="admin-navbar">
                <div className="navbar-brand-mentor" onClick={() => navigate('/student')} style={{ cursor: 'pointer' }}>
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
                            {studentNavItems.map((item) => {
                                const Icon = item.icon;
                                const isMessagesTab = item.label === 'Messages';
                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        className={({ isActive }) => `mentor-tab ${isActive ? 'active' : ''}`}
                                        style={{ position: 'relative' }}
                                    >
                                        <Icon size={16} />
                                        <span>{item.label}</span>
                                        {isMessagesTab && unreadChatMessages > 0 && (
                                            <span className="nav-message-badge">{unreadChatMessages}</span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>

                    <div className="navbar-right-actions">
                        {/* Theme Toggle */}
                        <button
                            className="icon-btn"
                            onClick={toggleTheme}
                            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                        >
                            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
                        </button>

                        {/* Notifications */}
                        <div className="notification-wrapper" style={{ position: 'relative' }}>
                            <button
                                className="icon-btn"
                                onClick={handleToggleNotifications}
                                title="Notifications"
                            >
                                <FiBell size={18} />
                                {unreadNotifications > 0 && (
                                    <span className="notification-dot" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="notifications-dropdown">
                                    <div className="notifications-header">
                                        <h3>Notifications</h3>
                                        {unreadNotifications > 0 && (
                                            <span className="unread-count">{unreadNotifications} new</span>
                                        )}
                                    </div>
                                    <div className="notifications-list">
                                        {notifications.length === 0 ? (
                                            <div className="no-notifications">No new updates</div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div key={notification.id} className="notification-item">
                                                    <div className="notification-content">
                                                        <h4>{notification.title}</h4>
                                                        <p>{notification.message}</p>
                                                        <span className="notification-time">
                                                            {formatTime(notification.created_at || notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="notification-delete-btn"
                                                        onClick={(event) => handleDeleteNotification(event, notification.id)}
                                                        title="Delete notification"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile Pill */}
                        <div className="user-info-pill" onClick={() => navigate('/student/settings')} style={{ cursor: 'pointer' }}>
                            <img
                                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Student'}`}
                                alt={user?.name}
                                className="avatar-sm"
                            />
                            <span className="user-name-text">
                                {user?.name?.split(' ')[0] || 'Student'} (Student)
                            </span>
                        </div>

                        {/* Logout Button */}
                        <button className="icon-btn" onClick={handleLogout} title="Sign Out">
                            <FiLogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation Drawer Portal */}
            {isMenuOpen && ReactDOM.createPortal(
                <AnimatePresence>
                    <motion.div
                        className="mobile-drawer-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMenuOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.45)',
                            backdropFilter: 'blur(3px)',
                            zIndex: 99998
                        }}
                    />
                    <motion.div
                        className="mobile-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            width: '280px',
                            height: '100vh',
                            background: 'var(--admin-surface)',
                            borderLeft: '1px solid var(--admin-border-color)',
                            zIndex: 99999,
                            padding: '24px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img src="/logo.png" alt="Logo" style={{ height: '30px' }} />
                                <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--admin-text-primary)' }}>Student Portal</span>
                            </div>
                            <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                                <FiX size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                            {studentNavItems.map((item) => {
                                const Icon = item.icon;
                                const isMessagesTab = item.label === 'Messages';
                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
                                        style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', position: 'relative' }}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                        {isMessagesTab && unreadChatMessages > 0 && (
                                            <span className="nav-message-badge" style={{ right: '14px', top: '12px' }}>{unreadChatMessages}</span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>

                        <div style={{ borderTop: '1px solid var(--admin-border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer', fontSize: '13px' }}>
                                {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
                                <span>{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
                            </button>
                            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                                <FiLogOut size={16} /> Logout
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}

            {/* Live Pop Toast */}
            {liveNotification && (
                <div className="live-notification-toast">
                    <h4>{liveNotification.title}</h4>
                    <p>{liveNotification.message}</p>
                </div>
            )}

            {/* Main Content Viewport */}
            <main className={`mentor-content-viewport ${isMessagesPage ? 'is-messaging' : ''}`}>
                <Outlet />
            </main>

            {!isMessagesPage && <ChatBot />}
        </div>
    );
};

export default StudentLayout;
