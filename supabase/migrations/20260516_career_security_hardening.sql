-- 20260516_career_security_hardening

do $$
begin
  if to_regclass('public.companies') is null then
    raise exception 'Missing prerequisite table: public.companies';
  end if;

  if to_regclass('public.jobs') is null then
    raise exception 'Missing prerequisite table: public.jobs';
  end if;

  if to_regclass('public.company_connect_profiles') is null then
    raise exception 'Missing prerequisite table: public.company_connect_profiles';
  end if;

  if to_regprocedure('private.current_user_role()') is null then
    raise exception 'Missing prerequisite function: private.current_user_role()';
  end if;
end;
$$;

alter table public.candidate_profiles
  add column if not exists cv_library_opt_in boolean not null default false;

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
      and private.current_user_role() = 'recruiter'::public.user_role
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
      and private.current_user_role() = 'recruiter'::public.user_role
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
        and private.current_user_role() = 'recruiter'::public.user_role
    )
    or (
      (select private.current_recruiter_has_cv_access())
      and exists (
        select 1
        from public.candidate_profiles
        where public.candidate_profiles.cv_path = object_name
          and public.candidate_profiles.cv_library_opt_in = true
      )
    )
$$;

drop policy if exists candidate_profiles_select_allowed on public.candidate_profiles;
create policy candidate_profiles_select_allowed on public.candidate_profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_admin())
    or (
      cv_library_opt_in = true
      and (select private.current_recruiter_has_cv_access())
    )
    or exists (
      select 1
      from public.applications
      where public.applications.candidate_id = public.candidate_profiles.user_id
        and (select private.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_experiences_select_allowed on public.candidate_experiences;
create policy candidate_experiences_select_allowed on public.candidate_experiences
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
    or (
      (select private.current_recruiter_has_cv_access())
      and exists (
        select 1
        from public.candidate_profiles
        where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
          and public.candidate_profiles.cv_library_opt_in = true
      )
    )
    or exists (
      select 1
      from public.candidate_profiles
      join public.applications on public.applications.candidate_id = public.candidate_profiles.user_id
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and (select private.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_educations_select_allowed on public.candidate_educations;
create policy candidate_educations_select_allowed on public.candidate_educations
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
    or (
      (select private.current_recruiter_has_cv_access())
      and exists (
        select 1
        from public.candidate_profiles
        where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
          and public.candidate_profiles.cv_library_opt_in = true
      )
    )
    or exists (
      select 1
      from public.candidate_profiles
      join public.applications on public.applications.candidate_id = public.candidate_profiles.user_id
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and (select private.owns_job(public.applications.job_id))
    )
  );

drop policy if exists candidate_skills_select_allowed on public.candidate_skills;
create policy candidate_skills_select_allowed on public.candidate_skills
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
    or (
      (select private.current_recruiter_has_cv_access())
      and exists (
        select 1
        from public.candidate_profiles
        where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
          and public.candidate_profiles.cv_library_opt_in = true
      )
    )
    or exists (
      select 1
      from public.candidate_profiles
      join public.applications on public.applications.candidate_id = public.candidate_profiles.user_id
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and (select private.owns_job(public.applications.job_id))
    )
  );

drop policy if exists companies_select_public_owned_or_admin on public.companies;
drop policy if exists companies_select_verified_owned_or_admin on public.companies;
drop policy if exists companies_select_verified_public on public.companies;
drop policy if exists companies_select_recruiter_owned_or_admin on public.companies;
create policy companies_select_verified_public on public.companies
  for select to anon, authenticated
  using (status = 'verified'::public.company_status);

create policy companies_select_recruiter_owned_or_admin on public.companies
  for select to authenticated
  using (
    (owner_id = (select auth.uid()) and private.current_user_role() = 'recruiter'::public.user_role)
    or (select private.is_admin())
  );

drop policy if exists companies_insert_owner_or_admin on public.companies;
create policy companies_insert_owner_or_admin on public.companies
  for insert to authenticated
  with check (
    (
      owner_id = (select auth.uid())
      and status = 'incomplete'::public.company_status
      and private.current_user_role() = 'recruiter'::public.user_role
    )
    or (select private.is_admin())
  );

drop policy if exists companies_update_owner_or_admin on public.companies;
create policy companies_update_owner_or_admin on public.companies
  for update to authenticated
  using (
    (owner_id = (select auth.uid()) and private.current_user_role() = 'recruiter'::public.user_role)
    or (select private.is_admin())
  )
  with check (
    (owner_id = (select auth.uid()) and private.current_user_role() = 'recruiter'::public.user_role)
    or (select private.is_admin())
  );

drop policy if exists jobs_select_public_owned_or_admin on public.jobs;
drop policy if exists jobs_select_published_owned_or_admin on public.jobs;
drop policy if exists jobs_select_public_published_verified on public.jobs;
drop policy if exists jobs_select_recruiter_owned_or_admin on public.jobs;
create policy jobs_select_public_published_verified on public.jobs
  for select to anon, authenticated
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
  using ((select private.owns_company(public.jobs.company_id)) or (select private.is_admin()));

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
      and (select private.owns_company(company_id))
    )
  );

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

with ranked_pending_plan_requests as (
  select
    id,
    row_number() over (
      partition by company_id
      order by requested_at asc, created_at asc, id asc
    ) as request_rank
  from public.plan_change_requests
  where status = 'pending'
)
update public.plan_change_requests
set
  status = 'canceled',
  review_note = coalesce(review_note, 'Duplicate pending request canceled during career security hardening.'),
  updated_at = now()
where id in (
  select id
  from ranked_pending_plan_requests
  where request_rank > 1
);

create unique index if not exists plan_change_requests_one_pending_per_company_idx
  on public.plan_change_requests (company_id)
  where status = 'pending';

drop policy if exists admin_reviews_select_admin on public.admin_reviews;
drop policy if exists admin_reviews_select_owner_or_admin on public.admin_reviews;
drop policy if exists admin_reviews_select_admin_or_owner on public.admin_reviews;
create policy admin_reviews_select_admin_or_owner on public.admin_reviews
  for select to authenticated
  using (
    (select private.is_admin())
    or (
      target_table = 'companies'
      and (select private.owns_company(public.admin_reviews.target_id))
    )
    or (
      target_table = 'jobs'
      and (select private.owns_job(public.admin_reviews.target_id))
    )
  );

create or replace function private.protect_company_connect_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()) = 'service_role', false)
    or session_user in ('postgres', 'supabase_admin')
    or private.is_admin() then
    return new;
  end if;

  if new.cv_path not like new.company_id::text || '/%' then
    raise exception 'company connect cv path must stay inside the company folder';
  end if;

  if tg_op = 'UPDATE' and (
    new.company_id is distinct from old.company_id
    or new.candidate_id is distinct from old.candidate_id
    or new.cv_path is distinct from old.cv_path
  ) then
    raise exception 'company connect cv identity cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_company_connect_profile_identity on public.company_connect_profiles;
create trigger protect_company_connect_profile_identity
  before insert or update on public.company_connect_profiles
  for each row execute function private.protect_company_connect_profile_identity();

drop policy if exists company_connect_profiles_update_owner_or_admin on public.company_connect_profiles;
create policy company_connect_profiles_update_owner_or_admin on public.company_connect_profiles
  for update to authenticated
  using (
    (select private.is_admin())
    or (select private.owns_company(public.company_connect_profiles.company_id))
  )
  with check (
    cv_path like company_id::text || '/%'
    and (
      (select private.is_admin())
      or (select private.owns_company(public.company_connect_profiles.company_id))
    )
  );

create or replace function private.can_read_company_connect_cv_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.is_admin())
    or exists (
      select 1
      from public.company_connect_profiles
      where public.company_connect_profiles.cv_path = object_name
        and object_name like public.company_connect_profiles.company_id::text || '/%'
        and (storage.foldername(object_name))[1] = public.company_connect_profiles.company_id::text
        and (select private.owns_company(public.company_connect_profiles.company_id))
    )
$$;

drop policy if exists company_connect_cvs_insert_public on storage.objects;
create policy company_connect_cvs_insert_public on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'company-connect-cvs'
    and exists (
      select 1
      from public.companies
      where public.companies.id = case
        when (storage.foldername(storage.objects.name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(storage.objects.name))[1])::uuid
        else null
      end
        and public.companies.status = 'verified'::public.company_status
        and public.companies.career_connect_enabled = true
    )
  );

drop policy if exists company_connect_cvs_select_owner_or_admin on storage.objects;
create policy company_connect_cvs_select_owner_or_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'company-connect-cvs'
    and (select private.can_read_company_connect_cv_object(storage.objects.name))
  );

drop policy if exists company_connect_cvs_update_owner_or_admin on storage.objects;
create policy company_connect_cvs_update_owner_or_admin on storage.objects
  for update to authenticated
  using (
    bucket_id = 'company-connect-cvs'
    and (select private.can_read_company_connect_cv_object(storage.objects.name))
  )
  with check (
    bucket_id = 'company-connect-cvs'
    and (select private.can_read_company_connect_cv_object(storage.objects.name))
  );

drop policy if exists company_connect_cvs_delete_owner_or_admin on storage.objects;
create policy company_connect_cvs_delete_owner_or_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'company-connect-cvs'
    and (select private.can_read_company_connect_cv_object(storage.objects.name))
  );

create or replace function private.protect_verified_company_public_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()) = 'service_role', false)
    or session_user in ('postgres', 'supabase_admin')
    or private.is_admin() then
    return new;
  end if;

  if old.status = 'verified'::public.company_status and (
    new.name is distinct from old.name
    or new.slug is distinct from old.slug
    or new.sector is distinct from old.sector
    or new.city is distinct from old.city
    or new.website is distinct from old.website
    or new.description is distinct from old.description
    or new.logo_path is distinct from old.logo_path
    or new.cover_path is distinct from old.cover_path
    or new.size_label is distinct from old.size_label
    or new.career_headline is distinct from old.career_headline
    or new.career_intro is distinct from old.career_intro
    or new.career_values is distinct from old.career_values
    or new.career_benefits is distinct from old.career_benefits
    or new.career_gallery_paths is distinct from old.career_gallery_paths
    or new.career_connect_enabled is distinct from old.career_connect_enabled
    or new.career_connect_title is distinct from old.career_connect_title
    or new.career_connect_description is distinct from old.career_connect_description
  ) then
    new.status := 'pending_review'::public.company_status;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_verified_company_public_content on public.companies;
create trigger protect_verified_company_public_content
  before update of name, slug, sector, city, website, description, logo_path, cover_path,
    size_label, career_headline, career_intro, career_values, career_benefits,
    career_gallery_paths, career_connect_enabled, career_connect_title, career_connect_description
  on public.companies
  for each row execute function private.protect_verified_company_public_content();

create or replace function private.protect_published_job_public_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()) = 'service_role', false)
    or session_user in ('postgres', 'supabase_admin')
    or private.is_admin() then
    return new;
  end if;

  if old.status = 'published'::public.job_status
    and new.status <> 'archived'::public.job_status
    and (
      new.company_id is distinct from old.company_id
      or new.title is distinct from old.title
      or new.slug is distinct from old.slug
      or new.contract is distinct from old.contract
      or new.city is distinct from old.city
      or new.sector is distinct from old.sector
      or new.salary_range is distinct from old.salary_range
      or new.location_detail is distinct from old.location_detail
      or new.summary is distinct from old.summary
      or new.description is distinct from old.description
      or new.missions is distinct from old.missions
      or new.profile is distinct from old.profile
      or new.expires_at is distinct from old.expires_at
      or new.published_at is distinct from old.published_at
    ) then
    new.status := 'pending_review'::public.job_status;
    new.published_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_published_job_public_content on public.jobs;
create trigger protect_published_job_public_content
  before update of company_id, title, slug, contract, city, sector, salary_range,
    location_detail, summary, description, missions, profile, expires_at, published_at
  on public.jobs
  for each row execute function private.protect_published_job_public_content();

revoke all on function private.owns_company(uuid) from public, anon;
revoke all on function private.owns_job(uuid) from public, anon;
revoke all on function private.can_read_cv_object(text) from public, anon;
revoke all on function private.can_read_company_connect_cv_object(text) from public, anon;
grant execute on function private.owns_company(uuid) to authenticated;
grant execute on function private.owns_job(uuid) to authenticated;
grant execute on function private.can_read_cv_object(text) to authenticated;
grant execute on function private.can_read_company_connect_cv_object(text) to authenticated;
