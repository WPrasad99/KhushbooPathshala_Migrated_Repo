import { useState, useEffect, useRef } from 'react';
import { assignmentAPI, quizAPI } from '../api';
import {
    FiFileText,
    FiSend,
    FiCheckCircle,
    FiAlertCircle,
    FiClock,
    FiUpload,
    FiX,
    FiSearch,
    FiExternalLink,
    FiMessageSquare,
    FiAward,
    FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const StudentAssignmentSection = () => {
    // --- State Management ---
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'assignments', 'quizzes'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'submitted', 'graded'

    // Interaction State
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submissionContent, setSubmissionContent] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedbackModalItem, setFeedbackModalItem] = useState(null);

    // Quiz Player State
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [currentQuizId, setCurrentQuizId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [markedForReview, setMarkedForReview] = useState(new Set());
    const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
    const quizContainerRef = useRef(null);
    const timerRef = useRef(null);

    // --- Lifecycle ---
    useEffect(() => {
        fetchData();
    }, []);

    // Quiz Timer & Anti-Cheat Effect
    useEffect(() => {
        if (activeQuiz && quizData) {
            setTimeLeft(quizData.duration * 60);

            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            const handleVisibilityChange = () => {
                if (document.hidden && isFullScreen) {
                    setTabSwitchCount(prev => {
                        const newCount = prev + 1;
                        if (newCount >= 3) {
                            alert('Too many tab switches detected! Quiz will be auto-submitted.');
                            handleAutoSubmit();
                        } else {
                            alert(`Warning: Tab switching detected! (${newCount}/3). Quiz will be auto-submitted after 3 attempts.`);
                        }
                        return newCount;
                    });
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, [activeQuiz, quizData, isFullScreen]);

    useEffect(() => {
        if (activeQuiz) {
            setVisitedQuestions(prev => new Set(prev).add(currentQuestionIndex));
        }
    }, [currentQuestionIndex, activeQuiz]);

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, quizzesRes] = await Promise.all([
                assignmentAPI.getAssignments(),
                quizAPI.getStudentQuizzes()
            ]);
            setAssignments(assignmentsRes.data || []);
            setQuizzes(quizzesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch assignments and quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Status Helpers ---
    const getSubmission = (assignment) => {
        return assignment.submission || assignment.mySubmission || assignment.submissions?.[0] || null;
    };

    const getStatusInfo = (assignment) => {
        const sub = getSubmission(assignment);
        if (!sub) {
            const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
            if (isOverdue) return { label: 'Overdue', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <FiAlertCircle /> };
            return { label: 'Pending Submission', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: <FiClock /> };
        }
        if (sub.status === 'REVIEWED') {
            return { label: `Graded: ${sub.grade || 'A'}`, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: <FiAward /> };
        }
        return { label: 'Submitted', color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.1)', icon: <FiCheckCircle /> };
    };

    const getQuizStatus = (quiz) => {
        if (!quiz.submission) {
            const isOverdue = quiz.dueDate && new Date(quiz.dueDate) < new Date();
            if (isOverdue) return { label: 'Overdue', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <FiAlertCircle /> };
            return { label: 'Not Started', color: 'var(--admin-text-secondary)', bg: 'rgba(107, 114, 128, 0.1)', icon: <FiClock /> };
        }
        if (quiz.submission.status === 'IN_PROGRESS') {
            return { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: <FiClock /> };
        }
        if (quiz.submission.status === 'COMPLETED') {
            return { label: `Score: ${quiz.submission.score}/${quiz.totalMarks}`, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: <FiCheckCircle /> };
        }
        return { label: 'Submitted', color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.1)', icon: <FiCheckCircle /> };
    };

    // --- Filtering Logic ---
    const filteredContent = () => {
        let content = [];

        if (activeTab === 'all' || activeTab === 'assignments') {
            const mappedAssignments = assignments.map(a => ({ ...a, type: 'assignment' }));
            content = [...content, ...mappedAssignments];
        }
        if (activeTab === 'all' || activeTab === 'quizzes') {
            const mappedQuizzes = quizzes.map(q => ({ ...q, type: 'quiz' }));
            content = [...content, ...mappedQuizzes];
        }

        return content.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            if (filterStatus === 'all') return true;

            if (item.type === 'assignment') {
                const sub = getSubmission(item);
                if (filterStatus === 'pending') return !sub;
                if (filterStatus === 'submitted') return sub && sub.status !== 'REVIEWED';
                if (filterStatus === 'graded') return sub && sub.status === 'REVIEWED';
            } else {
                if (filterStatus === 'pending') return !item.submission;
                if (filterStatus === 'submitted') return item.submission && item.submission.status !== 'COMPLETED';
                if (filterStatus === 'graded') return item.submission && item.submission.status === 'COMPLETED';
            }

            return true;
        });
    };

    // --- Assignment Handlers ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        if (!selectedFile && !submissionContent.trim()) {
            alert('Please attach a file or provide a deliverable URL/notes.');
            return;
        }

        try {
            setSubmitting(true);
            let data;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('notes', submissionContent.trim() || selectedFile.name);
                formData.append('submissionUrl', submissionContent.trim());
                data = formData;
            } else {
                data = {
                    submissionUrl: submissionContent.trim(),
                    notes: submissionContent.trim()
                };
            }

            await assignmentAPI.submitAssignment(selectedAssignment.id, data);

            setSubmissionContent('');
            setSelectedFile(null);
            setShowSubmitModal(false);
            setSelectedAssignment(null);
            await fetchData();
            alert('Assignment submitted successfully!');
        } catch (error) {
            console.error('Failed to submit assignment:', error);
            alert('Failed to submit assignment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Quiz Handlers ---
    const handleStartQuiz = async (quiz) => {
        try {
            await quizAPI.startQuiz(quiz.id);
            const response = await quizAPI.getQuizDetails(quiz.id);
            setQuizData(response.data);
            setCurrentQuizId(quiz.id);
            setActiveQuiz(quiz);
            setAnswers({});

            if (quizContainerRef.current) {
                try {
                    await quizContainerRef.current.requestFullscreen();
                    setIsFullScreen(true);
                } catch (err) {
                    console.error('Failed to enter fullscreen:', err);
                }
            }
        } catch (error) {
            console.error('Failed to start quiz:', error);
            alert('Failed to start quiz. Please try again.');
        }
    };

    const handleAnswerSelect = (questionId, optionIndex) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleAutoSubmit = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        await submitQuiz();
    };

    const handleSubmitQuiz = async () => {
        if (window.confirm('Are you sure you want to finalize and submit the quiz?')) {
            await submitQuiz();
        }
    };

    const submitQuiz = async () => {
        try {
            const response = await quizAPI.submitQuiz(currentQuizId, answers);
            setResult(response.data);
            setShowResult(true);

            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            setIsFullScreen(false);

            await fetchData();

            setTimeout(() => {
                setActiveQuiz(null);
                setQuizData(null);
                setShowResult(false);
                setAnswers({});
                setTabSwitchCount(0);
            }, 4000);
        } catch (error) {
            console.error('Failed to submit quiz:', error);
            alert('Failed to submit quiz. Please try again.');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getQuestionStatusColor = (idx) => {
        const questionId = quizData.questions[idx].id;
        const isAnswered = answers[questionId] !== undefined;
        const isMarked = markedForReview.has(questionId);
        const isCurrent = currentQuestionIndex === idx;
        const isVisited = visitedQuestions.has(idx);

        if (isCurrent) return 'var(--admin-primary)';
        if (isMarked) return '#8B5CF6';
        if (isAnswered) return '#10B981';
        if (isVisited && !isAnswered) return '#EF4444';
        return 'var(--admin-border-color)';
    };

    // 1. Quiz Player Mode
    if (activeQuiz && quizData && !showResult) {
        const currentQuestion = quizData.questions[currentQuestionIndex];
        const totalQuestions = quizData.questions.length;

        return (
            <div
                ref={quizContainerRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'var(--admin-bg)',
                    color: 'var(--admin-text-primary)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Quiz Top Bar */}
                <div style={{
                    padding: '16px 24px',
                    background: 'var(--admin-surface)',
                    borderBottom: '1.5px solid var(--admin-border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>
                            {activeQuiz.title}
                        </h2>
                        <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                            Question {currentQuestionIndex + 1} of {totalQuestions}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.08)',
                            color: timeLeft < 60 ? '#EF4444' : 'var(--admin-primary)',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            fontSize: '16px'
                        }}>
                            ⏱ {formatTime(timeLeft)}
                        </div>

                        <button
                            onClick={handleSubmitQuiz}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '8px',
                                background: 'var(--admin-primary)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            Submit Quiz
                        </button>
                    </div>
                </div>

                {/* Quiz Body */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Question Pane */}
                    <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', lineHeight: 1.5 }}>
                            {currentQuestionIndex + 1}. {currentQuestion.questionText}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '650px' }}>
                            {currentQuestion.options?.map((option, optIdx) => {
                                const isSelected = answers[currentQuestion.id] === optIdx;
                                return (
                                    <div
                                        key={optIdx}
                                        onClick={() => handleAnswerSelect(currentQuestion.id, optIdx)}
                                        style={{
                                            padding: '14px 18px',
                                            borderRadius: '10px',
                                            border: isSelected ? '2px solid var(--admin-primary)' : '1.5px solid var(--admin-border-color)',
                                            background: isSelected ? 'rgba(79, 70, 229, 0.06)' : 'var(--admin-surface)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: isSelected ? '5px solid var(--admin-primary)' : '2px solid var(--admin-border-color)',
                                            background: isSelected ? '#ffffff' : 'transparent'
                                        }} />
                                        <span style={{ fontSize: '14px', color: 'var(--admin-text-primary)' }}>{option}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Navigation Footer */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '36px' }}>
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                style={{
                                    padding: '9px 18px',
                                    borderRadius: '8px',
                                    border: '1.5px solid var(--admin-border-color)',
                                    background: 'var(--admin-surface)',
                                    color: 'var(--admin-text-secondary)',
                                    fontWeight: 600,
                                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                                disabled={currentQuestionIndex === totalQuestions - 1}
                                style={{
                                    padding: '9px 20px',
                                    borderRadius: '8px',
                                    background: 'var(--admin-primary)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: 600,
                                    cursor: currentQuestionIndex === totalQuestions - 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {/* Question Palette Sidebar */}
                    <div style={{
                        width: '280px',
                        background: 'var(--admin-surface)',
                        borderLeft: '1.5px solid var(--admin-border-color)',
                        padding: '24px',
                        overflowY: 'auto'
                    }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>Question Palette</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {quizData.questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: '8px',
                                        border: currentQuestionIndex === idx ? '2px solid var(--admin-primary)' : '1px solid var(--admin-border-color)',
                                        background: getQuestionStatusColor(idx),
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Quiz Result Overlay
    if (showResult && result) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        maxWidth: '480px',
                        margin: '0 auto',
                        padding: '36px',
                        background: 'var(--admin-surface)',
                        borderRadius: '16px',
                        border: '1.5px solid var(--admin-border-color)',
                        boxShadow: 'var(--shadow-card)'
                    }}
                >
                    <FiCheckCircle size={56} style={{ color: '#10B981', marginBottom: '16px' }} />
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        Quiz Submitted Successfully!
                    </h2>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--admin-primary)', margin: '0 0 8px 0' }}>
                        Your Score: {result.score} / {result.totalMarks}
                    </p>
                    <p style={{ color: 'var(--admin-text-secondary)', fontSize: '13px', margin: 0 }}>
                        Updating your progress records...
                    </p>
                </motion.div>
            </div>
        );
    }

    // 3. Main Modern SaaS List Mode
    const items = filteredContent();

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
            {/* Header / Filter Toolbar */}
            <div style={{
                background: 'var(--admin-surface)',
                borderRadius: '12px',
                border: '1.5px solid var(--admin-border-color)',
                padding: '14px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
            }}>
                {/* Search Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border-color)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    minWidth: '240px',
                    flex: '1 1 240px'
                }}>
                    <FiSearch size={16} style={{ color: 'var(--admin-text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search assignments or quizzes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '13px',
                            color: 'var(--admin-text-primary)',
                            width: '100%'
                        }}
                    />
                </div>

                {/* Type Tabs */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--admin-bg)',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid var(--admin-border-color)'
                }}>
                    {[
                        { id: 'all', label: 'All Items' },
                        { id: 'assignments', label: 'Assignments' },
                        { id: 'quizzes', label: 'Quizzes' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--admin-primary)' : 'transparent',
                                color: activeTab === tab.id ? '#ffffff' : 'var(--admin-text-secondary)',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'pending', label: 'Pending' },
                        { id: 'submitted', label: 'Submitted' },
                        { id: 'graded', label: 'Graded' }
                    ].map(st => (
                        <button
                            key={st.id}
                            onClick={() => setFilterStatus(st.id)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: filterStatus === st.id ? '1.5px solid var(--admin-primary)' : '1px solid var(--admin-border-color)',
                                background: filterStatus === st.id ? 'rgba(79, 70, 229, 0.08)' : 'var(--admin-surface)',
                                color: filterStatus === st.id ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Cards Grid */}
            {loading ? (
                <div style={{
                    padding: '60px',
                    textAlign: 'center',
                    background: 'var(--admin-surface)',
                    borderRadius: '12px',
                    border: '1.5px solid var(--admin-border-color)'
                }}>
                    <FiRefreshCw className="spin-animation" size={28} style={{ color: 'var(--admin-primary)', marginBottom: '12px' }} />
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--admin-text-secondary)' }}>
                        Loading coursework & deliverables...
                    </p>
                </div>
            ) : items.length > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                    gap: '18px'
                }}>
                    {items.map((item, index) => {
                        const isAssignment = item.type === 'assignment';
                        const statusInfo = isAssignment ? getStatusInfo(item) : getQuizStatus(item);
                        const userSub = isAssignment ? getSubmission(item) : null;
                        const canStartQuiz = !isAssignment && (!item.submission || item.submission.status !== 'COMPLETED');

                        return (
                            <motion.div
                                key={`${item.type}-${item.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                style={{
                                    background: 'var(--admin-surface)',
                                    borderRadius: '14px',
                                    border: '1.5px solid var(--admin-border-color)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: 'var(--shadow-card)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ padding: '22px' }}>
                                    {/* Top Item Type & Status Badges */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: isAssignment ? 'rgba(79, 70, 229, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                            color: isAssignment ? 'var(--admin-primary)' : '#10B981',
                                            fontWeight: 700,
                                            fontSize: '11px',
                                            letterSpacing: '0.04em',
                                            textTransform: 'uppercase'
                                        }}>
                                            {isAssignment ? 'Assignment' : 'Quiz'}
                                        </span>

                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: statusInfo.bg,
                                            color: statusInfo.color,
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}>
                                            {statusInfo.icon} {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Title and Description */}
                                    <h3 style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: 'var(--admin-text-primary)'
                                    }}>
                                        {item.title}
                                    </h3>
                                    <p style={{
                                        margin: '0 0 16px 0',
                                        fontSize: '13px',
                                        color: 'var(--admin-text-secondary)',
                                        lineHeight: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {item.description || 'No description provided.'}
                                    </p>

                                    {/* Mentor Feedback Box (if reviewed) */}
                                    {userSub?.status === 'REVIEWED' && (
                                        <div style={{
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            background: 'rgba(16, 185, 129, 0.06)',
                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                            marginBottom: '16px',
                                            fontSize: '12px'
                                        }}>
                                            <div style={{ fontWeight: 700, color: '#10B981', marginBottom: '2px' }}>
                                                Mentor Feedback ({userSub.grade || 'Approved'})
                                            </div>
                                            <div style={{ color: 'var(--admin-text-secondary)' }}>
                                                {userSub.feedback || 'Good work! All criteria met.'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Due Date & Marks Meta */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                                        {item.dueDate && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <FiClock size={13} /> Due: {new Date(item.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                        {item.totalMarks && (
                                            <span>Max Score: {item.totalMarks} pts</span>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Action Area */}
                                <div style={{
                                    padding: '14px 22px',
                                    borderTop: '1px solid var(--admin-border-color)',
                                    background: 'var(--admin-bg)'
                                }}>
                                    {isAssignment ? (
                                        !userSub ? (
                                            <button
                                                onClick={() => { setSelectedAssignment(item); setShowSubmitModal(true); }}
                                                style={{
                                                    width: '100%',
                                                    padding: '9px 14px',
                                                    borderRadius: '8px',
                                                    background: 'var(--admin-primary)',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <FiUpload size={14} /> Submit Deliverable
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => { setSelectedAssignment(item); setShowSubmitModal(true); }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        border: '1.5px solid var(--admin-border-color)',
                                                        background: 'var(--admin-surface)',
                                                        color: 'var(--admin-text-primary)',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Update Submission
                                                </button>
                                                {userSub.submissionUrl && (
                                                    <a
                                                        href={userSub.submissionUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            border: '1.5px solid var(--admin-border-color)',
                                                            background: 'var(--admin-surface)',
                                                            color: 'var(--admin-primary)',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        <FiExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        canStartQuiz ? (
                                            <button
                                                onClick={() => handleStartQuiz(item)}
                                                style={{
                                                    width: '100%',
                                                    padding: '9px 14px',
                                                    borderRadius: '8px',
                                                    background: '#10B981',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Start Assessment Test
                                            </button>
                                        ) : (
                                            <div style={{
                                                textAlign: 'center',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#10B981',
                                                padding: '4px 0'
                                            }}>
                                                ✓ Assessment Completed
                                            </div>
                                        )
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'var(--admin-surface)',
                    borderRadius: '12px',
                    border: '1.5px dashed var(--admin-border-color)'
                }}>
                    <FiFileText size={48} style={{ marginBottom: '14px', color: 'var(--admin-text-secondary)', opacity: 0.6 }} />
                    <h3 style={{ margin: '0 0 6px 0', color: 'var(--admin-text-primary)', fontSize: '16px', fontWeight: 600 }}>
                        No Coursework Found
                    </h3>
                    <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '13px' }}>
                        No active assignments or quizzes match your current filter selection.
                    </p>
                </div>
            )}

            {/* Submit Assignment Modal */}
            <AnimatePresence>
                {showSubmitModal && selectedAssignment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '20px',
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => setShowSubmitModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--admin-surface)',
                                borderRadius: '16px',
                                padding: '32px',
                                maxWidth: '580px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                boxShadow: 'var(--shadow-card)',
                                border: '1.5px solid var(--admin-border-color)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                        Submit Deliverable
                                    </h2>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                                        {selectedAssignment.title}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitAssignment}>
                                {/* File Upload Area */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                        Upload Document / Archive (Optional)
                                    </label>
                                    <div
                                        style={{
                                            border: '2px dashed var(--admin-border-color)',
                                            borderRadius: '10px',
                                            padding: '24px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: 'var(--admin-bg)',
                                            transition: 'border-color 0.15s ease'
                                        }}
                                        onClick={() => document.getElementById('assignment-file-input').click()}
                                    >
                                        <input
                                            type="file"
                                            id="assignment-file-input"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            accept=".pdf,.doc,.docx,.zip,.tar.gz,.png,.jpg"
                                        />
                                        <FiUpload size={28} style={{ color: 'var(--admin-primary)', marginBottom: '8px' }} />
                                        <div style={{ color: 'var(--admin-text-primary)', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                                            {selectedFile ? selectedFile.name : 'Click to browse files'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>
                                            PDF, ZIP, DOCX, or Images up to 25MB
                                        </div>
                                    </div>
                                </div>

                                {/* GitHub / Live Demo URL or Notes */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                        Deliverable Link or Submission Notes
                                    </label>
                                    <textarea
                                        value={submissionContent}
                                        onChange={(e) => setSubmissionContent(e.target.value)}
                                        placeholder="e.g. GitHub Repository URL, Figma file, or deployment link with any notes for your mentor..."
                                        style={{
                                            width: '100%',
                                            minHeight: '100px',
                                            padding: '12px 14px',
                                            borderRadius: '10px',
                                            border: '1.5px solid var(--admin-border-color)',
                                            background: 'var(--admin-bg)',
                                            color: 'var(--admin-text-primary)',
                                            fontSize: '13px',
                                            outline: 'none',
                                            resize: 'vertical',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowSubmitModal(false)}
                                        style={{
                                            flex: 1,
                                            padding: '11px',
                                            background: 'var(--admin-bg)',
                                            color: 'var(--admin-text-secondary)',
                                            border: '1.5px solid var(--admin-border-color)',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || (!selectedFile && !submissionContent.trim())}
                                        style={{
                                            flex: 1,
                                            padding: '11px',
                                            background: 'var(--admin-primary)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            cursor: submitting || (!selectedFile && !submissionContent.trim()) ? 'not-allowed' : 'pointer',
                                            opacity: submitting || (!selectedFile && !submissionContent.trim()) ? 0.6 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {submitting ? (
                                            <>
                                                <FiRefreshCw className="spin-animation" size={14} /> Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <FiSend size={14} /> Submit Deliverable
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentAssignmentSection;
