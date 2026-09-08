-- ============================================================================
-- Migration: 0013_rls_question_options.sql
-- CRITICAL SECURITY TABLE: is_correct must never reach a student before
-- they submit. RLS filters ROWS, not COLUMNS — so we deliberately do NOT
-- give students a direct SELECT policy on this table at all. Instead they
-- read options through get_options_for_student(), a function that strips
-- is_correct entirely from its return shape.
-- ============================================================================

-- POLICY: "question_options_admin_full_access"
-- WHY: Admins manage correct answers while building exams, so they need
-- full CRUD directly on the table (via the Admin question-editor UI).
create policy "question_options_admin_select"
  on public.question_options for select
  using (public.is_admin());

create policy "question_options_admin_insert"
  on public.question_options for insert
  with check (public.is_admin());

create policy "question_options_admin_update"
  on public.question_options for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "question_options_admin_delete"
  on public.question_options for delete
  using (public.is_admin());

-- No policy grants students any row visibility on this table at all —
-- with RLS enabled and no matching policy, a student query simply returns
-- zero rows. This is intentional and is the actual answer-hiding mechanism.

-- FUNCTION: get_options_for_student(question_id)
-- Returns option_text/order_index for a question WITHOUT is_correct, and
-- only if that question belongs to a currently published exam. security
-- definer lets it read question_options despite the caller having no RLS
-- access to that table — but the RETURN TABLE shape below simply omits
-- is_correct, so there is no way for the caller to retrieve it through here.
create or replace function public.get_options_for_student(p_question_id uuid)
returns table (id uuid, option_text text, order_index integer)
language sql
stable
security definer
set search_path = public
as $$
  select qo.id, qo.option_text, qo.order_index
  from public.question_options qo
  join public.questions q on q.id = qo.question_id
  join public.exams e on e.id = q.exam_id
  where qo.question_id = p_question_id
    and e.status = 'published'
  order by qo.order_index;
$$;

comment on function public.get_options_for_student(uuid) is
  'Safe, answer-hiding way for students to fetch MCQ options. Never returns is_correct.';

grant execute on function public.get_options_for_student(uuid) to authenticated;
