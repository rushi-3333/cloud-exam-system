-- ============================================================================
-- Migration: 0011_rls_exams.sql
-- ============================================================================

-- POLICY: "exams_select_published_or_admin"
-- WHY: Students should only ever see exams that are 'published' — drafts
-- and closed exams are an admin-only concern (planning/review). Admins see
-- every exam regardless of status, so they can manage drafts and closed exams.
create policy "exams_select_published_or_admin"
  on public.exams for select
  using (status = 'published' or public.is_admin());

-- POLICY: "exams_insert_admin_only"
-- WHY: Only admins create exams. We also require created_by to match the
-- inserting user, so audit trails ("who created this exam") stay accurate.
create policy "exams_insert_admin_only"
  on public.exams for insert
  with check (public.is_admin() and created_by = auth.uid());

-- POLICY: "exams_update_admin_only"
-- WHY: Editing exam details, publishing, closing — all admin-only actions.
create policy "exams_update_admin_only"
  on public.exams for update
  using (public.is_admin())
  with check (public.is_admin());

-- POLICY: "exams_delete_admin_only"
-- WHY: Only admins may delete an exam (and only drafts should realistically
-- be deleted — enforce that stricter rule in the application layer / Edge
-- Function, since RLS alone can't easily express "only if status=draft"
-- without also blocking legitimate edits; we keep this policy permissive
-- for admins and rely on the UI + Edge Function to disallow deleting live exams).
create policy "exams_delete_admin_only"
  on public.exams for delete
  using (public.is_admin());
