import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { FormField } from '@/components/FormField';
import { useAuth } from '@/contexts/AuthContext';
import { createExam } from '@/services/adminService';

export default function CreateExamPage() {
  const { user } = useAuth();
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) return;
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      const exam = await createExam(
        {
          ...form,
          start_at: new Date(form.start_at).toISOString(),
          end_at: new Date(form.end_at).toISOString(),
        },
        user.id
      );
      navigate(`/admin/exams/${exam.id}/questions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold text-slate-900">Create Exam</h1>
        <p className="mt-1 text-sm text-slate-500">
          Exam starts as a draft — add questions, then publish it when ready.
        </p>

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

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create exam & add questions'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
