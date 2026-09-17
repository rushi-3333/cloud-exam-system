import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Timed, tamper-proof exams',
    body: 'Server-anchored countdown timer survives refreshes and resists clock manipulation.',
  },
  {
    title: 'Real-time monitoring',
    body: 'Admins see active attempts update live as students take exams.',
  },
  {
    title: 'Automatic grading',
    body: 'Scoring happens server-side the moment an exam is submitted — never in the browser.',
  },
  {
    title: 'Role-based security',
    body: 'Row Level Security on every table means students can never see answers early or alter scores.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold text-slate-900">Cloud Exam System</span>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Online examinations,{' '}
            <span className="text-brand-600">built for the cloud</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Create, publish, and grade exams securely. Students take timed tests with a
            professional interface; admins get real-time visibility and instant analytics.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
            >
              Register as a student
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Cloud Exam System — built on React, TypeScript, and Supabase.
      </footer>
    </div>
  );
}
