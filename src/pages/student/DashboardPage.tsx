import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '@/layouts/StudentLayout';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPublishedExams, fetchMyAttempts, fetchMyResults } from '@/services/studentService';
import type { Exam } from '@/types/exam';

export default function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchPublishedExams(), fetchMyAttempts(user.id), fetchMyResults(user.id)])
      .then(([exams, attempts, results]) => {
        setAvailableExams(exams);
        setCompletedCount(attempts.filter((a) => a.status !== 'in_progress').length);
        setAverageScore(
          results.length > 0
            ? Math.round(
                (results.reduce((sum, r) => sum + Number(r.percentage), 0) / results.length) * 10
              ) / 10
            : 0
        );
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <StudentLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome, {profile?.full_name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here's your exam overview.</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard label="Available Exams" value={availableExams.length} />
            <StatCard label="Completed Exams" value={completedCount} />
            <StatCard label="Average Score" value={`${averageScore}%`} />
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Available exams</h2>
            <Link to="/student/exams" className="text-xs text-brand-600 hover:underline">
              View all
            </Link>
          </div>

          {!loading && availableExams.length === 0 && (
            <p className="mt-3 text-sm text-slate-400">No exams available right now.</p>
          )}

          <div className="mt-3 space-y-2">
            {availableExams.slice(0, 5).map((exam) => (
              <Link
                key={exam.id}
                to={`/student/exams/${exam.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300"
              >
                <p className="text-sm font-medium text-slate-900">{exam.title}</p>
                <p className="text-xs text-slate-500">
                  {exam.subject} · {exam.duration_minutes} min · {exam.total_marks} marks
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
