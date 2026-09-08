import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ConnectionState = 'checking' | 'connected' | 'error';

/**
 * Temporary root component for Phase 2/3 verification only.
 * Confirms the Supabase client can reach the project (auth service ping).
 * This will be replaced by <AppRoutes /> + React Router in Phase 7.
 */
export default function App() {
  const [state, setState] = useState<ConnectionState>('checking');
  const [detail, setDetail] = useState<string>('');

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error) {
          setState('error');
          setDetail(error.message);
        } else {
          setState('connected');
        }
      })
      .catch((err: unknown) => {
        setState('error');
        setDetail(err instanceof Error ? err.message : 'Unknown error');
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Cloud Exam System</h1>
        <p className="mt-1 text-sm text-slate-500">Phase 2/3 scaffold check</p>

        <div className="mt-6 flex items-center gap-2">
          <span
            className={
              'h-2.5 w-2.5 rounded-full ' +
              (state === 'connected'
                ? 'bg-emerald-500'
                : state === 'error'
                ? 'bg-red-500'
                : 'bg-amber-400 animate-pulse')
            }
          />
          <span className="text-sm font-medium text-slate-700">
            {state === 'checking' && 'Checking Supabase connection…'}
            {state === 'connected' && 'Supabase client connected successfully'}
            {state === 'error' && 'Supabase connection error'}
          </span>
        </div>

        {state === 'error' && (
          <p className="mt-2 text-xs text-red-600">{detail}</p>
        )}

        <p className="mt-6 text-xs text-slate-400">
          Routing, auth screens, and dashboards land in later phases.
        </p>
      </div>
    </main>
  );
}
