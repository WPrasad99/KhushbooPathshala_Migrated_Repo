import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FiArrowLeft,
    FiBook,
    FiCheckCircle,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiExternalLink,
    FiFileText,
    FiInfo,
    FiLock,
    FiPlay,
    FiSave,
    FiTv
} from 'react-icons/fi';
import { resourceAPI } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import './CoursePlayer.css';

const CoursePlayer = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [completedVideos, setCompletedVideos] = useState(new Set());
    const [notes, setNotes] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes' | 'resources'
    const [isSavedNotes, setIsSavedNotes] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true);
                const response = await resourceAPI.getOne(courseId);
                const payload = response.data;
                setCourse(payload);

                if (payload.userProgress) {
                    const lessonCount = (payload.lessons && payload.lessons.length) || payload.lessonsCount || 1;
                    const completedCount = Math.floor((payload.userProgress.completionPercentage / 100) * lessonCount);
                    const completed = new Set();

                    for (let index = 0; index < completedCount; index += 1) {
                        completed.add(index);
                    }

                    setCompletedVideos(completed);
                    setCurrentVideoIndex(Math.min(completedCount, lessonCount - 1));
                }
            } catch (error) {
                console.error('Failed to fetch course:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    useEffect(() => {
        const storedNotes = localStorage.getItem(`course-notes-${courseId}`) || '';
        setNotes(storedNotes);
    }, [courseId]);

    const handleNotesChange = (e) => {
        const val = e.target.value;
        setNotes(val);
        setIsSavedNotes(false);
        localStorage.setItem(`course-notes-${courseId}`, val);
        setTimeout(() => setIsSavedNotes(true), 600);
    };

    const getVideoList = () => {
        if (!course) return [];

        if (course.lessons && Array.isArray(course.lessons) && course.lessons.length > 0) {
            return course.lessons.map((lesson, index) => ({
                index,
                title: lesson.title || `Lesson ${index + 1}`,
                videoId: lesson.videoId,
                duration: lesson.durationStr || `${lesson.duration || 10}m`,
                completed: completedVideos.has(index),
                locked: index > 0 && !completedVideos.has(index - 1)
            }));
        }

        const count = course.lessonsCount || 1;
        return Array.from({ length: count }).map((_, index) => ({
            index,
            title: `Lesson ${index + 1}`,
            duration: course.duration ? `${Math.round(course.duration / count)}m` : '15m',
            completed: completedVideos.has(index),
            locked: index > 0 && !completedVideos.has(index - 1)
        }));
    };

    const videos = getVideoList();

    const canPlayVideo = (index) => index === 0 || completedVideos.has(index - 1);

    const selectVideo = (index) => {
        if (!canPlayVideo(index)) return;
        setCurrentVideoIndex(index);
    };

    const courseProgress = useMemo(() => {
        if (!course || videos.length === 0) return 0;
        return Math.round((completedVideos.size / videos.length) * 100);
    }, [completedVideos.size, videos.length, course]);

    const handleVideoComplete = async () => {
        const updated = new Set(completedVideos);
        updated.add(currentVideoIndex);
        setCompletedVideos(updated);

        const lessonCount = videos.length || 1;

        try {
            await resourceAPI.trackProgress(courseId, {
                watchDuration: updated.size * 600,
                totalDuration: lessonCount * 600,
                dropOffPoint: updated.size * 600
            });
        } catch (error) {
            console.error('Failed to update progress:', error);
        }

        if (currentVideoIndex < lessonCount - 1) {
            setCurrentVideoIndex(currentVideoIndex + 1);
        }
    };

    const handlePrevLesson = () => {
        if (currentVideoIndex > 0) {
            setCurrentVideoIndex(currentVideoIndex - 1);
        }
    };

    const handleNextLesson = () => {
        if (currentVideoIndex < videos.length - 1 && canPlayVideo(currentVideoIndex + 1)) {
            setCurrentVideoIndex(currentVideoIndex + 1);
        }
    };

    const getYouTubeInfo = (url) => {
        if (!url) return { type: null, id: null };

        try {
            if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return { type: 'video', id: url };
            if (/^PL[a-zA-Z0-9_-]{20,}$/.test(url)) return { type: 'playlist', id: url };

            const parsed = new URL(url);

            if (parsed.hostname === 'youtu.be') {
                return { type: 'video', id: parsed.pathname.slice(1) };
            }

            if (parsed.pathname === '/playlist') {
                return { type: 'playlist', id: parsed.searchParams.get('list') };
            }

            if (parsed.pathname.startsWith('/embed/')) {
                const id = parsed.pathname.split('/')[2];
                if (id === 'videoseries') {
                    return { type: 'playlist', id: parsed.searchParams.get('list') };
                }
                return { type: 'video', id };
            }

            if (parsed.pathname === '/watch') {
                if (parsed.searchParams.has('list')) {
                    return {
                        type: 'playlist',
                        id: parsed.searchParams.get('list'),
                        videoId: parsed.searchParams.get('v')
                    };
                }

                return { type: 'video', id: parsed.searchParams.get('v') };
            }
        } catch (error) {
            console.error('Invalid video URL', url, error);
        }

        return { type: 'unknown', id: url };
    };

    const currentVideo = videos[currentVideoIndex];

    let videoSrc = '';
    if (currentVideo?.videoId) {
        videoSrc = `https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=0&rel=0`;
    } else {
        const info = getYouTubeInfo(course?.videoUrl);
        if (info.type === 'playlist') {
            videoSrc = `https://www.youtube.com/embed?listType=playlist&list=${info.id}&index=${currentVideoIndex}`;
        } else if (info.type === 'video') {
            videoSrc = `https://www.youtube.com/embed/${info.id}?rel=0`;
        } else {
            videoSrc = course?.videoUrl?.includes('embed') ? course.videoUrl : `https://www.youtube.com/embed/${course?.videoUrl || 'dQw4w9WgXcQ'}`;
        }
    }

    if (loading) {
        return (
            <div className="course-player-loading-state">
                <div className="course-spinner" />
                <p>Loading course workspace...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="course-player-empty-state">
                <h2>Course not found</h2>
                <p>The requested course is not available or has been removed.</p>
                <button type="button" className="btn-modern-primary" onClick={() => navigate('/student/courses')}>
                    <FiArrowLeft /> Back to Courses
                </button>
            </div>
        );
    }

    const isCurrentCompleted = completedVideos.has(currentVideoIndex);

    return (
        <div className="course-studio-wrapper">
            {/* Top Bar Header */}
            <header className="course-studio-header">
                <div className="course-studio-header-left">
                    <button
                        type="button"
                        className="course-back-pill"
                        onClick={() => navigate('/student/courses')}
                        title="Back to Courses"
                    >
                        <FiArrowLeft size={16} />
                        <span>Back</span>
                    </button>
                    <div className="course-title-breadcrumb">
                        <span className="course-category-tag">{course.category?.replace(/_/g, ' ') || 'ENGINEERING'}</span>
                        <h1 className="course-main-title">{course.title}</h1>
                    </div>
                </div>

                <div className="course-studio-header-right">
                    <div className="course-completion-card">
                        <div className="completion-meta">
                            <span className="completion-label">Progress</span>
                            <span className="completion-pct">{courseProgress}%</span>
                        </div>
                        <div className="completion-track">
                            <div className="completion-fill" style={{ width: `${courseProgress}%` }} />
                        </div>
                    </div>
                    {courseProgress === 100 && (
                        <div className="completion-badge-pill">
                            <FiCheckCircle size={14} /> Completed
                        </div>
                    )}
                </div>
            </header>

            {/* Main Stage Grid: Video (Left) + Curriculum Sidebar (Right) */}
            <div className="course-studio-grid">
                {/* Left: Video Player & Tabs */}
                <main className="course-player-main-col">
                    {/* Theater Video Container */}
                    <div className="course-theater-screen">
                        <iframe
                            key={videoSrc}
                            src={videoSrc}
                            title={`${course.title} - ${currentVideo?.title || 'Lesson'}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>

                    {/* Lesson Controls & Action Bar */}
                    <div className="course-action-bar">
                        <div className="action-bar-lesson-info">
                            <span className="lesson-badge-pill">
                                Lesson {currentVideoIndex + 1} of {videos.length}
                            </span>
                            <h2 className="current-lesson-heading">
                                {currentVideo?.title || `Lesson ${currentVideoIndex + 1}`}
                            </h2>
                        </div>

                        <div className="action-bar-buttons">
                            <button
                                type="button"
                                className="btn-nav-step"
                                onClick={handlePrevLesson}
                                disabled={currentVideoIndex === 0}
                                title="Previous Lesson"
                            >
                                <FiChevronLeft size={16} />
                                <span>Prev</span>
                            </button>

                            <button
                                type="button"
                                className={`btn-lesson-toggle ${isCurrentCompleted ? 'is-complete' : 'is-action'}`}
                                onClick={handleVideoComplete}
                                disabled={isCurrentCompleted}
                            >
                                {isCurrentCompleted ? (
                                    <>
                                        <FiCheckCircle size={16} />
                                        <span>Lesson Completed</span>
                                    </>
                                ) : (
                                    <>
                                        <FiPlay size={15} />
                                        <span>Mark as Complete</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                className="btn-nav-step"
                                onClick={handleNextLesson}
                                disabled={currentVideoIndex === videos.length - 1 || !canPlayVideo(currentVideoIndex + 1)}
                                title="Next Lesson"
                            >
                                <span>Next</span>
                                <FiChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Tabbed Content: Overview / Notes / Resources */}
                    <div className="course-tabs-panel">
                        <nav className="course-tabs-nav">
                            <button
                                type="button"
                                className={`course-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <FiInfo size={15} />
                                <span>Overview</span>
                            </button>
                            <button
                                type="button"
                                className={`course-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notes')}
                            >
                                <FiFileText size={15} />
                                <span>My Notes</span>
                                {notes.trim().length > 0 && <span className="tab-indicator-dot" />}
                            </button>
                            <button
                                type="button"
                                className={`course-tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
                                onClick={() => setActiveTab('resources')}
                            >
                                <FiBook size={15} />
                                <span>Resources</span>
                            </button>
                        </nav>

                        <div className="course-tab-body">
                            {activeTab === 'overview' && (
                                <div className="overview-content-panel">
                                    <div className="overview-meta-chips">
                                        <span className="meta-chip">
                                            <FiClock size={13} /> {course.duration ? `${course.duration} mins total` : `${videos.length * 15} mins`}
                                        </span>
                                        <span className="meta-chip">
                                            <FiTv size={13} /> {videos.length} Lectures
                                        </span>
                                        <span className="meta-chip">
                                            <FiCheckCircle size={13} /> {completedVideos.size} Completed
                                        </span>
                                    </div>
                                    <div className="overview-text">
                                        <h3>About this Course</h3>
                                        <p>{course.description || 'No description provided for this module. Follow the curriculum lessons to complete this course.'}</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="notes-content-panel">
                                    <div className="notes-header">
                                        <div className="notes-header-title">
                                            <h3>Personal Workspace Notes</h3>
                                            <p>Take timestamped notes and revision highlights while watching.</p>
                                        </div>
                                        <div className="notes-autosave-badge">
                                            <FiSave size={14} />
                                            <span>{isSavedNotes ? 'Autosaved locally' : 'Saving...'}</span>
                                        </div>
                                    </div>
                                    <textarea
                                        value={notes}
                                        onChange={handleNotesChange}
                                        placeholder="Type key learnings, architecture patterns, command cheat-sheets..."
                                        rows={8}
                                        className="course-notes-editor"
                                    />
                                </div>
                            )}

                            {activeTab === 'resources' && (
                                <div className="resources-content-panel">
                                    <h3>Attached Learning Assets</h3>
                                    <div className="resources-list">
                                        {course.videoUrl ? (
                                            <a
                                                href={course.videoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="resource-item-card"
                                            >
                                                <div className="resource-icon-wrap">
                                                    <FiExternalLink size={16} />
                                                </div>
                                                <div className="resource-item-details">
                                                    <strong>External Video Reference</strong>
                                                    <span>Open original lecture streaming resource</span>
                                                </div>
                                            </a>
                                        ) : (
                                            <p className="no-resources-hint">No external attachments for this course.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Right: Course Curriculum Navigator Sidebar */}
                <aside className="course-curriculum-sidebar">
                    <div className="curriculum-sidebar-card">
                        <div className="curriculum-header">
                            <div>
                                <h3 className="curriculum-title">Course Curriculum</h3>
                                <span className="curriculum-sub">
                                    {completedVideos.size} of {videos.length} completed ({courseProgress}%)
                                </span>
                            </div>
                            <div className="curriculum-progress-mini">
                                <div className="curriculum-mini-fill" style={{ width: `${courseProgress}%` }} />
                            </div>
                        </div>

                        <div className="curriculum-lesson-items">
                            {videos.map((video, idx) => {
                                const isCurrent = video.index === currentVideoIndex;
                                const isDone = video.completed;
                                const isLocked = video.locked;

                                return (
                                    <button
                                        key={video.index || idx}
                                        type="button"
                                        className={`curriculum-lesson-row ${isCurrent ? 'is-active' : ''} ${isDone ? 'is-done' : ''} ${isLocked ? 'is-locked' : ''}`}
                                        onClick={() => selectVideo(video.index)}
                                        disabled={isLocked}
                                    >
                                        <div className="curriculum-status-icon">
                                            {isDone ? (
                                                <FiCheckCircle className="icon-completed" />
                                            ) : isLocked ? (
                                                <FiLock className="icon-locked" />
                                            ) : (
                                                <FiPlay className={`icon-play ${isCurrent ? 'pulse' : ''}`} />
                                            )}
                                        </div>

                                        <div className="curriculum-text-group">
                                            <div className="lesson-row-top">
                                                <span className="lesson-number">#{idx + 1}</span>
                                                <span className="lesson-title-text">{video.title}</span>
                                            </div>
                                            <div className="lesson-row-bottom">
                                                <span className="lesson-duration-badge">
                                                    <FiClock size={11} /> {video.duration}
                                                </span>
                                                {isCurrent && <span className="now-playing-pill">Now Playing</span>}
                                                {isDone && <span className="done-pill">Done</span>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CoursePlayer;
