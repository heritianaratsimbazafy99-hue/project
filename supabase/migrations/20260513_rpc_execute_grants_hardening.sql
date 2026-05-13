-- Reduce direct RPC exposure for SECURITY DEFINER helpers while keeping the
-- RLS paths that rely on them available to authenticated users.

create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.signup_slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(
      trim(
        both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g')
      ),
      ''
    ),
    'entreprise'
  )
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.role()) = 'service_role', false)
    or session_user in ('postgres', 'supabase_admin')
$$;

drop policy if exists companies_select_public_owned_or_admin on public.companies;
create policy companies_select_verified_public on public.companies
  for select to anon
  using (status = 'verified'::public.company_status);

create policy companies_select_verified_owned_or_admin on public.companies
  for select to authenticated
  using (
    status = 'verified'::public.company_status
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists jobs_select_public_owned_or_admin on public.jobs;
create policy jobs_select_published_public on public.jobs
  for select to anon
  using (
    status = 'published'::public.job_status
    and exists (
      select 1
      from public.companies
      where public.companies.id = public.jobs.company_id
        and public.companies.status = 'verified'::public.company_status
    )
  );

create policy jobs_select_published_owned_or_admin on public.jobs
  for select to authenticated
  using (
    (
      status = 'published'::public.job_status
      and exists (
        select 1
        from public.companies
        where public.companies.id = public.jobs.company_id
          and public.companies.status = 'verified'::public.company_status
      )
    )
    or (select public.owns_company(public.jobs.company_id))
    or (select public.is_admin())
  );

revoke all on function public.can_read_cv_object(text) from public, anon;
revoke all on function public.current_recruiter_has_cv_access() from public, anon;
revoke all on function public.current_user_role() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.owns_company(uuid) from public, anon;
revoke all on function public.owns_job(uuid) from public, anon;
revoke all on function public.safe_uuid(text) from public, anon;

grant execute on function public.can_read_cv_object(text) to authenticated;
grant execute on function public.current_recruiter_has_cv_access() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_company(uuid) to authenticated;
grant execute on function public.owns_job(uuid) to authenticated;
grant execute on function public.safe_uuid(text) to authenticated;

revoke all on function public.enforce_company_job_quota() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.is_service_role() from public, anon, authenticated;
revoke all on function public.protect_application_identity() from public, anon, authenticated;
revoke all on function public.protect_company_moderation_fields() from public, anon, authenticated;
revoke all on function public.protect_job_moderation_fields() from public, anon, authenticated;
revoke all on function public.protect_plan_request_owner_cancel() from public, anon, authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
revoke all on function public.protect_profile_system_fields() from public, anon, authenticated;
revoke all on function public.protect_subscription_entitlements() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.signup_slugify(text) from public, anon, authenticated;

revoke all on function public.review_company(uuid, text, text) from public, anon;
revoke all on function public.review_job(uuid, text, text) from public, anon;
revoke all on function public.review_plan_change_request(uuid, text, text) from public, anon;

grant execute on function public.review_company(uuid, text, text) to authenticated;
grant execute on function public.review_job(uuid, text, text) to authenticated;
grant execute on function public.review_plan_change_request(uuid, text, text) to authenticated;
