import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import RootRedirect from '@/pages/RootRedirect';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import StudentDashboardPage from '@/pages/student/DashboardPage';
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import AdminExamsPage from '@/pages/admin/ExamsPage';
import CreateExamPage from '@/pages/admin/CreateExamPage';
import ExamQuestionsPage from '@/pages/admin/ExamQuestionsPage';

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
            path="/admin/exams/:id/questions"
            element={
              <ProtectedRoute requireRole="admin">
                <ExamQuestionsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
