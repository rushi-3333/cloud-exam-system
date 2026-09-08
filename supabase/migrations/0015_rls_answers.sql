-- ============================================================================
-- Migration: 0015_rls_answers.sql
-- ============================================================================

-- POLICY: "answers_select_own_or_admin"
-- WHY: A student needs to read their own saved answers (to resume the exam
-- after a refresh). Admins can view answers for grading/audit purposes
-- (never shown in the live-monitoring UI per the spec, but the data access
-- itself is legitimate for an admin investigating a dispute).
create policy "answers_select_own_or_admin"
  on public.answers for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.exam_attempts a
      where a.id = answers.attempt_id and a.student_id = auth.uid()
    )
  );

-- POLICY: "answers_insert_own_in_progress"
-- WHY: A student may save an answer only for their own attempt, and only
-- while that attempt is still in_progress — this is what stops someone
-- from inserting/editing answers after time is up or after submission.
create policy "answers_insert_own_in_progress"
  on public.answers for insert
  with check (
    exists (
      select 1 from public.exam_attempts a
      where a.id = answers.attempt_id
        and a.student_id = auth.uid()
        and a.status = 'in_progress'
        and now() <= a.server_deadline_at
    )
  );

-- POLICY: "answers_update_own_in_progress"
-- WHY: Same guard as insert — a student may change a previously selected
-- option or toggle "marked for review" only while their attempt is active
-- and within the server-validated time window.
create policy "answers_update_own_in_progress"
  on public.answers for update
  using (
    exists (
      select 1 from public.exam_attempts a
      where a.id = answers.attempt_id
        and a.student_id = auth.uid()
        and a.status = 'in_progress'
        and now() <= a.server_deadline_at
    )
  )
  with check (
    exists (
      select 1 from public.exam_attempts a
      where a.id = answers.attempt_id
        and a.student_id = auth.uid()
    )
  );

-- No delete policy: answers are never deleted by the client, only
-- overwritten (selected_option_id updated) or left null (unanswered).
