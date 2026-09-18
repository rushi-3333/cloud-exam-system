-- ============================================================================
-- Migration: 0023_fix_notify_trigger_cast.sql
-- Bug: upper(new.pass_status) fails because pass_status is a custom enum
-- type, and Postgres's upper() function requires text, not an enum, with
-- no implicit cast available. This was silently failing every submission
-- since Phase 15, rolling back the whole grading transaction each time.
-- ============================================================================

create or replace function public.notify_student_on_result_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_exam_title text;
begin
  select ea.student_id, e.title into v_student_id, v_exam_title
  from public.exam_attempts ea
  join public.exams e on e.id = ea.exam_id
  where ea.id = new.attempt_id;

  insert into public.notifications (user_id, type, title, body)
  values (
    v_student_id,
    'result_available',
    'Result available: ' || v_exam_title,
    'You scored ' || new.percentage || '% (' || upper(new.pass_status::text) || ').'
  );
  return new;
end;
$$;
