import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    useMentorAssignments,
    useMentorBatches,
    useCreateAssignment,
    useDeleteAssignment
} from '../../../hooks/mentor/useMentorQueries';
import { assignmentAPI, getApiErrorMessage } from '../../../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiFileText,
    FiPlus,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiX,
    FiTrash2,
    FiExternalLink,
    FiDownload,
    FiUsers,
    FiLayers,
    FiAlertCircle,
    FiRefreshCw,
    FiEdit3,
    FiAward,
    FiSend
} from 'react-icons/fi';

// --- CREATE ASSIGNMENT MODAL ---
const CreateAssignmentModal = ({ batches, selectedBatchId, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [batchId, setBatchId] = useState(selectedBatchId || (batches[0]?.id || ''));
    const [dueDate, setDueDate] = useState('');
    const [maxMarks, setMaxMarks] = useState(100);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const createAssignment = useCreateAssignment();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!batchId) {
                setError('Please select a target batch.');
                setLoading(false);
                return;
            }

            await createAssignment.mutateAsync({
                title,
                description,
                batchId,
                dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                maxMarks: Number(maxMarks) || 100
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to publish assignment.'));
            setLoading(false);
        }
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
                        maxWidth: '560px',
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
                                <FiFileText size={18} />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                Issue New Assignment
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
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

                    <form onSubmit={handleSubmit}>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {error && (
                                <div style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    color: '#ef4444',
                                    fontSize: '12.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <FiAlertCircle size={15} /> {error}
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Target Batch Cohort *
                                </label>
                                <select
                                    value={batchId}
                                    onChange={(e) => setBatchId(e.target.value)}
                                    required
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
                                >
                                    <option value="">Select batch...</option>
                                    {(batches || []).map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.code || 'COHORT'})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Assignment Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Portfolio Website with React & Tailwind"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
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
                                    Instructions & Deliverables *
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Outline the assignment requirements, evaluation criteria, and acceptable deliverable formats..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                        Due Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={dueDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setDueDate(e.target.value)}
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
                                        Max Marks
                                    </label>
                                    <input
                                        type="number"
                                        min={10}
                                        max={100}
                                        value={maxMarks}
                                        onChange={(e) => setMaxMarks(e.target.value)}
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
                                onClick={onClose}
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
                                disabled={loading}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    background: 'var(--admin-primary)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Deploying...' : 'Publish Task'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

// --- SUBMISSIONS & GRADING MODAL ---
const SubmissionsGradingModal = ({ assignment, onClose, onRefresh }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState(null);
    const [gradeInput, setGradeInput] = useState('A');
    const [feedbackInput, setFeedbackInput] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        loadAssignmentDetails();
    }, [assignment.id]);

    const loadAssignmentDetails = async () => {
        setLoading(true);
        try {
            const res = await assignmentAPI.getAssignmentDetails(assignment.id);
            setDetails(res.data);
        } catch (err) {
            console.error('Failed to load assignment details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReview = async (submissionId) => {
        setSubmittingReview(true);
        try {
            await assignmentAPI.reviewSubmission(submissionId, {
                grade: gradeInput,
                feedback: feedbackInput || 'Well executed! Keep up the solid momentum.',
                status: 'REVIEWED'
            });
            setReviewingId(null);
            await loadAssignmentDetails();
            if (onRefresh) onRefresh();
        } catch (err) {
            alert('Failed to save review. Please try again.');
        } finally {
            setSubmittingReview(false);
        }
    };

    const startReview = (sub) => {
        setReviewingId(sub.id);
        setGradeInput(sub.grade || 'A');
        setFeedbackInput(sub.feedback || '');
    };

    const submissions = details?.submissions || [];

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
                    {/* Header */}
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
                                width: '38px',
                                height: '38px',
                                borderRadius: '8px',
                                background: 'rgba(79, 70, 229, 0.08)',
                                color: 'var(--admin-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiAward size={20} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                    {assignment.title}
                                </h2>
                                <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                                    Due: {new Date(assignment.dueDate || assignment.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • Max Marks: {assignment.maxMarks || 100}
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
                                padding: '6px'
                            }}
                        >
                            <FiX size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                <FiRefreshCw className="spin" size={24} style={{ marginBottom: '8px' }} />
                                <div>Loading submitted deliverables...</div>
                            </div>
                        ) : submissions.length === 0 ? (
                            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                <FiClock size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                    No Student Submissions Yet
                                </div>
                                <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                                    Students in this batch have not turned in their work for this assignment yet.
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {submissions.map(sub => {
                                    const student = sub.student || {};
                                    const isReviewed = sub.status === 'REVIEWED';
                                    const isBeingReviewed = reviewingId === sub.id;

                                    return (
                                        <div
                                            key={sub.id}
                                            style={{
                                                borderRadius: '10px',
                                                border: '1px solid var(--admin-border-color)',
                                                background: 'var(--admin-surface)',
                                                padding: '16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px'
                                            }}
                                        >
                                            {/* Student Info & Submission Date */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img
                                                        src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.studentId || 'std'}`}
                                                        alt={student.name}
                                                        style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--admin-text-primary)' }}>
                                                            {student.name || 'Student Deliverable'}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                            {student.email || 'Enrolled Student'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        background: isReviewed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: isReviewed ? 'var(--admin-success, #10B981)' : '#f59e0b'
                                                    }}>
                                                        {isReviewed ? `Graded: ${sub.grade}` : 'Needs Review'}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                        {new Date(sub.submittedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Deliverable Link / File */}
                                            <div style={{
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                background: 'var(--admin-bg)',
                                                border: '1px solid var(--admin-border-color)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                flexWrap: 'wrap',
                                                gap: '8px'
                                            }}>
                                                <div style={{ fontSize: '12.5px', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <FiFileText size={14} style={{ color: 'var(--admin-primary)' }} />
                                                    {sub.notes ? (
                                                        <span><strong>Notes:</strong> {sub.notes}</span>
                                                    ) : (
                                                        <span>Submitted work deliverable</span>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {sub.submissionUrl && (
                                                        <a
                                                            href={sub.submissionUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                background: 'rgba(79, 70, 229, 0.08)',
                                                                color: 'var(--admin-primary)',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                textDecoration: 'none',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            Open Link <FiExternalLink size={12} />
                                                        </a>
                                                    )}
                                                    {sub.filePath && (
                                                        <a
                                                            href={sub.filePath}
                                                            download
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                background: 'rgba(16, 185, 129, 0.08)',
                                                                color: 'var(--admin-success, #10B981)',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                textDecoration: 'none',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            Download <FiDownload size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Review Display or Form */}
                                            {isBeingReviewed ? (
                                                <div style={{
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(79, 70, 229, 0.04)',
                                                    border: '1.5px solid rgba(79, 70, 229, 0.2)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px'
                                                }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '4px' }}>
                                                                Grade / Score
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. A+ or 95"
                                                                value={gradeInput}
                                                                onChange={(e) => setGradeInput(e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '7px 10px',
                                                                    fontSize: '12.5px',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid var(--admin-border-color)',
                                                                    background: 'var(--admin-surface)',
                                                                    color: 'var(--admin-text-primary)',
                                                                    outline: 'none'
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '4px' }}>
                                                                Constructive Feedback
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="Great attention to detail, clean components..."
                                                                value={feedbackInput}
                                                                onChange={(e) => setFeedbackInput(e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '7px 10px',
                                                                    fontSize: '12.5px',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid var(--admin-border-color)',
                                                                    background: 'var(--admin-surface)',
                                                                    color: 'var(--admin-text-primary)',
                                                                    outline: 'none'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                        <button
                                                            onClick={() => setReviewingId(null)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                background: 'transparent',
                                                                border: '1px solid var(--admin-border-color)',
                                                                color: 'var(--admin-text-secondary)',
                                                                fontSize: '12px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveReview(sub.id)}
                                                            disabled={submittingReview}
                                                            style={{
                                                                padding: '6px 16px',
                                                                borderRadius: '6px',
                                                                background: 'var(--admin-primary)',
                                                                color: '#ffffff',
                                                                border: 'none',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <FiSend size={12} /> {submittingReview ? 'Saving...' : 'Save Evaluation'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : isReviewed ? (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                                    <div style={{ color: 'var(--admin-text-secondary)' }}>
                                                        <strong>Feedback:</strong> {sub.feedback || 'Good work!'}
                                                    </div>
                                                    <button
                                                        onClick={() => startReview(sub)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--admin-primary)',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <FiEdit3 size={12} /> Edit Grade
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => startReview(sub)}
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '6px',
                                                            background: 'var(--admin-primary)',
                                                            color: '#ffffff',
                                                            border: 'none',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        <FiAward size={13} /> Grade Deliverable
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
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
                                fontWeight: 600,
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

// --- MAIN ASSIGNMENTS COMPONENT ---
const AssignmentsList = () => {
    const { data: batchesData } = useMentorBatches();
    const batches = Array.isArray(batchesData) ? batchesData : [];

    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [gradingAssignment, setGradingAssignment] = useState(null);

    // Auto select first batch
    useEffect(() => {
        if (!selectedBatchId && batches.length > 0) {
            setSelectedBatchId(batches[0].id);
        }
    }, [batches, selectedBatchId]);

    const { data: assignmentsData, isLoading, isError, refetch } = useMentorAssignments(selectedBatchId);
    const deleteAssignment = useDeleteAssignment();

    const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];

    const handleDelete = async (id, title) => {
        if (window.confirm(`Are you sure you want to delete assignment "${title}"?`)) {
            try {
                await deleteAssignment.mutateAsync(id);
            } catch (err) {
                alert('Failed to delete assignment.');
            }
        }
    };

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
                        Curriculum Tasks & Assignments
                    </h1>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13.5px',
                        color: 'var(--admin-text-secondary)'
                    }}>
                        Deploy milestones, evaluate student deliverables, and provide personalized grade feedback.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowCreateModal(true)}
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
                        <FiPlus size={16} /> Issue Task
                    </button>
                </div>
            </div>

            {/* Batch Selector Bar */}
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
                        Target Cohort:
                    </span>
                    <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
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
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name} ({b.code || 'COHORT'})</option>
                        ))}
                    </select>
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--admin-text-muted)' }}>
                    {assignments.length} {assignments.length === 1 ? 'task' : 'tasks'} issued for this cohort
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
                        <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Failed to sync batch assignments.</span>
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

            {/* Loading */}
            {isLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                    {[1, 2].map(i => (
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

            {/* Empty state */}
            {!isLoading && !isError && assignments.length === 0 && (
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
                        <FiFileText size={26} />
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                        No Assignments Created
                    </h3>
                    <p style={{ margin: '0 auto 16px auto', maxWidth: '380px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                        You haven't issued any curriculum tasks or projects to this cohort yet. Click below to issue the first assignment.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            background: 'var(--admin-primary)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        + Issue First Task
                    </button>
                </div>
            )}

            {/* Assignments Grid */}
            {!isLoading && !isError && assignments.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: '20px'
                }}>
                    {assignments.map(assign => {
                        const subsCount = assign.submissionsCount || 0;
                        const reviewedCount = assign.reviewedCount || 0;
                        const totalStudents = assign.batchStudentsCount || 3;

                        return (
                            <motion.div
                                key={assign.id}
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
                                {/* Top Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                        <div style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '8px',
                                            background: 'rgba(79, 70, 229, 0.08)',
                                            color: 'var(--admin-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <FiFileText size={18} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: 'var(--admin-text-primary)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {assign.title}
                                            </h3>
                                            <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                Max Score: {assign.maxMarks || 100} Pts
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(assign.id, assign.title)}
                                        title="Delete Task"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--admin-text-muted)',
                                            cursor: 'pointer',
                                            padding: '6px',
                                            borderRadius: '6px'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--admin-text-muted)'}
                                    >
                                        <FiTrash2 size={15} />
                                    </button>
                                </div>

                                {/* Description */}
                                <p style={{
                                    margin: 0,
                                    fontSize: '13px',
                                    color: 'var(--admin-text-secondary)',
                                    lineHeight: 1.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {assign.description || 'Milestone project deliverable covering core curriculum competencies.'}
                                </p>

                                {/* Submission Stats Strip */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '8px',
                                    background: 'var(--admin-bg)',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--admin-border-color)'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Deliverables</div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--admin-text-primary)', marginTop: '2px' }}>
                                            {subsCount} / {totalStudents} submitted
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Evaluations</div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--admin-success, #10B981)', marginTop: '2px' }}>
                                            {reviewedCount} graded
                                        </div>
                                    </div>
                                </div>

                                {/* Footer & Action */}
                                <div style={{
                                    marginTop: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FiCalendar size={12} />
                                        Due {new Date(assign.dueDate || assign.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>

                                    <button
                                        onClick={() => setGradingAssignment(assign)}
                                        style={{
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            background: 'var(--admin-primary)',
                                            color: '#ffffff',
                                            border: 'none',
                                            fontSize: '12.5px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <FiAward size={13} /> Review Submissions
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Assignment Modal */}
            {showCreateModal && (
                <CreateAssignmentModal
                    batches={batches}
                    selectedBatchId={selectedBatchId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => refetch()}
                />
            )}

            {/* Grading Modal */}
            {gradingAssignment && (
                <SubmissionsGradingModal
                    assignment={gradingAssignment}
                    onClose={() => setGradingAssignment(null)}
                    onRefresh={() => refetch()}
                />
            )}
        </div>
    );
};

export default AssignmentsList;
