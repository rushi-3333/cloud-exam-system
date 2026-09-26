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
  max_attempts: number;
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

export async function updateQuestionText(
  questionId: string,
  input: { question_text: string; marks: number }
): Promise<void> {
  const { error } = await supabase.from('questions').update(input).eq('id', questionId);
  if (error) throw error;
}

export async function updateQuestionOptionText(
  optionId: string,
  optionText: string
): Promise<void> {
  const { error } = await supabase
    .from('question_options')
    .update({ option_text: optionText })
    .eq('id', optionId);
  if (error) throw error;
}

export async function setCorrectOption(
  newCorrectOptionId: string,
  oldCorrectOptionId: string | null
): Promise<void> {
  if (oldCorrectOptionId && oldCorrectOptionId !== newCorrectOptionId) {
    const { error: clearErr } = await supabase
      .from('question_options')
      .update({ is_correct: false })
      .eq('id', oldCorrectOptionId);
    if (clearErr) throw clearErr;
  }
  const { error } = await supabase
    .from('question_options')
    .update({ is_correct: true })
    .eq('id', newCorrectOptionId);
  if (error) throw error;
}

export async function swapQuestionOrder(
  questionAId: string,
  orderA: number,
  questionBId: string,
  orderB: number
): Promise<void> {
  const { error: e1 } = await supabase
    .from('questions')
    .update({ order_index: -1 })
    .eq('id', questionAId);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('questions')
    .update({ order_index: orderA })
    .eq('id', questionBId);
  if (e2) throw e2;

  const { error: e3 } = await supabase
    .from('questions')
    .update({ order_index: orderB })
    .eq('id', questionAId);
  if (e3) throw e3;
}

export interface ResultWithDetails {
  id: string;
  attempt_id: string;
  student_id: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  pass_status: 'pass' | 'fail';
  created_at: string;
  student_name: string;
  exam_title: string;
  exam_subject: string;
}

export async function fetchAllResults(): Promise<ResultWithDetails[]> {
  const { data, error } = await supabase
    .from('results')
    .select(
      '*, exam_attempts!inner(exam_id, student_id, exams(title, subject), profiles(full_name))'
    )
    .order('created_at', { ascending: false });
  if (error) throw error;

  type Row = {
    id: string;
    attempt_id: string;
    marks_obtained: number;
    total_marks: number;
    percentage: number;
    correct_count: number;
    wrong_count: number;
    unanswered_count: number;
    pass_status: 'pass' | 'fail';
    created_at: string;
    exam_attempts: {
      student_id: string;
      exams: { title: string; subject: string };
      profiles: { full_name: string };
    };
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    attempt_id: r.attempt_id,
    student_id: r.exam_attempts?.student_id ?? '',
    marks_obtained: r.marks_obtained,
    total_marks: r.total_marks,
    percentage: r.percentage,
    correct_count: r.correct_count,
    wrong_count: r.wrong_count,
    unanswered_count: r.unanswered_count,
    pass_status: r.pass_status,
    created_at: r.created_at,
    student_name: r.exam_attempts?.profiles?.full_name ?? 'Unknown',
    exam_title: r.exam_attempts?.exams?.title ?? 'Unknown exam',
    exam_subject: r.exam_attempts?.exams?.subject ?? '',
  }));
}

export interface StudentSummary {
  id: string;
  full_name: string;
  created_at: string;
}

export async function fetchStudents(): Promise<StudentSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StudentSummary[];
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  actor_name: string;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function fetchAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, user_id, action, entity, entity_id, metadata, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  type Row = {
    id: string;
    user_id: string | null;
    action: string;
    entity: string;
    entity_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    profiles: { full_name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    actor_name: r.profiles?.full_name ?? 'System',
    action: r.action,
    entity: r.entity,
    entity_id: r.entity_id,
    metadata: r.metadata,
    created_at: r.created_at,
  }));
}

export interface ActiveAttempt {
  id: string;
  student_name: string;
  exam_title: string;
  started_at: string;
  server_deadline_at: string;
  status: string;
  proctoring_flag_count: number;
}

export async function fetchActiveAttempts(): Promise<ActiveAttempt[]> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select(
      'id, started_at, server_deadline_at, status, profiles(full_name), exams(title), proctoring_events(count)'
    )
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false });
  if (error) throw error;

  type Row = {
    id: string;
    started_at: string;
    server_deadline_at: string;
    status: string;
    profiles: { full_name: string };
    exams: { title: string };
    proctoring_events: { count: number }[];
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    student_name: r.profiles?.full_name ?? 'Unknown',
    exam_title: r.exams?.title ?? 'Unknown exam',
    started_at: r.started_at,
    server_deadline_at: r.server_deadline_at,
    status: r.status,
    proctoring_flag_count: r.proctoring_events?.[0]?.count ?? 0,
  }));
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}
