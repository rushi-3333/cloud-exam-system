import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StudentLayout } from '@/layouts/StudentLayout';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyResults } from '@/services/studentService';
import type { ExamResult } from '@/types/attempt';
import type { Exam } from '@/types/exam';

export default function StudentAnalyticsPage() {
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

  const trend = useMemo(
    () =>
      [...results]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((r, i) => ({ attempt: `#${i + 1}`, percentage: r.percentage })),
    [results]
  );

  const subjectPerformance = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const r of results) {
      const subject = r.exam?.subject ?? 'Unknown';
      const entry = map.get(subject) ?? { total: 0, count: 0 };
      entry.total += r.percentage;
      entry.count += 1;
      map.set(subject, entry);
    }
    return Array.from(map.entries()).map(([subject, { total, count }]) => ({
      subject,
      average: Math.round((total / count) * 10) / 10,
    }));
  }, [results]);

  const passCount = results.filter((r) => r.pass_status === 'pass').length;
  const highest = results.length > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
  const lowest = results.length > 0 ? Math.min(...results.map((r) => r.percentage)) : 0;
  const average =
    results.length > 0
      ? Math.round((results.reduce((s, r) => s + r.percentage, 0) / results.length) * 10) / 10
      : 0;

  return (
    <StudentLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Your performance across all exams.</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        {!loading && results.length === 0 && (
          <p className="mt-8 text-sm text-slate-400">
            No results yet — complete an exam to see your analytics here.
          </p>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
              <StatCard label="Exams Attempted" value={results.length} />
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
                <h2 className="text-sm font-semibold text-slate-900">Score Trend</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="attempt" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="#3b6ef6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-900">Subject-wise Performance</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
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
    </StudentLayout>
  );
}
