import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchExamById } from '@/services/studentService';
import {
  getOrStartAttempt,
  fetchQuestionsForAttempt,
  fetchAnswers,
  saveAnswer,
  submitExamViaFunction,
  type QuestionForAttempt,
  type AnswerState,
} from '@/services/examAttemptService';
import { useServerCountdown } from '@/hooks/useServerCountdown';
import { useProctoring } from '@/hooks/useProctoring';
import { QuestionNavigator } from '@/components/QuestionNavigator';
import type { Exam } from '@/types/exam';
import type { ExamAttempt } from '@/types/attempt';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline';

export default function ExamAttemptPage() {
  const { id: examId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<QuestionForAttempt[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!examId || !user) return;
    (async () => {
      try {
        const examData = await fetchExamById(examId);
        setExam(examData);

        let attemptData: ExamAttempt;
        try {
          attemptData = await getOrStartAttempt(examId, user.id);
        } catch (attemptErr) {
          if (attemptErr instanceof Error && attemptErr.message === 'ALREADY_ATTEMPTED') {
            navigate('/student/results', { replace: true });
            return;
          }
          throw attemptErr;
        }
        setAttempt(attemptData);

        if (attemptData.status !== 'in_progress') {
          navigate('/student/results', { replace: true });
          return;
        }

        const [questionsData, answersData] = await Promise.all([
          fetchQuestionsForAttempt(examId),
          fetchAnswers(attemptData.id),
        ]);
        setQuestions(questionsData);

        const answerMap: Record<string, AnswerState> = {};
        for (const a of answersData) {
          answerMap[a.question_id] = a;
        }
        setAnswers(answerMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exam');
      } finally {
        setLoading(false);
      }
    })();
  }, [examId, user, navigate]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!attempt || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await submitExamViaFunction(attempt.id);
      navigate('/student/results', { replace: true });
    } catch (err) {
      console.error(err);
      submittedRef.current = false;
      setSubmitting(false);
      setSubmitError(
        'Your submission could not be graded right now. Please try submitting again — your answers are safely saved.'
      );
    }
  }, [attempt, navigate]);

  const deadline = attempt?.server_deadline_at ?? new Date().toISOString();
  const { label: timeLabel, isExpired } = useServerCountdown(deadline, () => {
    void handleSubmit();
  });
  const { showWarning } = useProctoring(attempt?.id ?? null);

  async function handleSelectOption(questionId: string, optionId: string) {
    if (!attempt) return;
    const prev = answers[questionId];
    const next: AnswerState = {
      question_id: questionId,
      selected_option_id: optionId,
      marked_for_review: prev?.marked_for_review ?? false,
    };
    setAnswers((a) => ({ ...a, [questionId]: next }));
    setSaveStatus('saving');
    try {
      await saveAnswer(attempt.id, questionId, optionId, next.marked_for_review);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('offline');
    }
  }

  async function handleToggleReview(questionId: string) {
    if (!attempt) return;
    const prev = answers[questionId];
    const next: AnswerState = {
      question_id: questionId,
      selected_option_id: prev?.selected_option_id ?? null,
      marked_for_review: !(prev?.marked_for_review ?? false),
    };
    setAnswers((a) => ({ ...a, [questionId]: next }));
    setSaveStatus('saving');
    try {
      await saveAnswer(attempt.id, questionId, next.selected_option_id, next.marked_for_review);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('offline');
    }
  }

  function goTo(index: number) {
    setCurrentIndex(index);
    setVisited((v) => new Set(v).add(index));
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading exam…</div>;
  }

  if (error || !exam || !attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-red-600">
        {error ?? 'Unable to load this exam.'}
      </div>
    );
  }

  const current = questions[currentIndex];
  const answeredSet = new Set(
    questions.map((q, i) => (answers[q.id]?.selected_option_id ? i : -1)).filter((i) => i >= 0)
  );
  const markedSet = new Set(
    questions.map((q, i) => (answers[q.id]?.marked_for_review ? i : -1)).filter((i) => i >= 0)
  );
  const answeredCount = answeredSet.size;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-50">
      {showWarning && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
          Leaving this tab during the exam is recorded.
        </div>
      )}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{exam.title}</p>
          <p className="text-xs text-slate-500">
            {answeredCount} answered · {unansweredCount} unanswered
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!isOnline && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              Connection lost
            </span>
          )}
          {isOnline && saveStatus === 'saving' && (
            <span className="text-xs text-slate-400">Saving…</span>
          )}
          {isOnline && saveStatus === 'saved' && (
            <span className="text-xs text-emerald-600">Saved</span>
          )}
          <span
            className={
              'rounded-full px-3 py-1 text-sm font-semibold ' +
              (isExpired ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-700')
            }
          >
            {timeLabel}
          </span>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-6 p-6">
        <main className="flex-1 rounded-xl border border-slate-200 bg-white p-6">
          {current ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Question {currentIndex + 1} of {questions.length} · {current.marks} marks
              </p>
              <p className="mt-2 text-base text-slate-900">{current.question_text}</p>

              <div className="mt-4 space-y-2">
                {current.options
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((opt, idx) => {
                    const selected = answers[current.id]?.selected_option_id === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={
                          'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ' +
                          (selected
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-slate-200 hover:border-slate-300')
                        }
                      >
                        <input
                          type="radio"
                          name={`q-${current.id}`}
                          checked={selected}
                          onChange={() => void handleSelectOption(current.id, opt.id)}
                        />
                        <span className="font-medium text-slate-500">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {opt.option_text}
                      </label>
                    );
                  })}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex gap-2">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => goTo(currentIndex - 1)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => goTo(currentIndex + 1)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
                <button
                  onClick={() => void handleToggleReview(current.id)}
                  className="rounded-lg border border-purple-300 px-4 py-2 text-sm text-purple-700"
                >
                  {answers[current.id]?.marked_for_review ? 'Unmark review' : 'Mark for review'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">This exam has no questions.</p>
          )}
        </main>

        <aside className="w-64 shrink-0">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <QuestionNavigator
              count={questions.length}
              currentIndex={currentIndex}
              answeredSet={answeredSet}
              markedSet={markedSet}
              visitedSet={visited}
              onJump={goTo}
            />
          </div>

          {submitError && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{submitError}</p>
          )}

          <button
            onClick={() => {
              if (window.confirm('Submit the exam now? You cannot change answers after this.')) {
                void handleSubmit();
              }
            }}
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit exam'}
          </button>
        </aside>
      </div>
    </div>
  );
}
