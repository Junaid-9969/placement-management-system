import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminJobs from './pages/admin/AdminJobs';
import AdminApplications from './pages/admin/AdminApplications';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminTrainers from './pages/admin/AdminTrainers';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentJobs from './pages/student/StudentJobs';
import StudentApplications from './pages/student/StudentApplications';
import JobDetail from './pages/student/JobDetail';

// Company pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyProfile from './pages/company/CompanyProfile';
import CompanyJobs from './pages/company/CompanyJobs';
import CompanyApplications from './pages/company/CompanyApplications';
import PostJob from './pages/company/PostJob';
import StudentDetails from './pages/company/StudentDetails';

// Trainer pages
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerProfile from './pages/trainer/TrainerProfile';
import TrainerStudents from './pages/trainer/TrainerStudents';

// Common
import SettingsPage from './pages/common/SettingsPage';
import NotFoundPage from './pages/common/NotFoundPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

const RoleRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const dashboards = { admin: '/admin', student: '/student', company: '/company', trainer: '/trainer' };
  return <Navigate to={dashboards[user.role] || '/login'} replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RoleRoute />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="companies" element={<AdminCompanies />} />
            <Route path="trainers" element={<AdminTrainers />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="jobs" element={<StudentJobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="applications" element={<StudentApplications />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Company */}
          <Route path="/company" element={<ProtectedRoute roles={['company']}><DashboardLayout /></ProtectedRoute>}>
    
            <Route index element={<CompanyDashboard />} />
            <Route path="profile" element={<CompanyProfile />} />
            <Route path="jobs" element={<CompanyJobs />} />
            <Route path="jobs/post" element={<PostJob />} />
            <Route path="applications" element={<CompanyApplications />} />
                  <Route
  path="students/:id"
  element={<StudentDetails />}
/>
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Trainer */}
          <Route path="/trainer" element={<ProtectedRoute roles={['trainer']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<TrainerDashboard />} />
            <Route path="profile" element={<TrainerProfile />} />
            <Route path="students" element={<TrainerStudents />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
