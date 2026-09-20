-- ============================================================================
-- Migration: 0025_result_breakdown.sql
-- Unlike get_options_for_student() (which NEVER reveals is_correct, used
-- during a live attempt), this function is the post-exam counterpart: once
-- an attempt is no longer in_progress, showing the student which answer
-- was correct is safe and expected. Ownership + completion are both
-- enforced inside the function itself.
-- ============================================================================

create or replace function public.get_result_breakdown(p_attempt_id uuid)
returns table (
  question_id uuid,
  question_text text,
  marks integer,
  order_index integer,
  selected_option_id uuid,
  selected_option_text text,
  correct_option_id uuid,
  correct_option_text text,
  is_correct boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt record;
begin
  select * into v_attempt from public.exam_attempts where id = p_attempt_id;

  if v_attempt is null or v_attempt.student_id <> auth.uid() then
    raise exception 'NOT_FOUND_OR_NOT_OWNER';
  end if;

  if v_attempt.status = 'in_progress' then
    raise exception 'ATTEMPT_STILL_IN_PROGRESS';
  end if;

  return query
    select
      q.id as question_id,
      q.question_text,
      q.marks,
      q.order_index,
      a.selected_option_id,
      selopt.option_text as selected_option_text,
      correctopt.id as correct_option_id,
      correctopt.option_text as correct_option_text,
      (a.selected_option_id is not null and a.selected_option_id = correctopt.id) as is_correct
    from public.questions q
    left join public.answers a on a.question_id = q.id and a.attempt_id = p_attempt_id
    left join public.question_options selopt on selopt.id = a.selected_option_id
    left join public.question_options correctopt
      on correctopt.question_id = q.id and correctopt.is_correct = true
    where q.exam_id = v_attempt.exam_id
    order by q.order_index;
end;
$$;

grant execute on function public.get_result_breakdown(uuid) to authenticated;
