export type ExamStatus = 'draft' | 'published' | 'closed';
export type QuestionType = 'mcq';

export interface Exam {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_percentage: number;
  max_attempts: number;
  start_at: string;
  end_at: string;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuestionWithOptions extends Question {
  question_options: QuestionOption[];
}
