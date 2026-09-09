import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { AdminLayout } from '@/layouts/AdminLayout';
import { fetchExams, setExamStatus } from '@/services/adminService';
import type { Exam, ExamStatus } from '@/types/exam';

const STATUS_STYLES: Record<ExamStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-red-100 text-red-700',
};

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setExams(await fetchExams());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleStatusChange(id: string, status: ExamStatus) {
    try {
      await setExamStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Exams</h1>
            <p className="mt-1 text-sm text-slate-500">Create and manage examinations.</p>
          </div>
          <Link
            to="/admin/exams/create"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Create Exam
          </Link>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && exams.length === 0 && (
          <p className="mt-8 text-sm text-slate-400">No exams yet. Create your first one.</p>
        )}

        {!loading && exams.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/exams/${exam.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        {exam.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{exam.subject}</td>
                    <td className="px-4 py-3 text-slate-600">{exam.duration_minutes} min</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                          STATUS_STYLES[exam.status]
                        )}
                      >
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/exams/${exam.id}/questions`}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          Questions
                        </Link>
                        {exam.status === 'draft' && (
                          <button
                            onClick={() => void handleStatusChange(exam.id, 'published')}
                            className="text-xs font-medium text-emerald-600 hover:underline"
                          >
                            Publish
                          </button>
                        )}
                        {exam.status === 'published' && (
                          <button
                            onClick={() => void handleStatusChange(exam.id, 'closed')}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
