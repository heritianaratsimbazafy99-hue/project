create or replace function public.candidate_owns_cv_path(candidate_cv_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.candidate_profiles
    where public.candidate_profiles.user_id = (select auth.uid())
      and public.candidate_profiles.cv_path = candidate_cv_path
      and candidate_cv_path like (select auth.uid())::text || '/%'
  );
$$;

revoke all on function public.candidate_owns_cv_path(text) from public, anon;
grant execute on function public.candidate_owns_cv_path(text) to authenticated;

drop policy if exists applications_insert_candidate_for_published_job on public.applications;
create policy applications_insert_candidate_for_published_job on public.applications
  for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and length(trim(cv_path)) > 0
    and status = 'submitted'::public.application_status
    and (select public.current_user_role()) = 'candidate'
    and (select public.candidate_owns_cv_path(public.applications.cv_path))
    and exists (
      select 1
      from public.jobs
      join public.companies on public.companies.id = public.jobs.company_id
      where public.jobs.id = public.applications.job_id
        and public.jobs.status = 'published'::public.job_status
        and public.companies.status = 'verified'::public.company_status
    )
  );
