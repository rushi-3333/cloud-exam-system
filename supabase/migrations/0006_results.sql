-- ============================================================================
-- Migration: 0006_results.sql
-- CRITICAL: this table gets NO client-writable RLS policy at all (see RLS
-- migration). Only the calculate-result Edge Function, using the
-- service-role key, may insert/update here. Students get read-only access
-- scoped to their own attempt.
-- ============================================================================

create type public.pass_status as enum ('pass', 'fail');

create table public.results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.exam_attempts(id) on delete cascade,
  marks_obtained numeric(7,2) not null check (marks_obtained >= 0),
  total_marks integer not null check (total_marks > 0),
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  correct_count integer not null check (correct_count >= 0),
  wrong_count integer not null check (wrong_count >= 0),
  unanswered_count integer not null check (unanswered_count >= 0),
  pass_status public.pass_status not null,
  created_at timestamptz not null default now()
);

create index idx_results_attempt_id on public.results(attempt_id);

alter table public.results enable row level security;
