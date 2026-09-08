-- ============================================================================
-- Migration: 0002_exams.sql
-- ============================================================================

create type public.exam_status as enum ('draft', 'published', 'closed');

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  subject text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  total_marks integer not null check (total_marks > 0),
  passing_percentage numeric(5,2) not null check (passing_percentage between 0 and 100),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.exam_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_exam_window check (end_at > start_at)
);

create index idx_exams_status on public.exams(status);
create index idx_exams_created_by on public.exams(created_by);
create index idx_exams_start_end on public.exams(start_at, end_at);

create trigger trg_exams_updated_at
  before update on public.exams
  for each row execute function public.set_updated_at();

alter table public.exams enable row level security;
