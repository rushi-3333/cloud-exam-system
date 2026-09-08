-- ============================================================================
-- Migration: 0003_questions.sql
-- question_options is a separate table (not JSON) so future question types
-- (true/false, multi-select, short-answer) can reuse/extend this pattern.
-- ============================================================================

create type public.question_type as enum ('mcq');

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null check (char_length(question_text) > 0),
  question_type public.question_type not null default 'mcq',
  marks integer not null check (marks > 0),
  order_index integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, order_index)
);

create index idx_questions_exam_id on public.questions(exam_id);

create trigger trg_questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null check (char_length(option_text) > 0),
  is_correct boolean not null default false,
  order_index integer not null,
  created_at timestamptz not null default now(),
  unique (question_id, order_index)
);

create index idx_question_options_question_id on public.question_options(question_id);

create or replace function public.enforce_single_correct_option()
returns trigger
language plpgsql
as $$
declare
  correct_count integer;
begin
  select count(*) into correct_count
  from public.question_options
  where question_id = coalesce(new.question_id, old.question_id)
    and is_correct = true;

  if correct_count > 1 then
    raise exception 'Question % has more than one correct option', coalesce(new.question_id, old.question_id);
  end if;

  return new;
end;
$$;

create trigger trg_single_correct_option
  after insert or update on public.question_options
  for each row execute function public.enforce_single_correct_option();

alter table public.questions enable row level security;
alter table public.question_options enable row level security;
