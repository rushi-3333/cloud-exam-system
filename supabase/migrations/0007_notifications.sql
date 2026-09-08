-- ============================================================================
-- Migration: 0007_notifications.sql
-- ============================================================================

create type public.notification_type as enum (
  'exam_published',
  'exam_starting_soon',
  'exam_closed',
  'result_available',
  'new_registration',
  'exam_submission',
  'system_event'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_user_unread on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;
