-- ============================================================================
-- Migration: 0021_proctoring_events.sql
-- Logs exam-integrity signals (tab switches, window blur) during an active
-- attempt. Students can only insert events for their OWN in_progress
-- attempt - the same pattern used for answers - and can never read them
-- back. Admins can read all, for the live-monitoring and results views.
-- ============================================================================

create type public.proctoring_event_type as enum ('tab_hidden', 'window_blur', 'fullscreen_exit');

create table public.proctoring_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  event_type public.proctoring_event_type not null,
  occurred_at timestamptz not null default now()
);

create index idx_proctoring_events_attempt_id on public.proctoring_events(attempt_id);

alter table public.proctoring_events enable row level security;

create policy "proctoring_events_insert_own_in_progress"
  on public.proctoring_events for insert
  with check (
    exists (
      select 1 from public.exam_attempts a
      where a.id = proctoring_events.attempt_id
        and a.student_id = auth.uid()
        and a.status = 'in_progress'
    )
  );

create policy "proctoring_events_select_admin_only"
  on public.proctoring_events for select
  using (public.is_admin());
