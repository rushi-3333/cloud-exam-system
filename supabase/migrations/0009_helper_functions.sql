-- ============================================================================
-- Migration: 0009_helper_functions.sql
-- security definer + stable so RLS policies can cheaply check "is this user
-- an admin" without triggering recursive RLS evaluation on profiles itself.
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

comment on function public.is_admin() is
  'Returns true if the currently authenticated user has role=admin in profiles. Used by RLS policies across the schema.';
