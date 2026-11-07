import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMentorStudents, useMentorBatches } from '../../../hooks/mentor/useMentorQueries';
import {
    FiUsers,
    FiSearch,
    FiMessageCircle,
    FiMail,
    FiPhone,
    FiLayers,
    FiAlertCircle,
    FiRefreshCw
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const MenteesList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');

    const { data: studentsData, isLoading, isError, refetch } = useMentorStudents({
        search: searchTerm,
        batchId: selectedBatch || undefined
    });

    const { data: batchesData } = useMentorBatches();
    const batches = Array.isArray(batchesData) ? batchesData : [];
    const students = Array.isArray(studentsData) ? studentsData : [];

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
                        Mentees Directory
                    </h1>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13.5px',
                        color: 'var(--admin-text-secondary)'
                    }}>
                        Track enrolled students across your assigned cohorts, review their engagement, and send direct messages.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{
                background: 'var(--admin-surface)',
                borderRadius: '12px',
                border: '1.5px solid var(--admin-border-color)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                        Cohort:
                    </span>
                    <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        style={{
                            padding: '7px 12px',
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: '1.5px solid var(--admin-border-color)',
                            background: 'var(--admin-bg)',
                            color: 'var(--admin-text-primary)',
                            outline: 'none',
                            minWidth: '220px'
                        }}
                    >
                        <option value="">All Assigned Cohorts</option>
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end', minWidth: '260px' }}>
                    <div style={{ position: 'relative', width: '260px' }}>
                        <FiSearch
                            size={14}
                            style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--admin-text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Find mentee by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '7px 10px 7px 30px',
                                fontSize: '12.5px',
                                borderRadius: '8px',
                                border: '1px solid var(--admin-border-color)',
                                background: 'var(--admin-bg)',
                                color: 'var(--admin-text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => refetch()}
                        title="Refresh Directory"
                        style={{
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--admin-border-color)',
                            background: 'var(--admin-bg)',
                            color: 'var(--admin-text-secondary)',
                            cursor: 'pointer'
                        }}
                    >
                        <FiRefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Error banner */}
            {isError && (
                <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                        <FiAlertCircle size={20} />
                        <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Failed to sync student directory from server.</span>
                    </div>
                    <button
                        onClick={() => refetch()}
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

            {/* Table Card */}
            <div style={{
                background: 'var(--admin-surface)',
                borderRadius: '12px',
                border: '1.5px solid var(--admin-border-color)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: 'var(--admin-bg)', borderBottom: '1.5px solid var(--admin-border-color)' }}>
                            <th style={{ textAlign: 'left', padding: '12px 18px', fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>Student Profile</th>
                            <th style={{ textAlign: 'left', padding: '12px 18px', fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>Cohort</th>
                            <th style={{ textAlign: 'left', padding: '12px 18px', fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>Contact</th>
                            <th style={{ textAlign: 'center', padding: '12px 18px', fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>Attendance</th>
                            <th style={{ textAlign: 'right', padding: '12px 18px', fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [1, 2, 3, 4].map(i => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--admin-border-color)' }}>
                                    <td colSpan={5} style={{ padding: '16px' }}>
                                        <div style={{ height: '24px', background: 'var(--admin-bg)', borderRadius: '6px', opacity: 0.6 }} />
                                    </td>
                                </tr>
                            ))
                        ) : students.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '56px 24px', textAlign: 'center' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: 'rgba(79, 70, 229, 0.08)',
                                        color: 'var(--admin-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 12px auto'
                                    }}>
                                        <FiUsers size={22} />
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                        No Mentees Found
                                    </div>
                                    <div style={{ fontSize: '12.5px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
                                        {searchTerm ? 'No students match your filter.' : 'No students enrolled in your cohorts yet.'}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            students.map((student, idx) => (
                                <motion.tr
                                    key={student.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    style={{
                                        borderBottom: idx < students.length - 1 ? '1px solid var(--admin-border-color)' : 'none',
                                        background: 'var(--admin-surface)'
                                    }}
                                >
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img
                                                src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id || student.name}`}
                                                alt={student.name}
                                                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{student.name}</div>
                                                <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>{student.educationLevel || 'Undergraduate'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(79, 70, 229, 0.08)',
                                            color: 'var(--admin-primary)'
                                        }}>
                                            <FiLayers size={11} /> {student.batchName || 'Active Cohort'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--admin-text-secondary)' }}>
                                                <FiMail size={12} style={{ color: 'var(--admin-text-muted)' }} /> {student.email}
                                            </span>
                                            {student.phone && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--admin-text-muted)', fontSize: '11px' }}>
                                                    <FiPhone size={11} /> {student.phone}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '64px',
                                                height: '6px',
                                                borderRadius: '3px',
                                                background: 'rgba(0,0,0,0.06)',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${student.attendanceAvg || 85}%`,
                                                    height: '100%',
                                                    borderRadius: '3px',
                                                    background: (student.attendanceAvg || 85) >= 75 ? 'var(--admin-success, #10B981)' : '#f59e0b'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                                                {student.attendanceAvg || 85}%
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => navigate(`/mentor/chat/${student.id}`)}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--admin-border-color)',
                                                background: 'var(--admin-bg)',
                                                color: 'var(--admin-primary)',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--admin-primary)';
                                                e.currentTarget.style.color = '#ffffff';
                                                e.currentTarget.style.borderColor = 'var(--admin-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'var(--admin-bg)';
                                                e.currentTarget.style.color = 'var(--admin-primary)';
                                                e.currentTarget.style.borderColor = 'var(--admin-border-color)';
                                            }}
                                        >
                                            <FiMessageCircle size={13} /> Chat
                                        </button>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MenteesList;
