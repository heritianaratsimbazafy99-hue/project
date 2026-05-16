-- 20260516_select_policy_performance_tightening

drop policy if exists companies_select_verified_public on public.companies;
drop policy if exists companies_select_recruiter_owned_or_admin on public.companies;

create policy companies_select_verified_public on public.companies
  for select to anon
  using (status = 'verified'::public.company_status);

create policy companies_select_recruiter_owned_or_admin on public.companies
  for select to authenticated
  using (
    status = 'verified'::public.company_status
    or (owner_id = (select auth.uid()) and private.current_user_role() = 'recruiter'::public.user_role)
    or (select private.is_admin())
  );

drop policy if exists jobs_select_published_public on public.jobs;
drop policy if exists jobs_select_public_published_verified on public.jobs;
drop policy if exists jobs_select_recruiter_owned_or_admin on public.jobs;

create policy jobs_select_public_published_verified on public.jobs
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

create policy jobs_select_recruiter_owned_or_admin on public.jobs
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
    or (select private.owns_company(public.jobs.company_id))
    or (select private.is_admin())
  );
