import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { FormField } from '@/components/FormField';
import { fetchExam, updateExam, setExamStatus } from '@/services/adminService';
import type { ExamStatus } from '@/types/exam';

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EditExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    duration_minutes: 60,
    total_marks: 100,
    passing_percentage: 40,
    start_at: '',
    end_at: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<ExamStatus>('draft');

  useEffect(() => {
    if (!id) return;
    fetchExam(id)
      .then((exam) => {
        setStatus(exam.status);
        setForm({
          title: exam.title,
          description: exam.description ?? '',
          subject: exam.subject,
          duration_minutes: exam.duration_minutes,
          total_marks: exam.total_marks,
          passing_percentage: exam.passing_percentage,
          start_at: toLocalInputValue(exam.start_at),
          end_at: toLocalInputValue(exam.end_at),
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load exam'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSaved(false);

    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      await updateExam(id, {
        ...form,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exam');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(newStatus: ExamStatus) {
    if (!id) return;
    setError(null);
    try {
      await setExamStatus(id, newStatus);
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="p-8 text-sm text-slate-400">Loading…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl p-8">
        <Link to="/admin/exams" className="text-sm text-brand-600 hover:underline">
          ← Back to exams
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Edit Exam</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update exam settings. Changes apply immediately, including to exams already published.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <span
            className={
              'rounded-full px-2 py-0.5 text-xs font-medium capitalize ' +
              (status === 'published'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'closed'
                ? 'bg-red-100 text-red-700'
                : 'bg-slate-100 text-slate-600')
            }
          >
            {status}
          </span>
          {status === 'draft' && (
            <button
              onClick={() => void handleStatusChange('published')}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Publish
            </button>
          )}
          {status === 'published' && (
            <button
              onClick={() => void handleStatusChange('closed')}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Close
            </button>
          )}
          {status === 'closed' && (
            <button
              onClick={() => void handleStatusChange('published')}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Reopen
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormField
            id="title"
            label="Exam title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <FormField
            id="subject"
            label="Subject / category"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              id="duration"
              label="Duration (minutes)"
              type="number"
              min={1}
              required
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
            />
            <FormField
              id="totalMarks"
              label="Total marks"
              type="number"
              min={1}
              required
              value={form.total_marks}
              onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) })}
            />
            <FormField
              id="passingPct"
              label="Passing %"
              type="number"
              min={0}
              max={100}
              required
              value={form.passing_percentage}
              onChange={(e) => setForm({ ...form, passing_percentage: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="startAt"
              label="Start date/time"
              type="datetime-local"
              required
              value={form.start_at}
              onChange={(e) => setForm({ ...form, start_at: e.target.value })}
            />
            <FormField
              id="endAt"
              label="End date/time"
              type="datetime-local"
              required
              value={form.end_at}
              onChange={(e) => setForm({ ...form, end_at: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-600">Saved.</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/exams/${id}/questions`)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Manage questions
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
