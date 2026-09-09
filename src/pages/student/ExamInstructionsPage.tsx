import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StudentLayout } from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchExamById, findActiveAttempt } from '@/services/studentService';
import type { Exam } from '@/types/exam';

export default function ExamInstructionsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [hasActiveAttempt, setHasActiveAttempt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    Promise.all([fetchExamById(id), findActiveAttempt(id, user.id)])
      .then(([examData, activeAttempt]) => {
        setExam(examData);
        setHasActiveAttempt(!!activeAttempt);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id, user]);

  const now = new Date();
  const isOpen = exam ? now >= new Date(exam.start_at) && now <= new Date(exam.end_at) : false;

  if (loading) {
    return (
      <StudentLayout>
        <p className="p-8 text-sm text-slate-400">Loading…</p>
      </StudentLayout>
    );
  }

  if (error || !exam) {
    return (
      <StudentLayout>
        <p className="p-8 text-sm text-red-600">{error ?? 'Exam not found'}</p>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="mx-auto max-w-2xl p-8">
        <Link to="/student/exams" className="text-sm text-brand-600 hover:underline">
          ← Back to exams
        </Link>

        <h1 className="mt-2 text-xl font-semibold text-slate-900">{exam.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{exam.description}</p>

        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">Duration</p>
            <p className="font-medium text-slate-900">{exam.duration_minutes} min</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">Total marks</p>
            <p className="font-medium text-slate-900">{exam.total_marks}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">Passing</p>
            <p className="font-medium text-slate-900">{exam.passing_percentage}%</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Instructions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Once started, the timer cannot be paused.</li>
            <li>You can navigate between questions and mark them for review.</li>
            <li>The exam auto-submits when time runs out.</li>
            <li>Do not refresh unnecessarily — your progress is saved, but stay connected.</li>
          </ul>
        </div>

        {!isOpen && (
          <p className="mt-6 text-sm text-red-600">
            This exam is not currently open (window: {new Date(exam.start_at).toLocaleString()} –{' '}
            {new Date(exam.end_at).toLocaleString()}).
          </p>
        )}

        <button
          disabled={!isOpen}
          onClick={() => navigate(`/student/exams/${exam.id}/attempt`)}
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hasActiveAttempt ? 'Resume exam' : 'Start exam'}
        </button>
      </div>
    </StudentLayout>
  );
}
