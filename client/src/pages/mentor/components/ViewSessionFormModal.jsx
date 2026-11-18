import React from 'react';
import { FiX, FiCheckCircle, FiFileText } from 'react-icons/fi';

const ViewSessionFormModal = ({ isOpen, onClose, session }) => {
    if (!isOpen || !session) return null;

    return (
        <div className="kp-ml-modal-overlay" onClick={onClose}>
            <div
                className="kp-ml-modal-box kp-ml-modal-schedule"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="kp-ml-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FiFileText size={22} color="#4b5563" />
                        <h2 className="kp-ml-modal-title">Session Review Form</h2>
                    </div>
                    <button className="kp-ml-modal-close-btn" onClick={onClose} aria-label="Close modal">
                        <FiX size={22} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13.5px' }}>
                            <div>
                                <span style={{ color: '#6b7280' }}>Topic: </span>
                                <strong style={{ color: '#111827' }}>{session.topic}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#6b7280' }}>Date: </span>
                                <strong style={{ color: '#111827' }}>{session.date}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#6b7280' }}>Mentor Attendance: </span>
                                <strong style={{ color: session.mentorAttendance === 'Present' ? '#15803d' : '#b91c1c' }}>
                                    {session.mentorAttendance}
                                </strong>
                            </div>
                            <div>
                                <span style={{ color: '#6b7280' }}>Mentee Attendance: </span>
                                <strong style={{ color: session.menteeAttendance === 'Present' ? '#15803d' : '#b91c1c' }}>
                                    {session.menteeAttendance}
                                </strong>
                            </div>
                            <div>
                                <span style={{ color: '#6b7280' }}>Session Status: </span>
                                <span className={session.status === 'Complete' ? 'kp-ml-status-badge-complete' : 'kp-ml-status-badge-incomplete'}>
                                    {session.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 6px 0' }}>
                            Discussion Summary &amp; Action Items
                        </h4>
                        <div style={{
                            padding: '12px 14px',
                            background: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13.5px',
                            color: '#374151',
                            lineHeight: '1.5'
                        }}>
                            {session.notes || (
                                `In this session, we covered core concepts of ${session.topic}. The mentee showed strong interest, answered fundamental questions well, and has been assigned exercises for the next review.`
                            )}
                        </div>
                    </div>

                    <div className="kp-ml-modal-actions" style={{ marginTop: '8px' }}>
                        <button type="button" className="kp-ml-btn-dark" onClick={onClose} style={{ padding: '8px 28px' }}>
                            Close Form
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewSessionFormModal;
