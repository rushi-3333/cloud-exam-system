-- ============================================================================
-- Migration: 0004_exam_attempts.sql
-- server_deadline_at is computed SERVER-SIDE (by the start-exam Edge Function)
-- as started_at + exam.duration_minutes. The frontend timer counts down to
-- this timestamp — never to a client-side clock — so browser clock
-- manipulation cannot extend exam time.
-- ============================================================================

create type public.attempt_status as enum ('in_progress', 'submitted', 'auto_submitted', 'expired');

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  server_deadline_at timestamptz not null,
  status public.attempt_status not null default 'in_progress',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_submitted_at check (
    (status in ('submitted', 'auto_submitted') and submitted_at is not null)
    or (status in ('in_progress', 'expired') and submitted_at is null)
  )
);

create unique index uq_one_active_attempt_per_student_exam
  on public.exam_attempts (exam_id, student_id)
  where status = 'in_progress';

create index idx_exam_attempts_exam_id on public.exam_attempts(exam_id);
create index idx_exam_attempts_student_id on public.exam_attempts(student_id);
create index idx_exam_attempts_status on public.exam_attempts(status);

create trigger trg_exam_attempts_updated_at
  before update on public.exam_attempts
  for each row execute function public.set_updated_at();

alter table public.exam_attempts enable row level security;
