import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import RootRedirect from '@/pages/RootRedirect';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import StudentDashboardPage from '@/pages/student/DashboardPage';
import StudentExamsPage from '@/pages/student/ExamsPage';
import ExamInstructionsPage from '@/pages/student/ExamInstructionsPage';
import ExamAttemptPage from '@/pages/student/ExamAttemptPage';
import StudentResultsPage from '@/pages/student/ResultsPage';
import StudentAnalyticsPage from '@/pages/student/AnalyticsPage';
import StudentNotificationsPage from '@/pages/student/NotificationsPage';
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import AdminExamsPage from '@/pages/admin/ExamsPage';
import CreateExamPage from '@/pages/admin/CreateExamPage';
import EditExamPage from '@/pages/admin/EditExamPage';
import ExamQuestionsPage from '@/pages/admin/ExamQuestionsPage';
import AdminResultsPage from '@/pages/admin/ResultsPage';
import AdminAnalyticsPage from '@/pages/admin/AnalyticsPage';
import AdminNotificationsPage from '@/pages/admin/NotificationsPage';
import LiveMonitoringPage from '@/pages/admin/LiveMonitoringPage';
import AdminStudentsPage from '@/pages/admin/StudentsPage';
import AuditLogsPage from '@/pages/admin/AuditLogsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requireRole="student">
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams"
            element={
              <ProtectedRoute requireRole="student">
                <StudentExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams/:id"
            element={
              <ProtectedRoute requireRole="student">
                <ExamInstructionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams/:id/attempt"
            element={
              <ProtectedRoute requireRole="student">
                <ExamAttemptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute requireRole="student">
                <StudentResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/analytics"
            element={
              <ProtectedRoute requireRole="student">
                <StudentAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute requireRole="student">
                <StudentNotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/create"
            element={
              <ProtectedRoute requireRole="admin">
                <CreateExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/:id/edit"
            element={
              <ProtectedRoute requireRole="admin">
                <EditExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/:id/questions"
            element={
              <ProtectedRoute requireRole="admin">
                <ExamQuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/live-monitoring"
            element={
              <ProtectedRoute requireRole="admin">
                <LiveMonitoringPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute requireRole="admin">
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
