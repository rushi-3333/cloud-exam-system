-- ============================================================================
-- Migration: 0022_grade_and_finalize_attempt.sql
-- Moves the entire submit+grade sequence into ONE atomic Postgres function,
-- called by the submit-exam Edge Function via a single RPC round trip.
-- This replaces the previous approach of ~6 sequential JS-driven queries,
-- which was timing out intermittently and leaving attempts marked
-- "submitted" with no matching result row.
-- ============================================================================

create or replace function public.grade_and_finalize_attempt(
  p_attempt_id uuid,
  p_caller_id uuid
)
returns table (
  result_id uuid,
  marks_obtained numeric,
  total_marks integer,
  percentage numeric,
  correct_count integer,
  wrong_count integer,
  unanswered_count integer,
  pass_status public.pass_status,
  already_existed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt record;
  v_final_status public.attempt_status;
  v_exam_passing numeric;
  v_marks_obtained numeric := 0;
  v_total_marks integer := 0;
  v_correct integer := 0;
  v_wrong integer := 0;
  v_unanswered integer := 0;
  v_pass_status public.pass_status;
  v_result_id uuid;
  q record;
  v_selected uuid;
begin
  select * into v_attempt from public.exam_attempts where id = p_attempt_id;

  if v_attempt is null then
    raise exception 'ATTEMPT_NOT_FOUND';
  end if;

  if v_attempt.student_id <> p_caller_id then
    raise exception 'NOT_OWNER';
  end if;

  if v_attempt.status <> 'in_progress' then
    select id into v_result_id from public.results where attempt_id = p_attempt_id;
    if v_result_id is not null then
      return query
        select r.id, r.marks_obtained, r.total_marks, r.percentage,
               r.correct_count, r.wrong_count, r.unanswered_count, r.pass_status, true
        from public.results r where r.id = v_result_id;
      return;
    else
      raise exception 'ALREADY_SUBMITTED_NO_RESULT';
    end if;
  end if;

  v_final_status := case
    when now() > v_attempt.server_deadline_at then 'auto_submitted'
    else 'submitted'
  end;

  update public.exam_attempts
  set status = v_final_status, submitted_at = now()
  where id = p_attempt_id and status = 'in_progress';

  if not found then
    raise exception 'CONCURRENT_SUBMISSION';
  end if;

  for q in
    select
      qu.id as question_id,
      qu.marks,
      (
        select qo.id from public.question_options qo
        where qo.question_id = qu.id and qo.is_correct = true
        limit 1
      ) as correct_option_id
    from public.questions qu
    where qu.exam_id = v_attempt.exam_id
  loop
    v_total_marks := v_total_marks + q.marks;

    select selected_option_id into v_selected
    from public.answers
    where attempt_id = p_attempt_id and question_id = q.question_id;

    if v_selected is null then
      v_unanswered := v_unanswered + 1;
    elsif v_selected = q.correct_option_id then
      v_correct := v_correct + 1;
      v_marks_obtained := v_marks_obtained + q.marks;
    else
      v_wrong := v_wrong + 1;
    end if;
  end loop;

  select passing_percentage into v_exam_passing from public.exams where id = v_attempt.exam_id;

  v_pass_status := case
    when v_total_marks > 0 and (v_marks_obtained / v_total_marks) * 100 >= coalesce(v_exam_passing, 100)
    then 'pass'::public.pass_status
    else 'fail'::public.pass_status
  end;

  insert into public.results (
    attempt_id, marks_obtained, total_marks, percentage,
    correct_count, wrong_count, unanswered_count, pass_status
  )
  values (
    p_attempt_id,
    v_marks_obtained,
    greatest(v_total_marks, 1),
    case when v_total_marks > 0 then round((v_marks_obtained / v_total_marks) * 100, 2) else 0 end,
    v_correct, v_wrong, v_unanswered, v_pass_status
  )
  returning id into v_result_id;

  insert into public.audit_logs (user_id, action, entity, entity_id, metadata)
  values (
    p_caller_id, 'exam_submitted', 'exam_attempts', p_attempt_id,
    jsonb_build_object('exam_id', v_attempt.exam_id, 'status', v_final_status)
  );

  return query
    select r.id, r.marks_obtained, r.total_marks, r.percentage,
           r.correct_count, r.wrong_count, r.unanswered_count, r.pass_status, false
    from public.results r where r.id = v_result_id;
end;
$$;

grant execute on function public.grade_and_finalize_attempt(uuid, uuid) to service_role;
