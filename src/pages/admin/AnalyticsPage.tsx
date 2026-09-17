import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StatCard } from '@/components/StatCard';
import { fetchAllResults, type ResultWithDetails } from '@/services/adminService';

const BUCKETS = ['0-20', '21-40', '41-60', '61-80', '81-100'];

export default function AdminAnalyticsPage() {
  const [results, setResults] = useState<ResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllResults()
      .then(setResults)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const scoreDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const r of results) {
      const idx = Math.min(4, Math.floor(r.percentage / 20.0001));
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
    return BUCKETS.map((label, i) => ({ label, count: counts[i] }));
  }, [results]);

  const examWiseAverage = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const r of results) {
      const entry = map.get(r.exam_title) ?? { total: 0, count: 0 };
      entry.total += r.percentage;
      entry.count += 1;
      map.set(r.exam_title, entry);
    }
    return Array.from(map.entries()).map(([title, { total, count }]) => ({
      title,
      average: Math.round((total / count) * 10) / 10,
    }));
  }, [results]);

  const passCount = results.filter((r) => r.pass_status === 'pass').length;
  const failCount = results.length - passCount;
  const highest = results.length > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
  const lowest = results.length > 0 ? Math.min(...results.map((r) => r.percentage)) : 0;
  const average =
    results.length > 0
      ? Math.round((results.reduce((s, r) => s + r.percentage, 0) / results.length) * 10) / 10
      : 0;

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Performance across all exams and students.</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && results.length === 0 && (
          <p className="mt-8 text-sm text-slate-400">
            No results yet — analytics will populate once students complete exams.
          </p>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
              <StatCard label="Total Attempts" value={results.length} />
              <StatCard label="Average Score" value={`${average}%`} />
              <StatCard label="Highest Score" value={`${highest}%`} />
              <StatCard label="Lowest Score" value={`${lowest}%`} />
              <StatCard
                label="Pass Rate"
                value={`${Math.round((passCount / results.length) * 1000) / 10}%`}
              />
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-900">Score Distribution</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b6ef6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-900">Pass vs Fail</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { label: 'Pass', count: passCount },
                        { label: 'Fail', count: failCount },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
                <h2 className="text-sm font-semibold text-slate-900">Average Score by Exam</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={examWiseAverage}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} unit="%" />
                      <Tooltip />
                      <Bar dataKey="average" fill="#3b6ef6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
