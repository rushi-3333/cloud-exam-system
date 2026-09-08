-- ============================================================================
-- Migration: 0012_rls_questions.sql
-- ============================================================================

-- POLICY: "questions_select_published_exam_or_admin"
-- WHY: A student may see a question's text/marks only if it belongs to a
-- published exam (they need this to render the exam-taking screen and the
-- instructions page). Admins can see questions for any exam they manage.
create policy "questions_select_published_exam_or_admin"
  on public.questions for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.exams e
      where e.id = questions.exam_id and e.status = 'published'
    )
  );

-- POLICY: "questions_insert_admin_only"
create policy "questions_insert_admin_only"
  on public.questions for insert
  with check (public.is_admin());

-- POLICY: "questions_update_admin_only"
create policy "questions_update_admin_only"
  on public.questions for update
  using (public.is_admin())
  with check (public.is_admin());

-- POLICY: "questions_delete_admin_only"
create policy "questions_delete_admin_only"
  on public.questions for delete
  using (public.is_admin());
