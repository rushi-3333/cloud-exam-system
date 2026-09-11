-- ============================================================================
-- Migration: 0020_enable_realtime.sql
-- Enables Postgres change-feed broadcasting for exam_attempts, which the
-- admin Live Monitoring page subscribes to. RLS still applies to what any
-- given subscriber can see - this only turns the feed on at the table level.
-- ============================================================================

alter publication supabase_realtime add table public.exam_attempts;
