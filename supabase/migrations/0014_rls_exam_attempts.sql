-- ============================================================================
-- Migration: 0014_rls_exam_attempts.sql
-- ============================================================================

-- POLICY: "attempts_select_own_or_admin"
-- WHY: A student needs to see their own attempt (to resume/render the exam
-- and check remaining time). Admins need to see all attempts for live
-- monitoring and analytics.
create policy "attempts_select_own_or_admin"
  on public.exam_attempts for select
  using (student_id = auth.uid() or public.is_admin());

-- POLICY: "attempts_insert_own"
-- WHY: A student starts their own exam attempt. NOTE: in production, the
-- start-exam Edge Function (service role) is the recommended path since it
-- can also check exam.start_at/end_at windows atomically before creating
-- the row. This policy exists as defense-in-depth / direct-client fallback,
-- and the trigger below guarantees server_deadline_at is computed from the
-- real exam duration server-side regardless of what the client sends.
create policy "attempts_insert_own"
  on public.exam_attempts for insert
  with check (student_id = auth.uid());

create or replace function public.set_server_deadline()
returns trigger
language plpgsql
as $$
declare
  v_duration integer;
  v_exam_status public.exam_status;
  v_start_at timestamptz;
  v_end_at timestamptz;
begin
  select duration_minutes, status, start_at, end_at
    into v_duration, v_exam_status, v_start_at, v_end_at
  from public.exams
  where id = new.exam_id;

  if v_exam_status is distinct from 'published' then
    raise exception 'Cannot start an attempt on an exam that is not published.';
  end if;

  if now() < v_start_at or now() > v_end_at then
    raise exception 'This exam is not currently open for attempts.';
  end if;

  new.started_at := now();
  new.server_deadline_at := now() + (v_duration || ' minutes')::interval;

  return new;
end;
$$;

create trigger trg_set_server_deadline
  before insert on public.exam_attempts
  for each row execute function public.set_server_deadline();

-- POLICY: "attempts_update_own_in_progress"
-- WHY: A student may only touch their own attempt, and only while it's
-- still in_progress (e.g. to flip it to submitted). Once submitted/expired,
-- it becomes read-only to the student — final scoring is the Edge
-- Function's job via service role, which bypasses RLS entirely.
create policy "attempts_update_own_in_progress"
  on public.exam_attempts for update
  using (student_id = auth.uid() and status = 'in_progress')
  with check (student_id = auth.uid());

-- No delete policy for anyone via the client — attempts are permanent
-- audit-relevant records once created.
