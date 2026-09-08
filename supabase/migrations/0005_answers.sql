-- ============================================================================
-- Migration: 0005_answers.sql
-- selected_option_id is nullable = unanswered. Students may only write here
-- (via RLS) while their own attempt.status = 'in_progress' — enforced in
-- the RLS migration, not here.
-- ============================================================================

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  marked_for_review boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index idx_answers_attempt_id on public.answers(attempt_id);
create index idx_answers_question_id on public.answers(question_id);

create trigger trg_answers_updated_at
  before update on public.answers
  for each row execute function public.set_updated_at();

alter table public.answers enable row level security;
