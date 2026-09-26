import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { FormField } from '@/components/FormField';
import {
  fetchExam,
  fetchQuestionsWithOptions,
  createQuestion,
  deleteQuestion,
  updateQuestionText,
  updateQuestionOptionText,
  setCorrectOption,
  swapQuestionOrder,
} from '@/services/adminService';
import type { Exam, QuestionWithOptions } from '@/types/exam';

const EMPTY_OPTIONS = ['', '', '', ''];

export default function ExamQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [questionText, setQuestionText] = useState('');
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState<string[]>(EMPTY_OPTIONS);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [examData, questionsData] = await Promise.all([
        fetchExam(id),
        fetchQuestionsWithOptions(id),
      ]);
      setExam(examData);
      setQuestions(questionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddQuestion(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);

    const filledOptions = options.filter((o) => o.trim().length > 0);
    if (filledOptions.length < 2) {
      setError('Add at least 2 options.');
      return;
    }

    setSubmitting(true);
    try {
      await createQuestion(
        id,
        {
          question_text: questionText,
          marks,
          options: options
            .map((text, idx) => ({ option_text: text, is_correct: idx === correctIndex }))
            .filter((o) => o.option_text.trim().length > 0),
        },
        questions.length
      );
      setQuestionText('');
      setMarks(1);
      setOptions(EMPTY_OPTIONS);
      setCorrectIndex(0);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(questionId: string) {
    try {
      await deleteQuestion(questionId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const current = questions[index];
    const target = questions[targetIndex];
    if (!current || !target) return;
    try {
      await swapQuestionOrder(current.id, current.order_index, target.id, target.order_index);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder');
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl p-8">
        <Link to="/admin/exams" className="text-sm text-brand-600 hover:underline">
          ← Back to exams
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">{exam?.title}</h1>
        <p className="text-sm text-slate-500">
          {questions.length} question{questions.length === 1 ? '' : 's'} ·{' '}
          {questions.reduce((sum, q) => sum + q.marks, 0)} marks so far
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

        <div className="mt-6 space-y-4">
          {questions.map((q, idx) =>
            editingId === q.id ? (
              <QuestionEditForm
                key={q.id}
                question={q}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  void load();
                }}
                onError={setError}
              />
            ) : (
              <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    {idx + 1}. {q.question_text}{' '}
                    <span className="font-normal text-slate-400">({q.marks} marks)</span>
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      disabled={idx === 0}
                      onClick={() => void handleMove(idx, 'up')}
                      className="text-xs text-slate-500 hover:underline disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      disabled={idx === questions.length - 1}
                      onClick={() => void handleMove(idx, 'down')}
                      className="text-xs text-slate-500 hover:underline disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => setEditingId(q.id)}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDelete(q.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <ul className="mt-2 space-y-1">
                  {q.question_options
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((opt) => (
                      <li
                        key={opt.id}
                        className={
                          'text-sm ' +
                          (opt.is_correct ? 'font-medium text-emerald-700' : 'text-slate-600')
                        }
                      >
                        {opt.is_correct ? '✓ ' : '— '}
                        {opt.option_text}
                      </li>
                    ))}
                </ul>
              </div>
            )
          )}
        </div>

        <form
          onSubmit={handleAddQuestion}
          className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-sm font-semibold text-slate-900">Add a question</h2>

          <div>
            <label htmlFor="qtext" className="block text-sm font-medium text-slate-700">
              Question text
            </label>
            <textarea
              id="qtext"
              required
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <FormField
            id="marks"
            label="Marks"
            type="number"
            min={1}
            required
            value={marks}
            onChange={(e) => setMarks(Number(e.target.value))}
          />

          <div>
            <p className="text-sm font-medium text-slate-700">Options (select the correct one)</p>
            <div className="mt-2 space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={correctIndex === idx}
                    onChange={() => setCorrectIndex(idx)}
                    aria-label={`Option ${idx + 1} is correct`}
                  />
                  <input
                    type="text"
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = e.target.value;
                      setOptions(next);
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Adding…' : 'Add question'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}

function QuestionEditForm({
  question,
  onCancel,
  onSaved,
  onError,
}: {
  question: QuestionWithOptions;
  onCancel: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const sortedOptions = [...question.question_options].sort(
    (a, b) => a.order_index - b.order_index
  );
  const [text, setText] = useState(question.question_text);
  const [marks, setMarks] = useState(question.marks);
  const [optionTexts, setOptionTexts] = useState(sortedOptions.map((o) => o.option_text));
  const [correctOptionId, setCorrectOptionId] = useState(
    sortedOptions.find((o) => o.is_correct)?.id ?? sortedOptions[0]?.id
  );
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateQuestionText(question.id, { question_text: text, marks });

      await Promise.all(
        sortedOptions.map((opt, idx) =>
          optionTexts[idx] !== opt.option_text
            ? updateQuestionOptionText(opt.id, optionTexts[idx] ?? opt.option_text)
            : Promise.resolve()
        )
      );

      const oldCorrect = sortedOptions.find((o) => o.is_correct)?.id ?? null;
      if (correctOptionId && correctOptionId !== oldCorrect) {
        await setCorrectOption(correctOptionId, oldCorrect);
      }

      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-3 rounded-xl border border-brand-300 bg-brand-50 p-4"
    >
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <div className="w-32">
        <FormField
          id={`marks-${question.id}`}
          label="Marks"
          type="number"
          min={1}
          value={marks}
          onChange={(e) => setMarks(Number(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        {sortedOptions.map((opt, idx) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${question.id}`}
              checked={correctOptionId === opt.id}
              onChange={() => setCorrectOptionId(opt.id)}
            />
            <input
              type="text"
              value={optionTexts[idx]}
              onChange={(e) => {
                const next = [...optionTexts];
                next[idx] = e.target.value;
                setOptionTexts(next);
              }}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
