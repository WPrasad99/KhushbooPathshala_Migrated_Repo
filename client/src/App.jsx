import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import RoleSelection from './pages/auth/RoleSelection';
import StudentLayout from './components/layout/StudentLayout';
import MentorLayout from './components/layout/MentorLayout';
import MessagingLayout from './components/layout/MessagingLayout';
import Loading from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Route-based code-splitting for high performance and reduced initial bundle size
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const LearningResources = lazy(() => import('./pages/student/LearningResources'));
const StudentAssignmentSection = lazy(() => import('./components/StudentAssignmentSection'));
const Courses = lazy(() => import('./pages/student/Courses'));
const CoursePlayer = lazy(() => import('./pages/student/CoursePlayer'));
const MentorProgram = lazy(() => import('./pages/student/MentorProgram'));
const Forum = lazy(() => import('./pages/student/Forum'));
const Roadmap = lazy(() => import('./pages/student/Roadmap'));
const MentorDashboard = lazy(() => import('./pages/mentor/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const MessagingPage = lazy(() => import('./pages/MessagingPage'));

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  /* 
    if (!user.profileCompleted && window.location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    } */

  const role = user?.role;
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'STUDENT') return <Navigate to="/student" replace />;
    if (role === 'MENTOR') return <Navigate to="/mentor" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  }

  return children;
};

// Dashboard Router - redirects to appropriate dashboard based on role
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user?.role === 'MENTOR') return <Navigate to="/mentor" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RoleSelection mode="register" />} />

        <Route path="/messages" element={
          <ProtectedRoute>
            <MessagingLayout />
          </ProtectedRoute>
        } />
        <Route path="/chat/:userId" element={
          <ProtectedRoute>
            <MessagingLayout />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsRedirect />
          </ProtectedRoute>
        } />

        {/* Dashboard Router */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />

        {/* Student Routes with Layout */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId" element={<CoursePlayer />} />
          <Route path="resources" element={<LearningResources />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="mentor" element={<MentorProgram />} />
          <Route path="messages" element={<MessagingPage />} />
          <Route path="chat/:userId" element={<MessagingPage />} />
          <Route path="forum" element={<Forum />} />
          <Route path="assignments" element={<StudentAssignmentSection />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Mentor Routes */}
        <Route path="/mentor" element={
          <ProtectedRoute allowedRoles={['MENTOR']}>
            <MentorLayout />
          </ProtectedRoute>
        }>
          <Route index element={<MentorDashboard />} />
          <Route path="batches" element={<MentorDashboard />} />
          <Route path="sessions" element={<MentorDashboard />} />
          <Route path="mentorship" element={<MentorDashboard />} />
          <Route path="forum" element={<MentorDashboard />} />
          <Route path="assignments" element={<MentorDashboard />} />
          <Route path="messages" element={<MessagingPage />} />
          <Route path="chat/:userId" element={<MessagingPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

const SettingsRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'STUDENT') return <Navigate to="/student/settings" replace />;
  return <Settings />;
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
