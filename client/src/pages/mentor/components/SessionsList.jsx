import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    useUploadSession,
    useUploadResource,
    useMentorUploads,
    useDeleteUpload,
    useMentorBatches
} from '../../../hooks/mentor/useMentorQueries';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBookOpen,
    FiVideo,
    FiFileText,
    FiPlus,
    FiTrash2,
    FiSearch,
    FiX,
    FiExternalLink,
    FiCalendar,
    FiUploadCloud,
    FiLayers,
    FiAlertCircle,
    FiRefreshCw,
    FiDownload
} from 'react-icons/fi';
import { getApiErrorMessage } from '../../../api';

// --- UPLOAD MODAL ---
const UploadModal = ({ batches, onClose, onSuccess }) => {
    const [uploadType, setUploadType] = useState('SESSION'); // 'SESSION' or 'RESOURCE'
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [batchId, setBatchId] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const uploadSession = useUploadSession();
    const uploadResource = useUploadResource();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (uploadType === 'SESSION') {
                if (!videoUrl) {
                    setError('Please provide a valid YouTube video URL.');
                    setLoading(false);
                    return;
                }
                await uploadSession.mutateAsync({
                    title,
                    description,
                    batchId: batchId || null,
                    videoUrl
                });
            } else {
                if (!file) {
                    setError('Please select a document file to upload.');
                    setLoading(false);
                    return;
                }
                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                if (batchId) formData.append('batchId', batchId);
                formData.append('category', 'TECHNICAL_SKILLS');
                formData.append('file', file);
                await uploadResource.mutateAsync(formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to publish resource. Please try again.'));
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
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(79, 70, 229, 0.08)',
                                color: 'var(--admin-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiUploadCloud size={18} />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                Add Learning Resource
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--admin-text-muted)',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px'
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

                            {/* Resource Type Switcher */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Resource Type
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setUploadType('SESSION')}
                                        style={{
                                            padding: '9px 14px',
                                            borderRadius: '8px',
                                            border: uploadType === 'SESSION' ? '1.5px solid var(--admin-primary)' : '1px solid var(--admin-border-color)',
                                            background: uploadType === 'SESSION' ? 'rgba(79, 70, 229, 0.08)' : 'var(--admin-bg)',
                                            color: uploadType === 'SESSION' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FiVideo size={15} /> Video Lecture
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUploadType('RESOURCE')}
                                        style={{
                                            padding: '9px 14px',
                                            borderRadius: '8px',
                                            border: uploadType === 'RESOURCE' ? '1.5px solid var(--admin-primary)' : '1px solid var(--admin-border-color)',
                                            background: uploadType === 'RESOURCE' ? 'rgba(79, 70, 229, 0.08)' : 'var(--admin-bg)',
                                            color: uploadType === 'RESOURCE' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FiFileText size={15} /> Study Material
                                    </button>
                                </div>
                            </div>

                            {/* Batch Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Target Batch Cohort
                                </label>
                                <select
                                    value={batchId}
                                    onChange={(e) => setBatchId(e.target.value)}
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
                                    <option value="">General (All Batches)</option>
                                    {(batches || []).map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.code || 'COHORT'})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={uploadType === 'SESSION' ? 'e.g. Modern Full Stack Architecture' : 'e.g. React Cheatsheet & Guide'}
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

                            {/* Description */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                    Brief Description
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Explain key concepts covered in this material..."
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

                            {/* Video URL or File Upload */}
                            {uploadType === 'SESSION' ? (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                        YouTube Video URL *
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
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
                            ) : (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                                        Document File (PDF, DOCX, ZIP) *
                                    </label>
                                    <div style={{
                                        border: '1.5px dashed var(--admin-border-color)',
                                        borderRadius: '10px',
                                        padding: '24px 16px',
                                        textAlign: 'center',
                                        background: 'var(--admin-bg)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="file"
                                            id="mentor-file-input"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            style={{ display: 'none' }}
                                            required
                                        />
                                        <label htmlFor="mentor-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                                            <FiUploadCloud size={28} style={{ color: 'var(--admin-primary)', marginBottom: '6px' }} />
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                                {file ? file.name : 'Click to select document'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                                                Supported: PDF, DOCX, ZIP, PPTX (Up to 50MB)
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
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
                                {loading ? 'Publishing...' : 'Publish Content'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

// --- MAIN SESSIONS LIST COMPONENT ---
const SessionsList = () => {
    const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'SESSION' | 'RESOURCE'
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    const { data: uploadsData, isLoading, isError, refetch } = useMentorUploads();
    const { data: batchesData } = useMentorBatches();
    const deleteUpload = useDeleteUpload();

    const uploads = Array.isArray(uploadsData) ? uploadsData : [];
    const batches = Array.isArray(batchesData) ? batchesData : [];

    // Filter uploads
    const filteredUploads = uploads.filter(u => {
        if (activeFilter !== 'ALL' && u.type !== activeFilter) return false;
        if (selectedBatchId && u.batch_id !== selectedBatchId) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                (u.title || '').toLowerCase().includes(term) ||
                (u.description || '').toLowerCase().includes(term) ||
                (u.batchName || '').toLowerCase().includes(term)
            );
        }
        return true;
    });

    const videoCount = uploads.filter(u => u.type === 'SESSION').length;
    const resourceCount = uploads.filter(u => u.type === 'RESOURCE').length;

    const handleDelete = async (id, title) => {
        if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
            try {
                await deleteUpload.mutateAsync(id);
            } catch (err) {
                alert('Failed to delete resource. Please try again.');
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
                        Learning Resources
                    </h1>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13.5px',
                        color: 'var(--admin-text-secondary)'
                    }}>
                        Curate and share video lectures, course guides, and reference documents for your cohorts.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowUploadModal(true)}
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
                        <FiPlus size={16} /> Add Resource
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
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
                {/* Segmented Type Switcher */}
                <div style={{
                    display: 'flex',
                    background: 'var(--admin-bg)',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid var(--admin-border-color)'
                }}>
                    <button
                        onClick={() => setActiveFilter('ALL')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: activeFilter === 'ALL' ? 'var(--admin-surface)' : 'transparent',
                            color: activeFilter === 'ALL' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
                            fontWeight: activeFilter === 'ALL' ? 600 : 500,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            boxShadow: activeFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        All ({uploads.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('SESSION')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: activeFilter === 'SESSION' ? 'var(--admin-surface)' : 'transparent',
                            color: activeFilter === 'SESSION' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
                            fontWeight: activeFilter === 'SESSION' ? 600 : 500,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: activeFilter === 'SESSION' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <FiVideo size={13} /> Videos ({videoCount})
                    </button>
                    <button
                        onClick={() => setActiveFilter('RESOURCE')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: activeFilter === 'RESOURCE' ? 'var(--admin-surface)' : 'transparent',
                            color: activeFilter === 'RESOURCE' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
                            fontWeight: activeFilter === 'RESOURCE' ? 600 : 500,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: activeFilter === 'RESOURCE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <FiFileText size={13} /> Documents ({resourceCount})
                    </button>
                </div>

                {/* Batch dropdown & Search input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                    <div style={{ width: '180px' }}>
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '7px 10px',
                                fontSize: '12.5px',
                                borderRadius: '8px',
                                border: '1px solid var(--admin-border-color)',
                                background: 'var(--admin-bg)',
                                color: 'var(--admin-text-primary)',
                                outline: 'none'
                            }}
                        >
                            <option value="">All Cohorts</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ position: 'relative', width: '220px' }}>
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
                            placeholder="Filter resources..."
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
                        <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Failed to sync learning resources from server.</span>
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
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            style={{
                                height: '200px',
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
            {!isLoading && !isError && filteredUploads.length === 0 && (
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
                        <FiBookOpen size={26} />
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                        {searchTerm ? 'No Resources Found' : 'No Learning Resources Yet'}
                    </h3>
                    <p style={{ margin: '0 auto 16px auto', maxWidth: '380px', fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                        {searchTerm
                            ? `No materials match "${searchTerm}". Clear your search to view all.`
                            : 'You haven\'t published any video lectures or study materials yet. Click below to add your first resource.'}
                    </p>
                    <button
                        onClick={() => setShowUploadModal(true)}
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
                        + Add First Resource
                    </button>
                </div>
            )}

            {/* Resources Grid */}
            {!isLoading && !isError && filteredUploads.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredUploads.map(item => {
                        const isVideo = item.type === 'SESSION';
                        const displayBatch = item.batchName || (item.batch && item.batch.name) || 'All Cohorts';
                        const linkUrl = isVideo ? item.video_url : item.video_url;

                        return (
                            <motion.div
                                key={item.id}
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
                                    gap: '14px',
                                    boxShadow: 'var(--shadow-card)',
                                    position: 'relative'
                                }}
                            >
                                {/* Top Header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                        <div style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '8px',
                                            background: isVideo ? 'rgba(79, 70, 229, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                            color: isVideo ? 'var(--admin-primary)' : 'var(--admin-success, #10B981)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {isVideo ? <FiVideo size={18} /> : <FiFileText size={18} />}
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
                                                {item.title}
                                            </h3>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--admin-text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                marginTop: '2px'
                                            }}>
                                                <FiLayers size={11} /> {displayBatch}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDelete(item.id, item.title)}
                                        title="Delete Resource"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--admin-text-muted)',
                                            cursor: 'pointer',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            transition: 'color 0.15s ease'
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
                                    {item.description || 'No additional instructions or notes provided for this learning resource.'}
                                </p>

                                {/* Bottom Metadata & Link */}
                                <div style={{
                                    marginTop: 'auto',
                                    paddingTop: '12px',
                                    borderTop: '1px solid var(--admin-border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: '12px'
                                }}>
                                    <span style={{ color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FiCalendar size={12} />
                                        {new Date(item.createdAt || (item.created_at ? item.created_at * 1000 : Date.now())).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>

                                    {linkUrl ? (
                                        <a
                                            href={linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                color: 'var(--admin-primary)',
                                                fontWeight: 600,
                                                textDecoration: 'none',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                background: 'rgba(79, 70, 229, 0.06)'
                                            }}
                                        >
                                            {isVideo ? 'Watch Video' : 'Open Document'} <FiExternalLink size={12} />
                                        </a>
                                    ) : (
                                        <span style={{ color: 'var(--admin-text-muted)' }}>Internal Material</span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <UploadModal
                    batches={batches}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => refetch()}
                />
            )}
        </div>
    );
};

export default SessionsList;
