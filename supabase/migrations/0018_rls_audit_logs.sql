-- ============================================================================
-- Migration: 0018_rls_audit_logs.sql
-- ============================================================================

-- POLICY: "audit_logs_select_admin_only"
-- WHY: Audit logs are an admin/compliance concern; students never need or
-- should see the raw event trail (which may reference other students).
create policy "audit_logs_select_admin_only"
  on public.audit_logs for select
  using (public.is_admin());

-- No insert/update/delete policy for authenticated users of any role.
-- Rows are written exclusively by Edge Functions using the service-role
-- key, which bypasses RLS. This keeps the log tamper-proof from the client.
