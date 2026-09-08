-- ============================================================================
-- Migration: 0008_audit_logs.sql
-- Immutable trail: no update/delete policy is ever granted to anyone except
-- via direct DB admin access. Rows are inserted by Edge Functions
-- (service-role) and by a few security-definer trigger functions.
-- ============================================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_entity on public.audit_logs(entity, entity_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;
