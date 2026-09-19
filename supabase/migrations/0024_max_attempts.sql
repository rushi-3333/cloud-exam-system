-- ============================================================================
-- Migration: 0024_max_attempts.sql
-- Adds a per-exam configurable attempt limit. Defaults to 1 to preserve
-- existing behavior for exams created before this migration.
-- ============================================================================

alter table public.exams
  add column max_attempts integer not null default 1 check (max_attempts >= 1);
