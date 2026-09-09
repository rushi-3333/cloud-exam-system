import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '@/layouts/StudentLayout';
import { fetchPublishedExams } from '@/services/studentService';
import type { Exam } from '@/types/exam';

export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedExams()
      .then(setExams)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Exams</h1>
        <p className="mt-1 text-sm text-slate-500">Available examinations you can take.</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && exams.length === 0 && (
          <p className="mt-8 text-sm text-slate-400">No exams available right now.</p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              to={`/student/exams/${exam.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-300"
            >
              <p className="font-medium text-slate-900">{exam.title}</p>
              <p className="mt-1 text-sm text-slate-500">{exam.subject}</p>
              <div className="mt-3 flex gap-4 text-xs text-slate-400">
                <span>{exam.duration_minutes} min</span>
                <span>{exam.total_marks} marks</span>
                <span>Pass: {exam.passing_percentage}%</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
