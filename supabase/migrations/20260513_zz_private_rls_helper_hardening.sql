create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select public.profiles.role
  from public.profiles
  where public.profiles.id = (select auth.uid())
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'admin', false)
$$;

create or replace function private.owns_company(company_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.companies
    where public.companies.id = company_uuid
      and public.companies.owner_id = (select auth.uid())
  )
$$;

create or replace function private.owns_job(job_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.jobs
    join public.companies on public.companies.id = public.jobs.company_id
    where public.jobs.id = job_uuid
      and public.companies.owner_id = (select auth.uid())
  )
$$;

create or replace function private.safe_uuid(value text)
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

create or replace function private.current_recruiter_has_cv_access()
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
      and public.companies.status = 'verified'::public.company_status
      and private.current_user_role() = 'recruiter'::public.user_role
      and public.subscriptions.status = 'active'
      and (
        public.subscriptions.cv_access_enabled = true
        or public.subscriptions.plan in ('booster', 'agency')
        or coalesce(public.subscriptions.job_quota, 0) >= 999
      )
  )
$$;

create or replace function private.can_read_cv_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (storage.foldername(object_name))[1] = (select auth.uid())::text
    or (select private.is_admin())
    or exists (
      select 1
      from public.applications
      join public.jobs
        on public.jobs.id = public.applications.job_id
      join public.companies
        on public.companies.id = public.jobs.company_id
      where public.applications.cv_path = object_name
        and public.companies.owner_id = (select auth.uid())
        and public.companies.status = 'verified'::public.company_status
    )
    or (
      (select private.current_recruiter_has_cv_access())
      and exists (
        select 1
        from public.candidate_profiles
        where public.candidate_profiles.cv_path = object_name
      )
    )
$$;

create or replace function private.candidate_owns_cv_path(candidate_cv_path text)
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
  )
$$;

revoke all on all functions in schema private from public, anon;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.owns_company(uuid) to authenticated;
grant execute on function private.owns_job(uuid) to authenticated;
grant execute on function private.safe_uuid(text) to authenticated;
grant execute on function private.current_recruiter_has_cv_access() to authenticated;
grant execute on function private.can_read_cv_object(text) to authenticated;
grant execute on function private.candidate_owns_cv_path(text) to authenticated;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((id = (select auth.uid()) and role <> 'admin'::public.user_role) or (select private.is_admin()));

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists candidate_profiles_select_allowed on public.candidate_profiles;
create policy candidate_profiles_select_allowed on public.candidate_profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_admin())
    or (select private.current_recruiter_has_cv_access())
    or exists (
      select 1
      from public.applications
      where public.applications.candidate_id = public.candidate_profiles.user_id
        and (select private.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_profiles_insert_own on public.candidate_profiles;
create policy candidate_profiles_insert_own on public.candidate_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists candidate_profiles_update_own_or_admin on public.candidate_profiles;
create policy candidate_profiles_update_own_or_admin on public.candidate_profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists candidate_profiles_delete_admin on public.candidate_profiles;
create policy candidate_profiles_delete_admin on public.candidate_profiles
  for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists candidate_experiences_select_allowed on public.candidate_experiences;
create policy candidate_experiences_select_allowed on public.candidate_experiences
  for select to authenticated
  using (
    (select private.is_admin())
    or (select private.current_recruiter_has_cv_access())
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
        and (select private.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_experiences_write_own_or_admin on public.candidate_experiences;
drop policy if exists candidate_experiences_insert_own_or_admin on public.candidate_experiences;
create policy candidate_experiences_insert_own_or_admin on public.candidate_experiences
  for insert to authenticated
  with check (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

drop policy if exists candidate_experiences_update_own_or_admin on public.candidate_experiences;
create policy candidate_experiences_update_own_or_admin on public.candidate_experiences
  for update to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  )
  with check (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

drop policy if exists candidate_experiences_delete_own_or_admin on public.candidate_experiences;
create policy candidate_experiences_delete_own_or_admin on public.candidate_experiences
  for delete to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

drop policy if exists candidate_educations_select_allowed on public.candidate_educations;
create policy candidate_educations_select_allowed on public.candidate_educations
  for select to authenticated
  using (
    (select private.is_admin())
    or (select private.current_recruiter_has_cv_access())
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
        and (select private.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_educations_write_own_or_admin on public.candidate_educations;
drop policy if exists candidate_educations_insert_own_or_admin on public.candidate_educations;
create policy candidate_educations_insert_own_or_admin on public.candidate_educations
  for insert to authenticated
  with check (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

drop policy if exists candidate_educations_update_own_or_admin on public.candidate_educations;
create policy candidate_educations_update_own_or_admin on public.candidate_educations
  for update to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  )
  with check (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

drop policy if exists candidate_educations_delete_own_or_admin on public.candidate_educations;
create policy candidate_educations_delete_own_or_admin on public.candidate_educations
  for delete to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

drop policy if exists candidate_skills_select_allowed on public.candidate_skills;
create policy candidate_skills_select_allowed on public.candidate_skills
  for select to authenticated
  using (
    (select private.is_admin())
    or (select private.current_recruiter_has_cv_access())
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
        and (select private.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_skills_write_own_or_admin on public.candidate_skills;
drop policy if exists candidate_skills_insert_own_or_admin on public.candidate_skills;
create policy candidate_skills_insert_own_or_admin on public.candidate_skills
  for insert to authenticated
  with check (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

drop policy if exists candidate_skills_update_own_or_admin on public.candidate_skills;
create policy candidate_skills_update_own_or_admin on public.candidate_skills
  for update to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  )
  with check (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

drop policy if exists candidate_skills_delete_own_or_admin on public.candidate_skills;
create policy candidate_skills_delete_own_or_admin on public.candidate_skills
  for delete to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

drop policy if exists companies_insert_owner_or_admin on public.companies;
create policy companies_insert_owner_or_admin on public.companies
  for insert to authenticated
  with check (
    (owner_id = (select auth.uid()) and status = 'incomplete'::public.company_status)
    or (select private.is_admin())
  );

drop policy if exists companies_select_verified_owned_or_admin on public.companies;
create policy companies_select_verified_owned_or_admin on public.companies
  for select to authenticated
  using (
    status = 'verified'::public.company_status
    or owner_id = (select auth.uid())
    or (select private.is_admin())
  );

drop policy if exists companies_update_owner_or_admin on public.companies;
create policy companies_update_owner_or_admin on public.companies
  for update to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()))
  with check (owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists companies_delete_admin on public.companies;
create policy companies_delete_admin on public.companies
  for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists jobs_select_published_owned_or_admin on public.jobs;
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
    or (select private.owns_company(public.jobs.company_id))
    or (select private.is_admin())
  );

drop policy if exists jobs_insert_owned_company_or_admin on public.jobs;
create policy jobs_insert_owned_company_or_admin on public.jobs
  for insert to authenticated
  with check (
    (
      (select private.owns_company(company_id))
      and status in ('draft'::public.job_status, 'pending_review'::public.job_status)
      and is_featured = false
      and is_urgent = false
    )
    or (select private.is_admin())
  );

drop policy if exists jobs_update_owned_company_or_admin on public.jobs;
create policy jobs_update_owned_company_or_admin on public.jobs
  for update to authenticated
  using ((select private.owns_company(company_id)) or (select private.is_admin()))
  with check ((select private.owns_company(company_id)) or (select private.is_admin()));

drop policy if exists jobs_delete_owned_company_or_admin on public.jobs;
create policy jobs_delete_owned_company_or_admin on public.jobs
  for delete to authenticated
  using ((select private.owns_company(company_id)) or (select private.is_admin()));

drop policy if exists applications_select_allowed on public.applications;
create policy applications_select_allowed on public.applications
  for select to authenticated
  using (
    candidate_id = (select auth.uid())
    or (select private.owns_job(job_id))
    or (select private.is_admin())
  );

drop policy if exists applications_insert_candidate_for_published_job on public.applications;
create policy applications_insert_candidate_for_published_job on public.applications
  for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and length(trim(cv_path)) > 0
    and status = 'submitted'::public.application_status
    and (select private.current_user_role()) = 'candidate'::public.user_role
    and (select private.candidate_owns_cv_path(public.applications.cv_path))
    and exists (
      select 1
      from public.jobs
      join public.companies on public.companies.id = public.jobs.company_id
      where public.jobs.id = public.applications.job_id
        and public.jobs.status = 'published'::public.job_status
        and public.companies.status = 'verified'::public.company_status
    )
  );

drop policy if exists applications_update_recruiter_or_admin on public.applications;
create policy applications_update_recruiter_or_admin on public.applications
  for update to authenticated
  using ((select private.owns_job(job_id)) or (select private.is_admin()))
  with check ((select private.owns_job(job_id)) or (select private.is_admin()));

drop policy if exists applications_delete_admin on public.applications;
create policy applications_delete_admin on public.applications
  for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists saved_jobs_select_own_or_admin on public.saved_jobs;
create policy saved_jobs_select_own_or_admin on public.saved_jobs
  for select to authenticated
  using (candidate_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists saved_jobs_delete_own_or_admin on public.saved_jobs;
create policy saved_jobs_delete_own_or_admin on public.saved_jobs
  for delete to authenticated
  using (candidate_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists job_alerts_select_own_or_admin on public.job_alerts;
create policy job_alerts_select_own_or_admin on public.job_alerts
  for select to authenticated
  using (candidate_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists job_alerts_insert_own on public.job_alerts;
create policy job_alerts_insert_own on public.job_alerts
  for insert to authenticated
  with check (candidate_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists job_alerts_update_own_or_admin on public.job_alerts;
create policy job_alerts_update_own_or_admin on public.job_alerts
  for update to authenticated
  using (candidate_id = (select auth.uid()) or (select private.is_admin()))
  with check (candidate_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists job_alerts_delete_own_or_admin on public.job_alerts;
create policy job_alerts_delete_own_or_admin on public.job_alerts
  for delete to authenticated
  using (candidate_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists subscriptions_select_owner_or_admin on public.subscriptions;
create policy subscriptions_select_owner_or_admin on public.subscriptions
  for select to authenticated
  using ((select private.owns_company(company_id)) or (select private.is_admin()));

drop policy if exists subscriptions_insert_owner_or_admin on public.subscriptions;
create policy subscriptions_insert_owner_or_admin on public.subscriptions
  for insert to authenticated
  with check (
    (select private.is_admin())
    or (
      plan = 'free'
      and status = 'active'
      and job_quota = 2
      and cv_access_enabled = false
      and exists (
        select 1
        from public.companies
        where public.companies.id = public.subscriptions.company_id
          and public.companies.owner_id = (select auth.uid())
      )
    )
  );

drop policy if exists subscriptions_update_owner_or_admin on public.subscriptions;
create policy subscriptions_update_owner_or_admin on public.subscriptions
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists plan_change_requests_insert_owner on public.plan_change_requests;
create policy plan_change_requests_insert_owner on public.plan_change_requests
  for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and (select private.owns_company(company_id))
  );

drop policy if exists plan_change_requests_select_owner_or_admin on public.plan_change_requests;
create policy plan_change_requests_select_owner_or_admin on public.plan_change_requests
  for select to authenticated
  using ((select private.is_admin()) or (select private.owns_company(company_id)));

drop policy if exists plan_change_requests_update_owner_cancel_or_admin on public.plan_change_requests;
create policy plan_change_requests_update_owner_cancel_or_admin on public.plan_change_requests
  for update to authenticated
  using ((select private.is_admin()) or (select private.owns_company(company_id)))
  with check (
    (select private.is_admin())
    or ((select private.owns_company(company_id)) and status = 'canceled')
  );

drop policy if exists admin_reviews_select_admin on public.admin_reviews;
create policy admin_reviews_select_admin on public.admin_reviews
  for select to authenticated
  using ((select private.is_admin()));

drop policy if exists admin_reviews_insert_admin on public.admin_reviews;
create policy admin_reviews_insert_admin on public.admin_reviews
  for insert to authenticated
  with check ((select private.is_admin()) and reviewer_id = (select auth.uid()));

drop policy if exists cvs_select_owner_or_admin on storage.objects;
create policy cvs_select_owner_or_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists cvs_select_applicant_owner_recruiter_or_admin on storage.objects;
create policy cvs_select_applicant_owner_recruiter_or_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cvs'
    and (select private.can_read_cv_object(storage.objects.name))
  );

drop policy if exists cvs_update_owner_or_admin on storage.objects;
create policy cvs_update_owner_or_admin on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  )
  with check (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists cvs_delete_owner_or_admin on storage.objects;
create policy cvs_delete_owner_or_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists company_media_insert_owner_or_admin on storage.objects;
create policy company_media_insert_owner_or_admin on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('company-logos', 'company-covers')
    and (
      (select private.is_admin())
      or (select private.owns_company(private.safe_uuid((storage.foldername(name))[1])))
    )
  );

drop policy if exists company_media_update_owner_or_admin on storage.objects;
create policy company_media_update_owner_or_admin on storage.objects
  for update to authenticated
  using (
    bucket_id in ('company-logos', 'company-covers')
    and (
      (select private.is_admin())
      or (select private.owns_company(private.safe_uuid((storage.foldername(name))[1])))
    )
  )
  with check (
    bucket_id in ('company-logos', 'company-covers')
    and (
      (select private.is_admin())
      or (select private.owns_company(private.safe_uuid((storage.foldername(name))[1])))
    )
  );

drop policy if exists company_media_delete_owner_or_admin on storage.objects;
create policy company_media_delete_owner_or_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('company-logos', 'company-covers')
    and (
      (select private.is_admin())
      or (select private.owns_company(private.safe_uuid((storage.foldername(name))[1])))
    )
  );

create or replace function public.review_job(
  job_uuid uuid,
  review_decision text,
  review_note text default null
)
returns table(slug text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  job_record public.jobs%rowtype;
  next_status public.job_status;
  company_status public.company_status;
  normalized_review_note text;
begin
  if not private.is_admin() then
    raise exception 'Only admins can review jobs';
  end if;

  if review_decision not in ('approve', 'reject') then
    raise exception 'Unsupported review decision';
  end if;

  normalized_review_note := nullif(trim(coalesce(review_note, '')), '');

  if review_decision = 'reject' and normalized_review_note is null then
    raise exception 'A rejection note is required';
  end if;

  select *
  into job_record
  from public.jobs
  where id = job_uuid
  for update;

  if not found then
    raise exception 'Job not found';
  end if;

  if job_record.status <> 'pending_review' then
    raise exception 'Job is not waiting for review';
  end if;

  if review_decision = 'approve' then
    select status
    into company_status
    from public.companies
    where id = job_record.company_id
    for update;

    if company_status <> 'verified' then
      raise exception 'Company must be verified before publishing a job';
    end if;
  end if;

  next_status := case
    when review_decision = 'approve' then 'published'::public.job_status
    else 'rejected'::public.job_status
  end;

  update public.jobs
  set
    status = next_status,
    published_at = case when next_status = 'published' then now() else null end
  where id = job_uuid;

  insert into public.admin_reviews (reviewer_id, target_table, target_id, decision, note)
  values ((select auth.uid()), 'jobs', job_uuid, review_decision, normalized_review_note);

  slug := job_record.slug;
  return next;
end;
$$;

create or replace function public.review_company(
  company_uuid uuid,
  review_decision text,
  review_note text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  company_record public.companies%rowtype;
  next_status public.company_status;
  normalized_review_note text;
begin
  if not private.is_admin() then
    raise exception 'Only admins can review companies';
  end if;

  if review_decision not in ('approve', 'reject') then
    raise exception 'Unsupported review decision';
  end if;

  normalized_review_note := nullif(trim(coalesce(review_note, '')), '');

  if review_decision = 'reject' and normalized_review_note is null then
    raise exception 'A rejection note is required';
  end if;

  select *
  into company_record
  from public.companies
  where id = company_uuid
  for update;

  if not found then
    raise exception 'Company not found';
  end if;

  if company_record.status <> 'pending_review' then
    raise exception 'Company is not waiting for review';
  end if;

  next_status := case
    when review_decision = 'approve' then 'verified'::public.company_status
    else 'rejected'::public.company_status
  end;

  update public.companies
  set status = next_status
  where id = company_uuid;

  insert into public.admin_reviews (reviewer_id, target_table, target_id, decision, note)
  values ((select auth.uid()), 'companies', company_uuid, review_decision, normalized_review_note);
end;
$$;

create or replace function public.review_plan_change_request(
  request_uuid uuid,
  review_decision text,
  review_note text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_record public.plan_change_requests%rowtype;
  next_status text;
  next_job_quota integer;
  next_cv_access_enabled boolean;
begin
  if not private.is_admin() then
    raise exception 'Only admins can review plan change requests';
  end if;

  if review_decision not in ('approve', 'reject') then
    raise exception 'Unsupported plan review decision';
  end if;

  if review_decision = 'reject' and nullif(trim(coalesce(review_note, '')), '') is null then
    raise exception 'A rejection note is required';
  end if;

  select *
  into request_record
  from public.plan_change_requests
  where id = request_uuid
  for update;

  if not found then
    raise exception 'Plan change request not found';
  end if;

  if request_record.status <> 'pending' then
    raise exception 'Plan change request is not pending';
  end if;

  if review_decision = 'approve' then
    case request_record.requested_plan
      when 'free' then
        next_job_quota := 2;
        next_cv_access_enabled := false;
      when 'starter' then
        next_job_quota := 10;
        next_cv_access_enabled := false;
      when 'booster' then
        next_job_quota := 999;
        next_cv_access_enabled := true;
      when 'agency' then
        next_job_quota := 999;
        next_cv_access_enabled := true;
      else
        raise exception 'Unsupported subscription plan';
    end case;

    insert into public.subscriptions (
      company_id,
      plan,
      status,
      job_quota,
      cv_access_enabled,
      updated_at
    )
    values (
      request_record.company_id,
      request_record.requested_plan,
      'active',
      next_job_quota,
      next_cv_access_enabled,
      now()
    )
    on conflict (company_id) do update
    set
      plan = excluded.plan,
      status = excluded.status,
      job_quota = excluded.job_quota,
      cv_access_enabled = excluded.cv_access_enabled,
      updated_at = excluded.updated_at;
  end if;

  next_status := case when review_decision = 'approve' then 'approved' else 'rejected' end;

  update public.plan_change_requests
  set
    status = next_status,
    reviewed_by = (select auth.uid()),
    review_note = nullif(trim(review_note), ''),
    reviewed_at = now(),
    updated_at = now()
  where id = request_uuid
    and status = 'pending';

  if not found then
    raise exception 'Plan change request was already processed';
  end if;
end;
$$;

revoke all on function public.current_user_role() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.owns_company(uuid) from public, anon, authenticated;
revoke all on function public.owns_job(uuid) from public, anon, authenticated;
revoke all on function public.safe_uuid(text) from public, anon, authenticated;
revoke all on function public.current_recruiter_has_cv_access() from public, anon, authenticated;
revoke all on function public.can_read_cv_object(text) from public, anon, authenticated;
revoke all on function public.candidate_owns_cv_path(text) from public, anon, authenticated;

revoke all on function public.review_company(uuid, text, text) from public, anon;
revoke all on function public.review_job(uuid, text, text) from public, anon;
revoke all on function public.review_plan_change_request(uuid, text, text) from public, anon;
grant execute on function public.review_company(uuid, text, text) to authenticated;
grant execute on function public.review_job(uuid, text, text) to authenticated;
grant execute on function public.review_plan_change_request(uuid, text, text) to authenticated;
