export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted' | 'expired';
export type PassStatus = 'pass' | 'fail';

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  server_deadline_at: string;
  status: AttemptStatus;
  submitted_at: string | null;
}

export interface ExamResult {
  id: string;
  attempt_id: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  pass_status: PassStatus;
  created_at: string;
}
