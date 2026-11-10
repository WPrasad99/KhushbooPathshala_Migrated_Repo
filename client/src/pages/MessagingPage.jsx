import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSend,
    FiSearch,
    FiMoreVertical,
    FiUsers,
    FiUser,
    FiMessageCircle,
    FiCheck,
    FiPlus,
    FiDownload,
    FiFile,
    FiImage,
    FiArrowLeft,
    FiClock,
    FiPhone,
    FiVideo,
    FiInfo,
    FiX
} from 'react-icons/fi';
import { chatAPI, API_BASE } from '../api';
import { socket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import CreateGroupModal from '../components/messaging/CreateGroupModal';
import FileUpload from '../components/messaging/FileUpload';
import GroupInfoPanel from '../components/messaging/GroupInfoPanel';
import UserInfoPanel from '../components/messaging/UserInfoPanel';
import './MessagingPage.css';

const MessagingPage = ({ initialChatUser, onClearInitialChatUser }) => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { userId } = useParams();

    const [conversations, setConversations] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(true);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const currentUserId = currentUser?.id;
    const currentUserName = currentUser?.name;

    // Helper: extract the other user in a direct message
    const getOtherUser = (conv) => {
        if (!conv) return null;
        if (conv.members && Array.isArray(conv.members)) {
            const other = conv.members.find(m => (m.userId || m.user?.id) != currentUserId);
            if (other?.user) return other.user;
        }
        return { name: conv.name || 'Chat', avatar: null, role: null };
    };

    // Initial load: Fetch conversations and contacts
    useEffect(() => {
        let isMounted = true;
        const loadAll = async () => {
            try {
                setLoading(true);
                const [groupsRes, contactsRes] = await Promise.all([
                    chatAPI.getGroups().catch(() => ({ data: [] })),
                    chatAPI.getContacts().catch(() => ({ data: [] }))
                ]);

                if (isMounted) {
                    const groupList = Array.isArray(groupsRes?.data) ? groupsRes.data : [];
                    const contactList = Array.isArray(contactsRes?.data) ? contactsRes.data : [];
                    setConversations(groupList);
                    setContacts(contactList);

                    // If userId param is present, initiate or select that DM
                    const targetId = userId || initialChatUser?.id;
                    if (targetId) {
                        openOrCreateDirectChat(targetId, groupList);
                    } else if (groupList.length > 0 && !selectedConversation && window.innerWidth > 768) {
                        // On desktop, auto-select the first active conversation
                        setSelectedConversation(groupList[0]);
                    }
                }
            } catch (err) {
                console.error('Failed to load messaging data:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadAll();

        return () => {
            isMounted = false;
        };
    }, []);

    // Handle URL param changes (e.g. clicking "Message Mentor" multiple times or for different users)
    useEffect(() => {
        const targetId = userId || initialChatUser?.id;
        if (targetId && conversations.length > 0) {
            openOrCreateDirectChat(targetId, conversations);
        }
    }, [userId, initialChatUser]);

    // Fast direct chat resolver
    const openOrCreateDirectChat = async (targetId, currentList) => {
        // Check if DM with targetId already exists in currentList
        const existing = (currentList || conversations).find(c => {
            if (c.groupType !== 'direct') return false;
            return c.members?.some(m => (m.userId || m.user?.id) === targetId);
        });

        if (existing) {
            setSelectedConversation(existing);
            setShowMobileSidebar(false);
            fetchMessages(existing.id);
            if (onClearInitialChatUser) onClearInitialChatUser();
            return;
        }

        // Call backend to create or resolve existing DM
        try {
            const res = await chatAPI.createDirectMessage(targetId);
            const group = res?.data;
            if (group && group.id) {
                setConversations(prev => {
                    const withoutDup = prev.filter(c => c.id !== group.id);
                    return [group, ...withoutDup];
                });
                setSelectedConversation(group);
                setShowMobileSidebar(false);
                fetchMessages(group.id);
                if (onClearInitialChatUser) onClearInitialChatUser();
            }
        } catch (err) {
            console.error('Failed to open direct chat:', err);
        }
    };

    // Socket.io & Polling fallback for real-time messaging
    useEffect(() => {
        const handleIncoming = (data) => {
            if (selectedConversation && (data.groupId === selectedConversation.id || data.group_id === selectedConversation.id)) {
                setMessages(prev => {
                    if (prev.some(m => m.id === data.id)) return prev;
                    return [...prev, data];
                });
            }
            refreshConversations();
        };

        socket.on('message:new', handleIncoming);
        socket.on('group:created', refreshConversations);

        // Fallback polling every 4 seconds to sync messages and last activity smoothly
        const pollInterval = setInterval(() => {
            if (selectedConversation?.id) {
                syncLatestMessages(selectedConversation.id);
            }
        }, 4000);

        return () => {
            socket.off('message:new', handleIncoming);
            socket.off('group:created', refreshConversations);
            clearInterval(pollInterval);
        };
    }, [selectedConversation?.id]);

    // Fetch messages whenever selectedConversation changes
    useEffect(() => {
        if (selectedConversation?.id && !selectedConversation.isPlaceholder) {
            fetchMessages(selectedConversation.id);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            setMessages([]);
        }
    }, [selectedConversation?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const refreshConversations = async () => {
        try {
            const res = await chatAPI.getGroups();
            if (Array.isArray(res?.data)) {
                setConversations(res.data);
            }
        } catch (err) {
            console.error('Failed to refresh conversations:', err);
        }
    };

    const fetchMessages = async (groupId) => {
        try {
            const res = await chatAPI.getMessages(groupId);
            const list = Array.isArray(res?.data) ? res.data : [];
            setMessages(list);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setMessages([]);
        }
    };

    const syncLatestMessages = async (groupId) => {
        try {
            const res = await chatAPI.getMessages(groupId);
            const list = Array.isArray(res?.data) ? res.data : [];
            setMessages(prev => {
                if (list.length !== prev.length || (list.length > 0 && list[list.length - 1]?.id !== prev[prev.length - 1]?.id)) {
                    return list;
                }
                return prev;
            });
        } catch {
            // Silently ignore sync errors
        }
    };

    const handleSelectConversation = (conv) => {
        setShowGroupInfo(false);
        setShowUserInfo(false);
        setSelectedConversation(conv);
        setShowMobileSidebar(false);
        fetchMessages(conv.id);
    };

    const sendMessage = async (e) => {
        e?.preventDefault();
        const text = newMessage.trim();
        if ((!text && selectedFiles.length === 0) || !selectedConversation) return;

        try {
            setUploading(true);
            let attachments = null;

            if (selectedFiles.length > 0) {
                const formData = new FormData();
                selectedFiles.forEach(file => formData.append('files', file));
                const uploadResponse = await chatAPI.uploadFiles(formData);
                attachments = uploadResponse?.data?.files || uploadResponse?.data;
            }

            const res = await chatAPI.sendMessage(selectedConversation.id, text, attachments);
            const sentMsg = res?.data;

            if (sentMsg) {
                setMessages(prev => [...prev, sentMsg]);

                // Update conversation's lastMessage in list
                setConversations(prev => {
                    return prev.map(c => {
                        if (c.id === selectedConversation.id) {
                            return { ...c, lastMessage: sentMsg };
                        }
                        return c;
                    });
                });

                socket.emit('message:send', {
                    groupId: selectedConversation.id,
                    message: sentMsg
                });
            }

            setNewMessage('');
            setSelectedFiles([]);
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Failed to deliver message. Please retry.');
        } finally {
            setUploading(false);
        }
    };

    // Format WhatsApp-style timestamps
    const formatTimestamp = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();

        const isToday = date.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;

        if (isToday) return time;
        if (isYesterday) return 'Yesterday';

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    };

    const formatBubbleTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes} ${ampm}`;
    };

    // Filter conversations: WhatsApp rule -> only show active chats with messages or selected
    const displayConversations = useMemo(() => {
        if (!Array.isArray(conversations)) return [];

        let list = conversations.filter(c => {
            const hasMessages = Boolean(c.lastMessage && (c.lastMessage.content || c.lastMessage.id));
            const isCurrentlySelected = selectedConversation && selectedConversation.id === c.id;
            const isGroup = c.groupType === 'group' || c.groupType === 'batch';
            return hasMessages || isCurrentlySelected || isGroup;
        });

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = conversations.filter(c => {
                const isDirect = c.groupType === 'direct';
                const name = isDirect ? getOtherUser(c)?.name : c.name;
                return name?.toLowerCase().includes(q);
            });
        }

        return list;
    }, [conversations, searchQuery, selectedConversation?.id]);

    // Handle starting a new chat with a contact from the modal
    const handleStartChatWithUser = async (targetUser) => {
        setShowNewChatModal(false);
        await openOrCreateDirectChat(targetUser.id, conversations);
    };

    if (loading) {
        return (
            <div className="wa-messaging-shell">
                <div className="wa-loading-center">
                    <div className="wa-spinner" />
                    <span>Connecting to secure chat...</span>
                </div>
            </div>
        );
    }

    const isDirect = selectedConversation?.groupType === 'direct';
    const activeOtherUser = isDirect ? getOtherUser(selectedConversation) : null;
    const conversationTitle = isDirect ? (activeOtherUser?.name || 'Direct Message') : (selectedConversation?.name || 'Group Chat');

    return (
        <div className={`wa-messaging-shell ${showMobileSidebar ? 'show-sidebar' : 'show-chat'}`}>
            {/* ── LEFT SIDEBAR: WhatsApp-style Chats List ── */}
            <aside className="wa-sidebar">
                {/* Top Profile / Action Bar */}
                <div className="wa-sidebar-top">
                    <div className="wa-sidebar-user">
                        <img
                            src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserName || 'User'}`}
                            alt={currentUserName}
                            className="wa-user-avatar"
                        />
                        <span className="wa-user-title">Chats</span>
                    </div>

                    <div className="wa-sidebar-actions">
                        <button
                            type="button"
                            className="wa-icon-action-btn"
                            onClick={() => setShowNewChatModal(true)}
                            title="New Conversation"
                        >
                            <FiPlus size={18} />
                        </button>
                        <button
                            type="button"
                            className="wa-icon-action-btn"
                            onClick={() => setShowCreateModal(true)}
                            title="Create Group"
                        >
                            <FiUsers size={17} />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="wa-search-bar">
                    <div className="wa-search-input-wrap">
                        <FiSearch className="wa-search-icon" size={15} />
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="wa-search-clear"
                                onClick={() => setSearchQuery('')}
                            >
                                <FiX size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Conversation List */}
                <div className="wa-chat-list">
                    {displayConversations.length === 0 ? (
                        <div className="wa-no-chats-hint">
                            <FiMessageCircle size={32} />
                            <p>No recent conversations</p>
                            <button
                                type="button"
                                className="wa-btn-start-chat"
                                onClick={() => setShowNewChatModal(true)}
                            >
                                Start a chat
                            </button>
                        </div>
                    ) : (
                        displayConversations.map(conv => {
                            const isDirectChat = conv.groupType === 'direct';
                            const other = isDirectChat ? getOtherUser(conv) : null;
                            const displayName = isDirectChat ? (other?.name || 'User') : conv.name;
                            const isSelected = selectedConversation?.id === conv.id;
                            const lastMsg = conv.lastMessage;
                            const isLastMsgOwn = lastMsg && (lastMsg.senderId || lastMsg.sender?.id) === currentUserId;

                            return (
                                <div
                                    key={conv.id}
                                    className={`wa-chat-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleSelectConversation(conv)}
                                >
                                    <div className="wa-chat-avatar-wrap">
                                        {isDirectChat ? (
                                            <img
                                                src={other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`}
                                                alt={displayName}
                                                className="wa-chat-avatar"
                                            />
                                        ) : (
                                            <div className="wa-chat-group-avatar">
                                                <FiUsers size={18} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="wa-chat-content">
                                        <div className="wa-chat-meta-top">
                                            <span className="wa-chat-title">{displayName}</span>
                                            {lastMsg?.createdAt && (
                                                <span className="wa-chat-timestamp">
                                                    {formatTimestamp(lastMsg.createdAt)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="wa-chat-meta-bottom">
                                            <p className="wa-chat-preview">
                                                {isLastMsgOwn && <FiCheck className="wa-check-icon" size={13} />}
                                                <span>{lastMsg?.content || 'Tap to chat'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* ── RIGHT MAIN VIEW: WhatsApp-style Active Chat ── */}
            <main className="wa-main-chat">
                {selectedConversation ? (
                    <div className="wa-conversation-container">
                        {/* Chat Top Header */}
                        <header className="wa-chat-header">
                            <button
                                type="button"
                                className="wa-mobile-back-btn"
                                onClick={() => setShowMobileSidebar(true)}
                                title="Back to Chats"
                            >
                                <FiArrowLeft size={18} />
                            </button>

                            <div
                                className="wa-header-contact-info"
                                onClick={() => {
                                    if (isDirect) setShowUserInfo(true);
                                    else setShowGroupInfo(true);
                                }}
                            >
                                <div className="wa-header-avatar-wrap">
                                    {isDirect ? (
                                        <img
                                            src={activeOtherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversationTitle}`}
                                            alt={conversationTitle}
                                            className="wa-header-avatar"
                                        />
                                    ) : (
                                        <div className="wa-chat-group-avatar header">
                                            <FiUsers size={18} />
                                        </div>
                                    )}
                                </div>
                                <div className="wa-header-text">
                                    <h3 className="wa-header-title">{conversationTitle}</h3>
                                    <span className="wa-header-status">
                                        {isDirect
                                            ? (activeOtherUser?.role ? `${activeOtherUser.role.toLowerCase()} • active now` : 'active now')
                                            : `${selectedConversation.members?.length || 0} members`}
                                    </span>
                                </div>
                            </div>

                            <div className="wa-header-actions">
                                <button
                                    type="button"
                                    className="wa-header-btn"
                                    onClick={() => {
                                        if (isDirect) setShowUserInfo(true);
                                        else setShowGroupInfo(true);
                                    }}
                                    title="Details & Info"
                                >
                                    <FiInfo size={18} />
                                </button>
                            </div>
                        </header>

                        {/* Messages Stream Container */}
                        <div className="wa-messages-stream">
                            <div className="wa-date-separator">
                                <span>Today</span>
                            </div>

                            {messages.map((msg, index) => {
                                const isOwn = (msg.senderId || msg.sender?.id) === currentUserId;
                                const senderName = msg.sender?.name || 'Member';

                                return (
                                    <div
                                        key={msg.id || index}
                                        className={`wa-message-row ${isOwn ? 'is-own' : 'is-other'}`}
                                    >
                                        <div className="wa-message-bubble">
                                            {!isOwn && !isDirect && (
                                                <span className="wa-sender-label">{senderName}</span>
                                            )}

                                            {msg.content && (
                                                <p className="wa-message-text">{msg.content}</p>
                                            )}

                                            {/* Attachments */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="wa-bubble-attachments">
                                                    {msg.attachments.map((file, idx) => (
                                                        <div key={idx} className="wa-attachment-item">
                                                            {file.type === 'image' || (file.url && file.url.match(/\.(jpeg|jpg|gif|png)$/i) != null) ? (
                                                                <img
                                                                    src={`${API_BASE}${file.url}`}
                                                                    alt={file.name || 'Image'}
                                                                    className="wa-attachment-img"
                                                                    onClick={() => window.open(`${API_BASE}${file.url}`, '_blank')}
                                                                />
                                                            ) : (
                                                                <a
                                                                    href={`${API_BASE}${file.url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="wa-file-pill"
                                                                >
                                                                    <FiFile size={16} />
                                                                    <span className="wa-file-name">{file.name || 'Document'}</span>
                                                                    <FiDownload size={14} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="wa-bubble-meta">
                                                <span className="wa-bubble-time">
                                                    {formatBubbleTime(msg.createdAt)}
                                                </span>
                                                {isOwn && (
                                                    <span className="wa-check-ticks">✓✓</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* WhatsApp-Style Pinned Bottom Input Bar */}
                        <form className="wa-input-dock" onSubmit={sendMessage}>
                            <FileUpload
                                onFilesSelected={setSelectedFiles}
                                disabled={uploading}
                            />

                            <div className="wa-input-wrapper">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={uploading}
                                    autoComplete="off"
                                />
                            </div>

                            <button
                                type="submit"
                                className="wa-send-btn"
                                disabled={uploading || (!newMessage.trim() && selectedFiles.length === 0)}
                                title="Send message"
                            >
                                <FiSend size={16} />
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Empty State: No conversation open */
                    <div className="wa-empty-workspace">
                        <div className="wa-empty-illustration">
                            <FiMessageCircle size={56} />
                        </div>
                        <h2>Khushboo Pathshala Messages</h2>
                        <p>
                            Send and receive real-time messages with your mentors, study cohorts, and peers.
                        </p>
                        <button
                            type="button"
                            className="wa-btn-start-chat-large"
                            onClick={() => setShowNewChatModal(true)}
                        >
                            <FiPlus size={16} /> Start a New Conversation
                        </button>
                    </div>
                )}
            </main>

            {/* ── New Chat / Contacts Modal ── */}
            {showNewChatModal && (
                <div className="wa-modal-backdrop" onClick={() => setShowNewChatModal(false)}>
                    <div className="wa-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="wa-modal-header">
                            <h3>Start New Conversation</h3>
                            <button
                                type="button"
                                className="wa-modal-close-btn"
                                onClick={() => setShowNewChatModal(false)}
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="wa-contacts-modal-list">
                            {contacts.length === 0 ? (
                                <p className="wa-contacts-empty">No contacts available.</p>
                            ) : (
                                contacts.map(c => (
                                    <div
                                        key={c.id}
                                        className="wa-contact-row"
                                        onClick={() => handleStartChatWithUser(c)}
                                    >
                                        <img
                                            src={c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`}
                                            alt={c.name}
                                            className="wa-contact-row-avatar"
                                        />
                                        <div className="wa-contact-row-info">
                                            <strong>{c.name}</strong>
                                            <span>{c.role ? `${c.role} • ${c.email}` : c.email}</span>
                                        </div>
                                        <button type="button" className="wa-btn-chat-pill">
                                            Chat
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Group Modal ── */}
            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onGroupCreated={(group) => {
                        setShowCreateModal(false);
                        setConversations(prev => [group, ...prev]);
                        setSelectedConversation(group);
                        setShowMobileSidebar(false);
                        refreshConversations();
                    }}
                />
            )}

            {/* ── Side Panels (Info / Details) ── */}
            <AnimatePresence>
                {showGroupInfo && selectedConversation && (
                    <GroupInfoPanel
                        group={selectedConversation}
                        onClose={() => setShowGroupInfo(false)}
                        currentUserId={currentUserId}
                        currentUser={currentUser}
                        onLeave={(groupId) => {
                            setConversations(prev => prev.filter(c => c.id !== groupId));
                            setSelectedConversation(null);
                            setShowGroupInfo(false);
                        }}
                    />
                )}
                {showUserInfo && selectedConversation && isDirect && (
                    <UserInfoPanel
                        user={activeOtherUser}
                        onClose={() => setShowUserInfo(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessagingPage;
