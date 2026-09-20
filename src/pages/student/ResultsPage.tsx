import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyResults } from '@/services/studentService';
import type { ExamResult } from '@/types/attempt';
import type { Exam } from '@/types/exam';

export default function StudentResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<(ExamResult & { exam: Exam })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyResults(user.id)
      .then(setResults)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <StudentLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Results</h1>
        <p className="mt-1 text-sm text-slate-500">Your past exam results.</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && results.length === 0 && (
          <p className="mt-8 text-sm text-slate-400">
            No results yet. Once you submit an exam, it'll show up here shortly after grading.
          </p>
        )}

        <div className="mt-6 space-y-3">
          {results.map((r) => (
            <Link
              to={`/student/results/${r.attempt_id}`}
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{r.exam?.title}</p>
                <p className="text-xs text-slate-500">
                  {r.marks_obtained}/{r.total_marks} marks · {r.correct_count} correct ·{' '}
                  {r.wrong_count} wrong · {r.unanswered_count} unanswered
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">{r.percentage}%</p>
                <span
                  className={
                    'rounded-full px-2 py-0.5 text-xs font-medium ' +
                    (r.pass_status === 'pass'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700')
                  }
                >
                  {r.pass_status.toUpperCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {!loading && results.length === 0 && (
          <p className="mt-4 text-xs text-slate-400">
            Note: grading happens via a secure server-side function (Phase 12/13) — if you just
            submitted, a result row may not exist yet in this early build.
          </p>
        )}
      </div>
    </StudentLayout>
  );
}
