create or replace function public.current_recruiter_has_cv_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.companies
    join public.subscriptions
      on public.subscriptions.company_id = public.companies.id
    where public.companies.owner_id = (select auth.uid())
      and public.companies.status = 'verified'
      and public.current_user_role() = 'recruiter'
      and public.subscriptions.status = 'active'
      and (
        public.subscriptions.cv_access_enabled = true
        or public.subscriptions.plan in ('booster', 'agency')
        or coalesce(public.subscriptions.job_quota, 0) >= 999
      )
  );
$$;

revoke all on function public.current_recruiter_has_cv_access() from public, anon;
grant execute on function public.current_recruiter_has_cv_access() to authenticated;
