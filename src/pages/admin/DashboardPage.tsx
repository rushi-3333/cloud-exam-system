import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboardPlaceholder() {
  const { profile, signOut } = useAuth();
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">
        Signed in as {profile?.full_name} ({profile?.role}). Full dashboard
        arrives in Phase 8.
      </p>
      <button
        onClick={() => void signOut()}
        className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
      >
        Sign out
      </button>
    </main>
  );
}
