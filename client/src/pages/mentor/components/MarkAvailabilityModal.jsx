import React, { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';

const MarkAvailabilityModal = ({ isOpen, onClose }) => {
    const [days, setDays] = useState({
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: false,
        Sunday: false
    });
    const [timeSlot, setTimeSlot] = useState('2.30pm - 5.30pm');
    const [maxMenteesPerDay, setMaxMenteesPerDay] = useState(3);
    const [isSaved, setIsSaved] = useState(false);

    if (!isOpen) return null;

    const toggleDay = (day) => {
        setDays(prev => ({ ...prev, [day]: !prev[day] }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            onClose();
        }, 1000);
    };

    return (
        <div className="kp-ml-modal-overlay" onClick={onClose}>
            <div
                className="kp-ml-modal-box kp-ml-modal-schedule"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="kp-ml-modal-header">
                    <h2 className="kp-ml-modal-title">Mark Mentorship Availability</h2>
                    <button className="kp-ml-modal-close-btn" onClick={onClose} aria-label="Close modal">
                        <FiX size={22} />
                    </button>
                </div>

                {isSaved ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
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
                            <FiCheck size={28} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: '#111827' }}>
                            Availability Updated!
                        </h3>
                        <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>
                            Your active hours have been saved. Students can now schedule calls during your chosen slots.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label className="kp-ml-form-label">Available Days</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {Object.keys(days).map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            className={`kp-ml-rating-btn ${days[day] ? 'is-selected' : ''}`}
                                            onClick={() => toggleDay(day)}
                                            style={{ padding: '8px 14px' }}
                                        >
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="kp-ml-form-grid">
                                <div>
                                    <label className="kp-ml-form-label">Preferred Time Window</label>
                                    <input
                                        type="text"
                                        className="kp-ml-input"
                                        value={timeSlot}
                                        onChange={(e) => setTimeSlot(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="kp-ml-form-label">Max Sessions / Day</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        className="kp-ml-input"
                                        value={maxMenteesPerDay}
                                        onChange={(e) => setMaxMenteesPerDay(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="kp-ml-modal-actions" style={{ marginTop: '10px' }}>
                                <button type="button" className="kp-ml-btn-outline" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="kp-ml-btn-dark">
                                    Save Availability
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default MarkAvailabilityModal;
