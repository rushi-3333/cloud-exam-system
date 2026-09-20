import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StudentLayout } from '@/layouts/StudentLayout';
import {
  fetchResultByAttempt,
  fetchResultBreakdown,
  type ResultBreakdownRow,
} from '@/services/studentService';
import type { ExamResult } from '@/types/attempt';
import type { Exam } from '@/types/exam';

export default function ResultDetailPage() {
  const { id: attemptId } = useParams<{ id: string }>();
  const [result, setResult] = useState<(ExamResult & { exam: Exam }) | null>(null);
  const [breakdown, setBreakdown] = useState<ResultBreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    Promise.all([fetchResultByAttempt(attemptId), fetchResultBreakdown(attemptId)])
      .then(([r, b]) => {
        setResult(r);
        setBreakdown(b);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <StudentLayout>
        <p className="p-8 text-sm text-slate-400">Loading…</p>
      </StudentLayout>
    );
  }

  if (error || !result) {
    return (
      <StudentLayout>
        <p className="p-8 text-sm text-red-600">{error ?? 'Result not found'}</p>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="mx-auto max-w-3xl p-8">
        <Link to="/student/results" className="text-sm text-brand-600 hover:underline">
          ← Back to results
        </Link>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{result.exam?.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {result.marks_obtained}/{result.total_marks} marks · {result.correct_count} correct
              · {result.wrong_count} wrong · {result.unanswered_count} unanswered
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-slate-900">{result.percentage}%</p>
            <span
              className={
                'rounded-full px-2 py-0.5 text-xs font-medium ' +
                (result.pass_status === 'pass'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700')
              }
            >
              {result.pass_status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {breakdown.map((q, idx) => (
            <div
              key={q.question_id}
              className={
                'rounded-xl border p-4 ' +
                (q.is_correct
                  ? 'border-emerald-200 bg-emerald-50'
                  : q.selected_option_id
                  ? 'border-red-200 bg-red-50'
                  : 'border-slate-200 bg-white')
              }
            >
              <p className="text-sm font-medium text-slate-900">
                {idx + 1}. {q.question_text}{' '}
                <span className="font-normal text-slate-400">({q.marks} marks)</span>
              </p>

              <div className="mt-2 space-y-1 text-sm">
                <p className="text-slate-600">
                  Your answer:{' '}
                  <span className={q.is_correct ? 'font-medium text-emerald-700' : 'font-medium text-red-700'}>
                    {q.selected_option_text ?? 'Not answered'}
                  </span>
                </p>
                {!q.is_correct && (
                  <p className="text-slate-600">
                    Correct answer:{' '}
                    <span className="font-medium text-emerald-700">{q.correct_option_text}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
