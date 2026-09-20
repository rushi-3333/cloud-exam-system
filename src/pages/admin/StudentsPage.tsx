import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { fetchStudents, fetchAllResults, type StudentSummary, type ResultWithDetails } from '@/services/adminService';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [results, setResults] = useState<ResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchStudents(), fetchAllResults()])
      .then(([s, r]) => {
        setStudents(s);
        setResults(r);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const statsByStudent = useMemo(() => {
    const map = new Map<string, { count: number; totalPct: number; passCount: number }>();
    for (const r of results) {
      const entry = map.get(r.student_id) ?? { count: 0, totalPct: 0, passCount: 0 };
      entry.count += 1;
      entry.totalPct += r.percentage;
      if (r.pass_status === 'pass') entry.passCount += 1;
      map.set(r.student_id, entry);
    }
    return map;
  }, [results]);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Students</h1>
        <p className="mt-1 text-sm text-slate-500">All registered students and their exam activity.</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && students.length === 0 && (
          <p className="mt-8 text-sm text-slate-400">No students registered yet.</p>
        )}

        {!loading && students.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Exams Taken</th>
                  <th className="px-4 py-3">Average Score</th>
                  <th className="px-4 py-3">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const stats = statsByStudent.get(s.id);
                  const avg = stats && stats.count > 0 ? Math.round((stats.totalPct / stats.count) * 10) / 10 : null;
                  const passRate =
                    stats && stats.count > 0 ? Math.round((stats.passCount / stats.count) * 100) : null;
                  return (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-900">{s.full_name}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{stats?.count ?? 0}</td>
                      <td className="px-4 py-3 text-slate-600">{avg !== null ? `${avg}%` : '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {passRate !== null ? `${passRate}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
