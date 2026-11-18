import React, { useState } from 'react';
import { FiX, FiLock, FiChevronDown } from 'react-icons/fi';

const RATING_LEVELS = [
    { label: 'Poor', score: 1 },
    { label: 'Fair', score: 2 },
    { label: 'Good', score: 3 },
    { label: 'Very Good', score: 4 },
    { label: 'Excellent', score: 5 },
];

const CsrFeedbackModal = ({
    isOpen,
    onClose,
    menteeName = 'Rahul Patil',
    mentees = [],
    onSubmitFeedback
}) => {
    const [selectedMentee, setSelectedMentee] = useState(menteeName);
    const [reviewPeriod, setReviewPeriod] = useState('2026');

    // Rating state
    const [ratings, setRatings] = useState({
        communication: 3, // Good
        participation: 1, // Poor
        attendance: 1,    // Poor
        learningAttitude: 3 // Good
    });

    const [improvementAreas, setImprovementAreas] = useState('');
    const [concerns, setConcerns] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleRatingChange = (category, score) => {
        setRatings(prev => ({
            ...prev,
            [category]: score
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
            if (onSubmitFeedback) {
                onSubmitFeedback({
                    mentee: selectedMentee,
                    reviewPeriod,
                    ratings,
                    improvementAreas,
                    concerns
                });
            }
            onClose();
        }, 1200);
    };

    return (
        <div className="kp-ml-modal-overlay" onClick={onClose}>
            <div
                className="kp-ml-modal-box kp-ml-modal-csr"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="kp-ml-modal-header">
                    <h2 className="kp-ml-modal-title-csr">Feedback for CSR Admin</h2>
                    <button
                        className="kp-ml-modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <FiX size={22} />
                    </button>
                </div>

                {isSubmitted ? (
                    <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#dcfce7',
                            color: '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '24px',
                            fontWeight: 'bold'
                        }}>
                            ✓
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: '#111827' }}>
                            Feedback Submitted to CSR Admin!
                        </h3>
                        <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>
                            Your evaluation for {selectedMentee} is securely stored for scholarship reviews.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Confidential Notice */}
                        <div className="kp-ml-confidential-notice">
                            <FiLock size={20} color="#374151" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div>
                                <p className="kp-ml-confidential-title">Confidential - CSR Admin only</p>
                                <p className="kp-ml-confidential-desc">
                                    This feedback is private. The mentee can never view it. Used for scholarship review &amp; support decisions.
                                </p>
                            </div>
                        </div>

                        {/* Dropdowns */}
                        <div className="kp-ml-form-grid" style={{ marginBottom: '32px' }}>
                            <div>
                                <label className="kp-ml-form-label">Mentee</label>
                                <div className="kp-ml-input-wrap">
                                    <select
                                        className="kp-ml-select"
                                        value={selectedMentee}
                                        onChange={(e) => setSelectedMentee(e.target.value)}
                                    >
                                        {mentees && mentees.length > 0 ? (
                                            mentees.map((m, idx) => (
                                                <option key={idx} value={m.name || m}>
                                                    {m.name || m}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Rahul Patil">Rahul Patil</option>
                                                <option value="Sharvari Shobhane">Sharvari Shobhane</option>
                                                <option value="Neha Patel">Neha Patel</option>
                                                <option value="Gayatri Mahadik">Gayatri Mahadik</option>
                                                <option value="Aditya Badhe">Aditya Badhe</option>
                                                <option value="Sudhir Nair">Sudhir Nair</option>
                                                <option value="Aditi Chavan">Aditi Chavan</option>
                                                <option value="Bhargav Gondaliya">Bhargav Gondaliya</option>
                                            </>
                                        )}
                                    </select>
                                    <span className="kp-ml-input-icon">
                                        <FiChevronDown size={16} />
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="kp-ml-form-label">Review Period</label>
                                <div className="kp-ml-input-wrap">
                                    <select
                                        className="kp-ml-select"
                                        value={reviewPeriod}
                                        onChange={(e) => setReviewPeriod(e.target.value)}
                                    >
                                        <option value="2026">2026</option>
                                        <option value="2025-2026">2025-2026</option>
                                        <option value="Q3 2026">Q3 2026</option>
                                    </select>
                                    <span className="kp-ml-input-icon">
                                        <FiChevronDown size={16} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Rated Assessment */}
                        <h3 className="kp-ml-rated-title">Rated Assessment</h3>

                        <div className="kp-ml-rating-list">
                            {/* Communication Skills */}
                            <div className="kp-ml-rating-row">
                                <div className="kp-ml-rating-skill">Communication Skills</div>
                                <div className="kp-ml-rating-btns">
                                    {RATING_LEVELS.map(lvl => (
                                        <button
                                            key={lvl.score}
                                            type="button"
                                            className={`kp-ml-rating-btn ${ratings.communication === lvl.score ? 'is-selected' : ''}`}
                                            onClick={() => handleRatingChange('communication', lvl.score)}
                                        >
                                            {lvl.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="kp-ml-rating-score">{ratings.communication}/5</div>
                            </div>

                            {/* Participation */}
                            <div className="kp-ml-rating-row">
                                <div className="kp-ml-rating-skill">Participation</div>
                                <div className="kp-ml-rating-btns">
                                    {RATING_LEVELS.map(lvl => (
                                        <button
                                            key={lvl.score}
                                            type="button"
                                            className={`kp-ml-rating-btn ${ratings.participation === lvl.score ? 'is-selected' : ''}`}
                                            onClick={() => handleRatingChange('participation', lvl.score)}
                                        >
                                            {lvl.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="kp-ml-rating-score">{ratings.participation}/5</div>
                            </div>

                            {/* Attendance */}
                            <div className="kp-ml-rating-row">
                                <div className="kp-ml-rating-skill">Attendance</div>
                                <div className="kp-ml-rating-btns">
                                    {RATING_LEVELS.map(lvl => (
                                        <button
                                            key={lvl.score}
                                            type="button"
                                            className={`kp-ml-rating-btn ${ratings.attendance === lvl.score ? 'is-selected' : ''}`}
                                            onClick={() => handleRatingChange('attendance', lvl.score)}
                                        >
                                            {lvl.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="kp-ml-rating-score">{ratings.attendance}/5</div>
                            </div>

                            {/* Learning Attitude */}
                            <div className="kp-ml-rating-row">
                                <div className="kp-ml-rating-skill">Learning Attitude</div>
                                <div className="kp-ml-rating-btns">
                                    {RATING_LEVELS.map(lvl => (
                                        <button
                                            key={lvl.score}
                                            type="button"
                                            className={`kp-ml-rating-btn ${ratings.learningAttitude === lvl.score ? 'is-selected' : ''}`}
                                            onClick={() => handleRatingChange('learningAttitude', lvl.score)}
                                        >
                                            {lvl.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="kp-ml-rating-score">{ratings.learningAttitude}/5</div>
                            </div>
                        </div>

                        {/* Text Areas */}
                        <div className="kp-ml-form-grid" style={{ marginBottom: '32px' }}>
                            <div>
                                <label className="kp-ml-form-label">Improvement Areas</label>
                                <textarea
                                    rows="4"
                                    className="kp-ml-textarea"
                                    placeholder="Descriptive"
                                    value={improvementAreas}
                                    onChange={(e) => setImprovementAreas(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="kp-ml-form-label">Concerns</label>
                                <textarea
                                    rows="4"
                                    className="kp-ml-textarea"
                                    placeholder="Descriptive"
                                    value={concerns}
                                    onChange={(e) => setConcerns(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="kp-ml-modal-actions" style={{ marginTop: 0 }}>
                            <button
                                type="button"
                                className="kp-ml-btn-outline"
                                style={{ padding: '8px 32px' }}
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="kp-ml-btn-dark"
                                style={{ padding: '8px 32px' }}
                            >
                                Submit to CSR
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CsrFeedbackModal;
