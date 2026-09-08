-- ============================================================================
-- Migration: 0010_rls_profiles.sql
-- ============================================================================

-- POLICY: "profiles_select_own_or_admin"
-- WHY: A user must be able to read their own profile (name, role) to power
-- the UI (e.g. "Welcome, Rushi"). Admins additionally need to browse the
-- full student list (Admin > Students page), so admins may read every row.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- POLICY: "profiles_update_own_name_only"
-- WHY: A student should be able to edit their own display name, but must
-- NEVER be able to promote themselves to admin. The trigger below blocks
-- any attempt to change `role` outside of a service-role/admin context,
-- regardless of what the UPDATE statement tries to set.
create policy "profiles_update_own_name_only"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'You are not allowed to change your own role.';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_self_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();
