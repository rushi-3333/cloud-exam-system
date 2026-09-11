import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { RemainingTimeCell } from '@/components/RemainingTimeCell';
import { supabase } from '@/lib/supabaseClient';
import { fetchActiveAttempts, type ActiveAttempt } from '@/services/adminService';

export default function LiveMonitoringPage() {
  const [attempts, setAttempts] = useState<ActiveAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setAttempts(await fetchActiveAttempts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const channel = supabase
      .channel('live-monitoring')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_attempts' },
        () => void load()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Live Monitoring</h1>
        <p className="mt-1 text-sm text-slate-500">
          Students currently taking an exam. Updates in real time.
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && attempts.length === 0 && (
          <p className="mt-8 text-sm text-slate-400">No students are currently taking an exam.</p>
        )}

        {!loading && attempts.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Exam</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{a.student_name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.exam_title}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(a.started_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3">
                      <RemainingTimeCell deadline={a.server_deadline_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Answers and correct options are never shown here, per exam integrity rules.
        </p>
      </div>
    </AdminLayout>
  );
}
