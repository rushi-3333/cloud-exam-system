-- ============================================================================
-- Migration: 0019_notification_triggers.sql
-- Notifications are written only by these security-definer trigger
-- functions (or Edge Functions with service role) - never directly by a
-- client insert, per the RLS policy on notifications (Phase 5).
-- ============================================================================

create or replace function public.notify_students_on_exam_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    insert into public.notifications (user_id, type, title, body)
    select id, 'exam_published', 'New exam published: ' || new.title,
           'The exam "' || new.title || '" is now available to attempt.'
    from public.profiles
    where role = 'student';
  end if;
  return new;
end;
$$;

create trigger trg_notify_exam_published
  after update on public.exams
  for each row execute function public.notify_students_on_exam_published();

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
    'You scored ' || new.percentage || '% (' || upper(new.pass_status) || ').'
  );
  return new;
end;
$$;

create trigger trg_notify_result_created
  after insert on public.results
  for each row execute function public.notify_student_on_result_created();

create or replace function public.notify_admins_on_new_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'student' then
    insert into public.notifications (user_id, type, title, body)
    select id, 'new_registration', 'New student registered', new.full_name || ' just registered.'
    from public.profiles
    where role = 'admin';
  end if;
  return new;
end;
$$;

create trigger trg_notify_new_student
  after insert on public.profiles
  for each row execute function public.notify_admins_on_new_student();

create or replace function public.notify_admins_on_exam_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text;
  v_exam_title text;
begin
  if new.status in ('submitted', 'auto_submitted') and old.status = 'in_progress' then
    select full_name into v_student_name from public.profiles where id = new.student_id;
    select title into v_exam_title from public.exams where id = new.exam_id;

    insert into public.notifications (user_id, type, title, body)
    select id, 'exam_submission', 'Exam submitted',
           v_student_name || ' submitted "' || v_exam_title || '"'
    from public.profiles
    where role = 'admin';
  end if;
  return new;
end;
$$;

create trigger trg_notify_exam_submission
  after update on public.exam_attempts
  for each row execute function public.notify_admins_on_exam_submission();
