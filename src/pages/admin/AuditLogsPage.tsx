import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { fetchAuditLogs, type AuditLogEntry } from '@/services/adminService';

const ACTION_LABELS: Record<string, string> = {
  exam_submitted: 'Exam submitted',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs()
      .then(setLogs)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Immutable record of key system events. Most recent 100 shown.
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && logs.length === 0 && (
          <p className="mt-8 text-sm text-slate-400">No audit log entries yet.</p>
        )}

        {!loading && logs.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{log.actor_name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.entity}
                      {log.entity_id && (
                        <span className="ml-1 font-mono text-xs text-slate-400">
                          {log.entity_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {log.metadata ? (
                        <code className="whitespace-pre-wrap break-all">
                          {JSON.stringify(log.metadata)}
                        </code>
                      ) : (
                        '—'
                      )}
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
