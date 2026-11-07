import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useMentorBatches, useMentorStudents } from '../../../hooks/mentor/useMentorQueries';
import {
    FiLayers,
    FiUsers,
    FiBookOpen,
    FiCheckSquare,
    FiCalendar,
    FiSearch,
    FiX,
    FiArrowRight,
    FiMail,
    FiPhone,
    FiMessageCircle,
    FiAlertCircle,
    FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- BATCH DETAILS MODAL ---
const BatchDetailsModal = ({ batch, onClose }) => {
    const navigate = useNavigate();
    const { data: studentsData, isLoading, isError } = useMentorStudents({ batchId: batch.id });
    const students = Array.isArray(studentsData) ? studentsData : [];
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = students.filter(s =>
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMessageStudent = (studentId) => {
        onClose();
        navigate(`/mentor/chat/${studentId}`);
    };

    return createPortal(
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
                <motion.div
                    className="modal-content"
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ duration: 0.2 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        maxWidth: '820px',
                        width: '95%',
                        padding: 0,
                        overflow: 'hidden',
                        borderRadius: '16px',
                        border: '1.5px solid var(--admin-border-color)'
                    }}
                >
                    {/* Modal Header */}
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--admin-border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--admin-surface)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(79, 70, 229, 0.08)',
                                color: 'var(--admin-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiLayers size={20} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                    {batch.name}
                                </h2>
                                <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                                    Cohort Code: <strong>{batch.code || 'BATCH-ACTIVE'}</strong> • Assigned: {new Date(batch.assignedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--admin-text-muted)',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Stats Ribbon */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        padding: '16px 24px',
                        background: 'var(--admin-bg)',
                        borderBottom: '1px solid var(--admin-border-color)'
                    }}>
                        <div style={{
                            background: 'var(--admin-surface)',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid var(--admin-border-color)'
                        }}>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiUsers size={13} style={{ color: 'var(--admin-primary)' }} /> Total Mentees
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--admin-text-primary)', marginTop: '4px' }}>
                                {batch.studentsCount || students.length}
                            </div>
                        </div>
                        <div style={{
                            background: 'var(--admin-surface)',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid var(--admin-border-color)'
                        }}>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiBookOpen size={13} style={{ color: '#0284c7' }} /> Resources
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--admin-text-primary)', marginTop: '4px' }}>
                                {batch.resourcesCount || 0}
                            </div>
                        </div>
                        <div style={{
                            background: 'var(--admin-surface)',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid var(--admin-border-color)'
                        }}>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiCheckSquare size={13} style={{ color: '#ea580c' }} /> Tasks
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--admin-text-primary)', marginTop: '4px' }}>
                                {batch.assignmentsCount || 0}
                            </div>
                        </div>
                        <div style={{
                            background: 'var(--admin-surface)',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid var(--admin-border-color)'
                        }}>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiCalendar size={13} style={{ color: '#059669' }} /> Status
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#059669', marginTop: '6px' }}>
                                Active Cohort
                            </div>
                        </div>
                    </div>

                    {/* Student List Body */}
                    <div style={{ padding: '20px 24px', maxHeight: '52vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                Enrolled Students ({students.length})
                            </div>
                            <div style={{ position: 'relative', width: '220px' }}>
                                <FiSearch size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--admin-text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Filter mentees..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '7px 10px 7px 30px',
                                        fontSize: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--admin-border-color)',
                                        background: 'var(--admin-surface)',
                                        color: 'var(--admin-text-primary)',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                <FiRefreshCw className="spin" size={24} style={{ marginBottom: '8px' }} />
                                <div>Loading enrolled students...</div>
                            </div>
                        ) : isError ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
                                <FiAlertCircle size={24} style={{ marginBottom: '8px' }} />
                                <div>Failed to load student roster. Please try again.</div>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                <FiUsers size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <div style={{ fontSize: '13px' }}>
                                    {searchTerm ? 'No students match your filter.' : 'No students enrolled in this batch yet.'}
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                borderRadius: '10px',
                                border: '1px solid var(--admin-border-color)',
                                overflow: 'hidden'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border-color)' }}>
                                            <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>Student</th>
                                            <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>Contact</th>
                                            <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>Attendance</th>
                                            <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((s, idx) => (
                                            <tr
                                                key={s.id || idx}
                                                style={{
                                                    borderBottom: idx < filteredStudents.length - 1 ? '1px solid var(--admin-border-color)' : 'none',
                                                    background: 'var(--admin-surface)'
                                                }}
                                            >
                                                <td style={{ padding: '12px 14px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <img
                                                            src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id || s.name}`}
                                                            alt={s.name}
                                                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6' }}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{s.name}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{s.educationLevel || 'Student'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 14px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--admin-text-secondary)' }}>
                                                            <FiMail size={12} style={{ color: 'var(--admin-text-muted)' }} /> {s.email}
                                                        </span>
                                                        {s.phone && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--admin-text-muted)', fontSize: '11px' }}>
                                                                <FiPhone size={11} /> {s.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '60px',
                                                            height: '6px',
                                                            borderRadius: '3px',
                                                            background: 'rgba(0,0,0,0.06)',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${s.attendanceAvg || 85}%`,
                                                                height: '100%',
                                                                borderRadius: '3px',
                                                                background: (s.attendanceAvg || 85) >= 75 ? 'var(--admin-success, #10B981)' : '#f59e0b'
                                                            }} />
                                                        </div>
                                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                                                            {s.attendanceAvg || 85}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => handleMessageStudent(s.id)}
                                                        title="Message Mentee"
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--admin-border-color)',
                                                            background: 'var(--admin-bg)',
                                                            color: 'var(--admin-primary)',
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        <FiMessageCircle size={13} /> Message
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div style={{
                        padding: '14px 24px',
                        borderTop: '1px solid var(--admin-border-color)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        background: 'var(--admin-bg)'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                background: 'var(--admin-primary)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 500,
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

// --- MAIN BATCHES LIST COMPONENT ---
const BatchesList = () => {
    const { data: batchesData, isLoading, isError, refetch } = useMentorBatches();
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const batches = Array.isArray(batchesData) ? batchesData : [];

    const filteredBatches = batches.filter(b =>
        (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header section matching Admin styling */}
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
                        Batch Cohorts
                    </h1>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13.5px',
                        color: 'var(--admin-text-secondary)'
                    }}>
                        Monitor assigned cohorts, review enrolled mentees, and track academic progression.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', width: '240px' }}>
                        <FiSearch
                            size={14}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--admin-text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search batches..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 34px',
                                fontSize: '13px',
                                borderRadius: '8px',
                                border: '1.5px solid var(--admin-border-color)',
                                background: 'var(--admin-surface)',
                                color: 'var(--admin-text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => refetch()}
                        title="Refresh Batches"
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid var(--admin-border-color)',
                            background: 'var(--admin-surface)',
                            color: 'var(--admin-text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px'
                        }}
                    >
                        <FiRefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Error State */}
            {isError && (
                <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                        <FiAlertCircle size={22} />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>Unable to load batch cohorts</div>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Could not synchronize records with the server.</div>
                        </div>
                    </div>
                    <button
                        onClick={() => refetch()}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid #ef4444',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            style={{
                                height: '220px',
                                borderRadius: '12px',
                                background: 'var(--admin-surface)',
                                border: '1.5px solid var(--admin-border-color)',
                                opacity: 0.6,
                                animation: 'pulse 1.5s infinite'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && filteredBatches.length === 0 && (
                <div style={{
                    padding: '56px 24px',
                    borderRadius: '14px',
                    border: '1.5px dashed var(--admin-border-color)',
                    background: 'var(--admin-surface)',
                    textAlign: 'center'
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
                        <FiLayers size={26} />
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                        {searchTerm ? 'No Matching Batches' : 'No Batches Assigned'}
                    </h3>
                    <p style={{ margin: '0 auto 16px auto', maxWidth: '380px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                        {searchTerm
                            ? `We couldn't find any batches matching "${searchTerm}". Try a different search term.`
                            : 'You have not been assigned to any learning cohorts yet. When an administrator assigns you to a batch, it will appear here.'}
                    </p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '8px',
                                background: 'var(--admin-bg)',
                                border: '1px solid var(--admin-border-color)',
                                color: 'var(--admin-text-primary)',
                                fontSize: '12.5px',
                                cursor: 'pointer'
                            }}
                        >
                            Clear Search
                        </button>
                    )}
                </div>
            )}

            {/* Batches Grid */}
            {!isLoading && !isError && filteredBatches.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredBatches.map(batch => (
                        <motion.div
                            key={batch.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.18 }}
                            style={{
                                background: 'var(--admin-surface)',
                                borderRadius: '12px',
                                border: '1.5px solid var(--admin-border-color)',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                boxShadow: 'var(--shadow-card)',
                                position: 'relative'
                            }}
                        >
                            {/* Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            color: 'var(--admin-text-primary)'
                                        }}>
                                            {batch.name}
                                        </h3>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(79, 70, 229, 0.08)',
                                            color: 'var(--admin-primary)',
                                            letterSpacing: '0.02em'
                                        }}>
                                            {batch.code || 'COHORT'}
                                        </span>
                                    </div>
                                    <p style={{
                                        margin: '8px 0 0 0',
                                        fontSize: '13px',
                                        color: 'var(--admin-text-secondary)',
                                        lineHeight: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {batch.description || 'Standard active learning cohort focusing on curriculum milestones and project reviews.'}
                                    </p>
                                </div>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '3px 9px',
                                    borderRadius: '6px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: 'var(--admin-success, #10B981)',
                                    whiteSpace: 'nowrap'
                                }}>
                                    Active
                                </span>
                            </div>

                            {/* Enrolled Students Avatar Pile */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                background: 'var(--admin-bg)',
                                border: '1px solid var(--admin-border-color)'
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--admin-text-secondary)' }}>
                                    Cohort Mentees:
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ display: 'flex', marginLeft: '6px' }}>
                                        {[...Array(Math.min(4, batch.studentsCount || 1))].map((_, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    width: '26px',
                                                    height: '26px',
                                                    borderRadius: '50%',
                                                    border: '2px solid var(--admin-surface)',
                                                    marginLeft: idx > 0 ? '-8px' : 0,
                                                    background: 'var(--admin-primary)',
                                                    color: '#ffffff',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                        {batch.studentsCount || 0} enrolled
                                    </span>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '8px',
                                marginTop: 'auto'
                            }}>
                                <div style={{
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Mentees</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--admin-text-primary)', marginTop: '2px' }}>
                                        {batch.studentsCount || 0}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Materials</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--admin-text-primary)', marginTop: '2px' }}>
                                        {batch.resourcesCount || 0}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Tasks</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--admin-text-primary)', marginTop: '2px' }}>
                                        {batch.assignmentsCount || 0}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => setSelectedBatch(batch)}
                                style={{
                                    width: '100%',
                                    padding: '9px 14px',
                                    borderRadius: '8px',
                                    border: '1.5px solid var(--admin-border-color)',
                                    background: 'var(--admin-surface)',
                                    color: 'var(--admin-primary)',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--admin-primary)';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.borderColor = 'var(--admin-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--admin-surface)';
                                    e.currentTarget.style.color = 'var(--admin-primary)';
                                    e.currentTarget.style.borderColor = 'var(--admin-border-color)';
                                }}
                            >
                                View Cohort Details <FiArrowRight size={14} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Batch Details Modal */}
            {selectedBatch && (
                <BatchDetailsModal
                    batch={selectedBatch}
                    onClose={() => setSelectedBatch(null)}
                />
            )}
        </div>
    );
};

export default BatchesList;
