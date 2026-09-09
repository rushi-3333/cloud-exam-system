import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StatCard } from '@/components/StatCard';
import { fetchAdminStats } from '@/services/adminService';

interface Stats {
  totalStudents: number;
  totalExams: number;
  publishedExams: number;
  draftExams: number;
  totalAttempts: number;
  averageScore: number;
  passPercentage: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load stats'));
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your exam system.</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {!stats && !error && (
          <p className="mt-6 text-sm text-slate-400">Loading stats…</p>
        )}

        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Students" value={stats.totalStudents} />
            <StatCard label="Total Exams" value={stats.totalExams} />
            <StatCard label="Published Exams" value={stats.publishedExams} />
            <StatCard label="Draft Exams" value={stats.draftExams} />
            <StatCard label="Total Attempts" value={stats.totalAttempts} />
            <StatCard label="Average Score" value={`${stats.averageScore}%`} />
            <StatCard label="Pass Rate" value={`${stats.passPercentage}%`} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
