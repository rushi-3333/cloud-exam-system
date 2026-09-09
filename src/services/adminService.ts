import { supabase } from '@/lib/supabaseClient';
import type { Exam, QuestionWithOptions } from '@/types/exam';

export async function fetchAdminStats() {
  const [
    { count: totalStudents },
    { count: totalExams },
    { count: publishedExams },
    { count: draftExams },
    { count: totalAttempts },
    { data: resultsData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('exams').select('*', { count: 'exact', head: true }),
    supabase.from('exams').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('exams').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('exam_attempts').select('*', { count: 'exact', head: true }),
    supabase.from('results').select('percentage, pass_status'),
  ]);

  const results = (resultsData ?? []) as { percentage: number; pass_status: string }[];
  const averageScore =
    results.length > 0
      ? results.reduce((sum, r) => sum + Number(r.percentage), 0) / results.length
      : 0;
  const passCount = results.filter((r) => r.pass_status === 'pass').length;
  const passPercentage = results.length > 0 ? (passCount / results.length) * 100 : 0;

  return {
    totalStudents: totalStudents ?? 0,
    totalExams: totalExams ?? 0,
    publishedExams: publishedExams ?? 0,
    draftExams: draftExams ?? 0,
    totalAttempts: totalAttempts ?? 0,
    averageScore: Math.round(averageScore * 10) / 10,
    passPercentage: Math.round(passPercentage * 10) / 10,
  };
}

export async function fetchExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Exam[];
}

export async function fetchExam(id: string): Promise<Exam> {
  const { data, error } = await supabase.from('exams').select('*').eq('id', id).single();
  if (error) throw error;
  return data as unknown as Exam;
}

export interface ExamInput {
  title: string;
  description: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_percentage: number;
  start_at: string;
  end_at: string;
}

export async function createExam(input: ExamInput, createdBy: string): Promise<Exam> {
  const { data, error } = await supabase
    .from('exams')
    .insert({ ...input, created_by: createdBy, status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Exam;
}

export async function updateExam(id: string, input: Partial<ExamInput>): Promise<void> {
  const { error } = await supabase.from('exams').update(input).eq('id', id);
  if (error) throw error;
}

export async function setExamStatus(
  id: string,
  status: 'draft' | 'published' | 'closed'
): Promise<void> {
  const { error } = await supabase.from('exams').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchQuestionsWithOptions(examId: string): Promise<QuestionWithOptions[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*, question_options(*)')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as QuestionWithOptions[];
}

export interface QuestionInput {
  question_text: string;
  marks: number;
  options: { option_text: string; is_correct: boolean }[];
}

export async function createQuestion(
  examId: string,
  input: QuestionInput,
  orderIndex: number
): Promise<void> {
  const { data: question, error: qError } = await supabase
    .from('questions')
    .insert({
      exam_id: examId,
      question_text: input.question_text,
      marks: input.marks,
      order_index: orderIndex,
    })
    .select()
    .single();
  if (qError) throw qError;

  const q = question as unknown as { id: string };
  const optionRows = input.options.map((opt, idx) => ({
    question_id: q.id,
    option_text: opt.option_text,
    is_correct: opt.is_correct,
    order_index: idx,
  }));

  const { error: oError } = await supabase.from('question_options').insert(optionRows);
  if (oError) throw oError;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}
