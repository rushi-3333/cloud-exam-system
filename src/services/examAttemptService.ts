import { supabase } from '@/lib/supabaseClient';
import type { ExamAttempt } from '@/types/attempt';
import type { Question } from '@/types/exam';
import { findActiveAttempt, findCompletedAttempt } from '@/services/studentService';

export interface QuestionForAttempt extends Question {
  options: { id: string; option_text: string; order_index: number }[];
}

export interface AnswerState {
  question_id: string;
  selected_option_id: string | null;
  marked_for_review: boolean;
}

export async function getOrStartAttempt(examId: string, studentId: string): Promise<ExamAttempt> {
  const existing = await findActiveAttempt(examId, studentId);
  if (existing) return existing;

  const completed = await findCompletedAttempt(examId, studentId);
  if (completed) {
    throw new Error('ALREADY_ATTEMPTED');
  }

  const { data, error } = await supabase
    .from('exam_attempts')
    .insert({
      exam_id: examId,
      student_id: studentId,
      started_at: new Date().toISOString(),
      server_deadline_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ExamAttempt;
}

export async function fetchAttempt(attemptId: string): Promise<ExamAttempt> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('id', attemptId)
    .single();
  if (error) throw error;
  return data as unknown as ExamAttempt;
}

export async function fetchQuestionsForAttempt(examId: string): Promise<QuestionForAttempt[]> {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });
  if (error) throw error;

  const questionRows = (questions ?? []) as unknown as Question[];

  const withOptions = await Promise.all(
    questionRows.map(async (q) => {
      const { data: options, error: optError } = await supabase.rpc('get_options_for_student', {
        p_question_id: q.id,
      });
      if (optError) throw optError;
      return { ...q, options: options ?? [] } as QuestionForAttempt;
    })
  );

  return withOptions;
}

export async function fetchAnswers(attemptId: string): Promise<AnswerState[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('question_id, selected_option_id, marked_for_review')
    .eq('attempt_id', attemptId);
  if (error) throw error;
  return (data ?? []) as unknown as AnswerState[];
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
  markedForReview: boolean
): Promise<void> {
  const { error } = await supabase
    .from('answers')
    .upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        marked_for_review: markedForReview,
      },
      { onConflict: 'attempt_id,question_id' }
    );
  if (error) throw error;
}

export async function submitAttempt(attemptId: string): Promise<void> {
  const { error } = await supabase
    .from('exam_attempts')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', attemptId)
    .eq('status', 'in_progress');
  if (error) throw error;
}
