-- ============================================================================
-- Migration: 0017_rls_notifications.sql
-- ============================================================================

-- POLICY: "notifications_select_own"
-- WHY: Users only ever see their own notification feed.
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

-- POLICY: "notifications_update_own_mark_read"
-- WHY: The only mutation a user needs is marking their own notification as
-- read (setting read_at). They should not be able to change who it belongs
-- to, its type, or its content.
create policy "notifications_update_own_mark_read"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No insert policy for regular users: notifications are created by the
-- send-notification Edge Function (service role) or security-definer
-- trigger functions in response to system events (exam published, result
-- ready, etc.) — never directly by a client insert.
