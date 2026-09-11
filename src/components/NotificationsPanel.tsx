import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyNotifications, markNotificationRead } from '@/services/notificationService';
import type { AppNotification } from '@/types/notification';

export function NotificationsPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    try {
      setNotifications(await fetchMyNotifications(user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleMarkRead(id: string) {
    setNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    try {
      await markNotificationRead(id);
    } catch {
      // Non-critical
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
      <p className="mt-1 text-sm text-slate-500">Updates relevant to your account.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

      {!loading && notifications.length === 0 && (
        <p className="mt-8 text-sm text-slate-400">No notifications yet.</p>
      )}

      <div className="mt-6 space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.read_at && void handleMarkRead(n.id)}
            className={
              'block w-full rounded-xl border p-4 text-left transition ' +
              (n.read_at
                ? 'border-slate-200 bg-white'
                : 'border-brand-200 bg-brand-50 hover:bg-brand-100')
            }
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{n.title}</p>
              {!n.read_at && <span className="h-2 w-2 rounded-full bg-brand-500" />}
            </div>
            {n.body && <p className="mt-1 text-sm text-slate-600">{n.body}</p>}
            <p className="mt-1 text-xs text-slate-400">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
