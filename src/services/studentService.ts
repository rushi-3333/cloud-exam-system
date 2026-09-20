import { supabase } from '@/lib/supabaseClient';
import type { Exam } from '@/types/exam';
import type { ExamAttempt, ExamResult } from '@/types/attempt';

export async function fetchPublishedExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('status', 'published')
    .order('start_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Exam[];
}

export async function fetchExamById(id: string): Promise<Exam> {
  const { data, error } = await supabase.from('exams').select('*').eq('id', id).single();
  if (error) throw error;
  return data as unknown as Exam;
}

export async function fetchMyAttempts(studentId: string): Promise<ExamAttempt[]> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ExamAttempt[];
}

export async function fetchMyResults(studentId: string): Promise<(ExamResult & { exam: Exam })[]> {
  const { data, error } = await supabase
    .from('results')
    .select('*, exam_attempts!inner(student_id, exam_id, exams(*))')
    .eq('exam_attempts.student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  type Row = ExamResult & {
    exam_attempts: { exams: Exam };
  };
  return ((data ?? []) as unknown as Row[]).map((row) => ({
    ...row,
    exam: row.exam_attempts.exams,
  }));
}

export interface ResultBreakdownRow {
  question_id: string;
  question_text: string;
  marks: number;
  order_index: number;
  selected_option_id: string | null;
  selected_option_text: string | null;
  correct_option_id: string | null;
  correct_option_text: string | null;
  is_correct: boolean;
}

export async function fetchResultBreakdown(attemptId: string): Promise<ResultBreakdownRow[]> {
  const { data, error } = await supabase.rpc('get_result_breakdown', {
    p_attempt_id: attemptId,
  });
  if (error) throw error;
  return (data ?? []) as unknown as ResultBreakdownRow[];
}

export async function fetchResultByAttempt(
  attemptId: string
): Promise<ExamResult & { exam: Exam }> {
  const { data, error } = await supabase
    .from('results')
    .select('*, exam_attempts!inner(exams(*))')
    .eq('attempt_id', attemptId)
    .single();
  if (error) throw error;

  type Row = ExamResult & { exam_attempts: { exams: Exam } };
  const row = data as unknown as Row;
  return { ...row, exam: row.exam_attempts.exams };
}

export async function findActiveAttempt(
  examId: string,
  studentId: string
): Promise<ExamAttempt | null> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .eq('status', 'in_progress')
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ExamAttempt | null;
}

export async function countCompletedAttempts(examId: string, studentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('exam_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .in('status', ['submitted', 'auto_submitted', 'expired']);
  if (error) throw error;
  return count ?? 0;
}

export async function findCompletedAttempt(
  examId: string,
  studentId: string
): Promise<ExamAttempt | null> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .in('status', ['submitted', 'auto_submitted', 'expired'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ExamAttempt | null;
}
