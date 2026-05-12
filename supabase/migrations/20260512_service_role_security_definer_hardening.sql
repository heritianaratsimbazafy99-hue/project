-- Keep session_user for migration-owner compatibility: local and Supabase-hosted
-- migrations may run as postgres/supabase_admin without JWT claims. Avoid
-- current_user because SECURITY DEFINER trigger execution changes it to the
-- function owner and would create an unintended privilege bypass.
create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce((select auth.role()) = 'service_role', false)
    or session_user in ('postgres', 'supabase_admin')
$$;
