-- ============================================================================
-- Migration: 0016_rls_results.sql
-- CRITICAL: no insert/update/delete policy exists for regular users on this
-- table AT ALL. The only way a row ever gets written here is the
-- calculate-result Edge Function using the service-role key, which bypasses
-- RLS entirely. This is what makes score tampering impossible from the
-- client, no matter what the frontend code does.
-- ============================================================================

-- POLICY: "results_select_own_or_admin"
-- WHY: A student needs to see their own result after submitting. Admins
-- need to see every result for analytics and the results dashboard.
create policy "results_select_own_or_admin"
  on public.results for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.exam_attempts a
      where a.id = results.attempt_id and a.student_id = auth.uid()
    )
  );

-- Deliberately no insert/update/delete policies for authenticated users.
