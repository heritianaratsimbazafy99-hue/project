do $$
begin
  if to_regclass('public.companies') is null then
    raise exception 'Missing prerequisite table: public.companies';
  end if;

  if to_regclass('public.subscriptions') is null then
    raise exception 'Missing prerequisite table: public.subscriptions';
  end if;

  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Missing prerequisite function: public.is_admin()';
  end if;
end;
$$;

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

revoke all on function public.current_recruiter_has_cv_access() from public;
grant execute on function public.current_recruiter_has_cv_access() to authenticated;

drop policy if exists candidate_profiles_select_allowed on public.candidate_profiles;
create policy candidate_profiles_select_allowed on public.candidate_profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or (select public.current_recruiter_has_cv_access())
    or exists (
      select 1
      from public.applications
      where public.applications.candidate_id = public.candidate_profiles.user_id
        and (select public.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_experiences_select_allowed on public.candidate_experiences;
create policy candidate_experiences_select_allowed on public.candidate_experiences
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.current_recruiter_has_cv_access())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.candidate_profiles
      join public.applications on public.applications.candidate_id = public.candidate_profiles.user_id
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and (select public.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_educations_select_allowed on public.candidate_educations;
create policy candidate_educations_select_allowed on public.candidate_educations
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.current_recruiter_has_cv_access())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.candidate_profiles
      join public.applications on public.applications.candidate_id = public.candidate_profiles.user_id
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and (select public.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_skills_select_allowed on public.candidate_skills;
create policy candidate_skills_select_allowed on public.candidate_skills
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.current_recruiter_has_cv_access())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.candidate_profiles
      join public.applications on public.applications.candidate_id = public.candidate_profiles.user_id
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and (select public.owns_job(public.applications.job_id))
    )
  );

create or replace function public.can_read_cv_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (storage.foldername(object_name))[1] = (select auth.uid())::text
    or (select public.is_admin())
    or exists (
      select 1
      from public.applications
      join public.jobs
        on public.jobs.id = public.applications.job_id
      join public.companies
        on public.companies.id = public.jobs.company_id
      where public.applications.cv_path = object_name
        and public.companies.owner_id = (select auth.uid())
    )
    or (
      (select public.current_recruiter_has_cv_access())
      and exists (
        select 1
        from public.candidate_profiles
        where public.candidate_profiles.cv_path = object_name
      )
    );
$$;

revoke all on function public.can_read_cv_object(text) from public;
grant execute on function public.can_read_cv_object(text) to authenticated;
