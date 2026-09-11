import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { fetchAllResults, type ResultWithDetails } from '@/services/adminService';

export default function AdminResultsPage() {
  const [results, setResults] = useState<ResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllResults()
      .then(setResults)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Results</h1>
        <p className="mt-1 text-sm text-slate-500">All student results across every exam.</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && results.length === 0 && (
          <p className="mt-8 text-sm text-slate-400">No results yet.</p>
        )}

        {!loading && results.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Exam</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Percentage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.student_name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.exam_title}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.marks_obtained}/{r.total_marks}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.percentage}%</td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(r.created_at).toLocaleDateString()}
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
