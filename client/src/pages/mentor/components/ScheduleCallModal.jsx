import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiChevronDown } from 'react-icons/fi';

const ScheduleCallModal = ({
    isOpen,
    onClose,
    mentees = [],
    defaultMentee = '',
    onScheduled
}) => {
    const [selectedMentee, setSelectedMentee] = useState(defaultMentee || (mentees[0]?.name ?? 'Rahul Patil'));
    const [date, setDate] = useState('20/07/2026');
    const [time, setTime] = useState('4.00pm-5.00pm');
    const [duration, setDuration] = useState('60 mins');
    const [contactNumber, setContactNumber] = useState('4567890234');
    const [meetingLink, setMeetingLink] = useState('https://meet.google.com/xyz-mentor-session');
    const [notes, setNotes] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (defaultMentee) {
            setSelectedMentee(defaultMentee);
        }
    }, [defaultMentee]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            if (onScheduled) {
                onScheduled({
                    mentee: selectedMentee,
                    date,
                    time,
                    duration,
                    contactNumber,
                    meetingLink,
                    notes
                });
            }
            onClose();
        }, 1000);
    };

    return (
        <div className="kp-ml-modal-overlay" onClick={onClose}>
            <div
                className="kp-ml-modal-box kp-ml-modal-schedule"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="kp-ml-modal-header">
                    <h2 className="kp-ml-modal-title">Schedule a Call</h2>
                    <button
                        className="kp-ml-modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <FiX size={22} />
                    </button>
                </div>

                {isSuccess ? (
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
                            ✓
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: '#111827' }}>
                            Call Scheduled Successfully!
                        </h3>
                        <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>
                            {selectedMentee} has been notified with the meeting details.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="kp-ml-form-grid">
                            {/* Mentee Select */}
                            <div className="kp-ml-form-group">
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

                            {/* Date Input */}
                            <div className="kp-ml-form-group">
                                <label className="kp-ml-form-label">Date</label>
                                <div className="kp-ml-input-wrap">
                                    <input
                                        type="text"
                                        className="kp-ml-input"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        placeholder="DD/MM/YYYY"
                                    />
                                    <span className="kp-ml-input-icon">
                                        <FiCalendar size={16} />
                                    </span>
                                </div>
                            </div>

                            {/* Time Select */}
                            <div className="kp-ml-form-group">
                                <label className="kp-ml-form-label">Time</label>
                                <div className="kp-ml-input-wrap">
                                    <select
                                        className="kp-ml-select"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    >
                                        <option value="4.00pm-5.00pm">4.00pm-5.00pm</option>
                                        <option value="2.30pm-3.30pm">2.30pm-3.30pm</option>
                                        <option value="5.00pm-6.00pm">5.00pm-6.00pm</option>
                                        <option value="11.00am-12.00pm">11.00am-12.00pm</option>
                                    </select>
                                    <span className="kp-ml-input-icon">
                                        <FiChevronDown size={16} />
                                    </span>
                                </div>
                            </div>

                            {/* Duration Input */}
                            <div className="kp-ml-form-group">
                                <label className="kp-ml-form-label">Duration</label>
                                <input
                                    type="text"
                                    className="kp-ml-input"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>

                            {/* Contact Number Input */}
                            <div className="kp-ml-form-group">
                                <label className="kp-ml-form-label">Contact Number</label>
                                <input
                                    type="text"
                                    className="kp-ml-input"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                />
                            </div>

                            {/* Meeting Link Input */}
                            <div className="kp-ml-form-group">
                                <label className="kp-ml-form-label">Meeting Link</label>
                                <input
                                    type="text"
                                    className="kp-ml-input"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                    placeholder="Paste meeting link"
                                />
                            </div>

                            {/* Notes Textarea */}
                            <div className="kp-ml-form-group col-span-2">
                                <label className="kp-ml-form-label">Notes</label>
                                <textarea
                                    rows="3"
                                    className="kp-ml-textarea"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Descriptive"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="kp-ml-modal-actions">
                                <button
                                    type="button"
                                    className="kp-ml-btn-outline"
                                    style={{ padding: '8px 28px' }}
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="kp-ml-btn-dark"
                                    style={{ padding: '8px 28px' }}
                                >
                                    Schedule &amp; Notify Mentee
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ScheduleCallModal;
