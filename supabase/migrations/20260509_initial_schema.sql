create extension if not exists "pgcrypto";

do $$
begin
  create type public.user_role as enum ('candidate', 'recruiter', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.job_status as enum ('draft', 'pending_review', 'published', 'rejected', 'expired', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.company_status as enum ('incomplete', 'pending_review', 'verified', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.application_status as enum ('submitted', 'viewed', 'shortlisted', 'rejected', 'interview', 'hired');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.skill_kind as enum ('hard', 'soft', 'language');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  display_name text not null default '',
  email text not null,
  phone text,
  onboarding_completion integer not null default 0 check (onboarding_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  city text,
  sector text,
  desired_role text,
  salary_expectation text,
  cv_path text,
  profile_completion integer not null default 0 check (profile_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  title text not null default '',
  company text not null default '',
  city text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_educations (
  id uuid primary key default gen_random_uuid(),
  candidate_profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  school text not null default '',
  degree text not null default '',
  field text,
  city text,
  start_date date,
  end_date date,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_skills (
  id uuid primary key default gen_random_uuid(),
  candidate_profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  kind public.skill_kind not null,
  label text not null,
  level text,
  created_at timestamptz not null default now(),
  unique (candidate_profile_id, kind, label)
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  sector text,
  city text,
  website text,
  description text,
  logo_path text,
  cover_path text,
  status public.company_status not null default 'incomplete',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  slug text not null unique,
  contract text not null,
  city text not null,
  sector text not null,
  salary_range text,
  location_detail text,
  internal_reference text,
  summary text not null default '',
  description text not null default '',
  missions text not null default '',
  profile text not null default '',
  is_featured boolean not null default false,
  is_urgent boolean not null default false,
  status public.job_status not null default 'draft',
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  cv_path text not null,
  message text,
  status public.application_status not null default 'submitted',
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (candidate_id, job_id)
);

create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  query text not null default '',
  sector text,
  city text,
  contract text,
  frequency text not null default 'daily',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  job_quota integer not null default 2 check (job_quota >= 0),
  cv_access_enabled boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_change_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requested_plan text not null check (requested_plan in ('free', 'starter', 'booster', 'agency')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'canceled')),
  requested_by uuid not null references public.profiles(id) on delete cascade,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  target_table text not null check (target_table in ('jobs', 'companies')),
  target_id uuid not null,
  decision text not null check (decision in ('approve', 'reject')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists candidate_experiences_candidate_profile_id_idx on public.candidate_experiences (candidate_profile_id);
create index if not exists candidate_educations_candidate_profile_id_idx on public.candidate_educations (candidate_profile_id);
create index if not exists candidate_skills_candidate_profile_id_idx on public.candidate_skills (candidate_profile_id);
create index if not exists companies_owner_id_idx on public.companies (owner_id);
create index if not exists companies_status_idx on public.companies (status);
create index if not exists jobs_company_id_idx on public.jobs (company_id);
create index if not exists jobs_status_published_at_idx on public.jobs (status, published_at desc);
create index if not exists jobs_city_idx on public.jobs (city);
create index if not exists jobs_contract_idx on public.jobs (contract);
create index if not exists jobs_sector_idx on public.jobs (sector);
create index if not exists applications_candidate_id_idx on public.applications (candidate_id);
create index if not exists applications_job_id_idx on public.applications (job_id);
create index if not exists saved_jobs_candidate_id_idx on public.saved_jobs (candidate_id);
create index if not exists saved_jobs_job_id_idx on public.saved_jobs (job_id);
create index if not exists job_alerts_candidate_id_idx on public.job_alerts (candidate_id);
create index if not exists plan_change_requests_company_id_idx on public.plan_change_requests (company_id);
create index if not exists plan_change_requests_status_idx on public.plan_change_requests (status, requested_at desc);
create index if not exists admin_reviews_reviewer_id_idx on public.admin_reviews (reviewer_id);
create index if not exists admin_reviews_target_idx on public.admin_reviews (target_table, target_id);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.owns_company(company_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies
    where id = company_uuid
      and owner_id = (select auth.uid())
  )
$$;

create or replace function public.owns_job(job_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs
    join public.companies on public.companies.id = public.jobs.company_id
    where public.jobs.id = job_uuid
      and public.companies.owner_id = (select auth.uid())
  )
$$;

create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce((select auth.role()) = 'service_role', false)
    or session_user in ('postgres', 'supabase_admin')
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.role = 'admin' then
    raise exception 'Admin profiles must be created by an administrator';
  end if;

  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    raise exception 'Profile role cannot be changed by this user';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before insert or update of role on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.protect_company_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.status <> 'incomplete' then
    raise exception 'Company moderation status is admin-managed';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status in ('incomplete', 'rejected')
      and new.status = 'pending_review'
      and new.owner_id = old.owner_id
      and new.owner_id = (select auth.uid()) then
      return new;
    end if;

    raise exception 'Company moderation status is admin-managed';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_company_moderation_fields on public.companies;
create trigger protect_company_moderation_fields
  before insert or update of status on public.companies
  for each row execute function public.protect_company_moderation_fields();

create or replace function public.protect_job_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'pending_review') or new.is_featured or new.is_urgent then
      raise exception 'Job moderation fields are admin-managed';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status and new.status not in ('draft', 'pending_review', 'archived') then
      raise exception 'Job moderation status is admin-managed';
    end if;

    if new.is_featured is distinct from old.is_featured or new.is_urgent is distinct from old.is_urgent then
      raise exception 'Job visibility boosts are admin-managed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_job_moderation_fields on public.jobs;
create trigger protect_job_moderation_fields
  before insert or update of status, is_featured, is_urgent on public.jobs
  for each row execute function public.protect_job_moderation_fields();

create or replace function public.protect_subscription_entitlements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT'
    and new.plan = 'free'
    and new.status = 'active'
    and new.job_quota = 2
    and new.cv_access_enabled = false
    and public.owns_company(new.company_id) then
    return new;
  end if;

  raise exception 'Subscription entitlements are admin-managed';
end;
$$;

drop trigger if exists protect_subscription_entitlements on public.subscriptions;
create trigger protect_subscription_entitlements
  before insert or update on public.subscriptions
  for each row execute function public.protect_subscription_entitlements();

create or replace function public.protect_application_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if new.job_id is distinct from old.job_id
    or new.candidate_id is distinct from old.candidate_id
    or new.cv_path is distinct from old.cv_path
    or new.message is distinct from old.message then
    raise exception 'Application ownership and submitted content cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_application_identity on public.applications;
create trigger protect_application_identity
  before update on public.applications
  for each row execute function public.protect_application_identity();

create or replace function public.review_job(
  job_uuid uuid,
  review_decision text,
  review_note text default null
)
returns table(slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  job_record public.jobs%rowtype;
  next_status text;
  company_status text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review jobs';
  end if;

  if review_decision not in ('approve', 'reject') then
    raise exception 'Unsupported review decision';
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

  next_status := case when review_decision = 'approve' then 'published' else 'rejected' end;

  update public.jobs
  set
    status = next_status,
    published_at = case when next_status = 'published' then now() else null end
  where id = job_uuid;

  insert into public.admin_reviews (reviewer_id, target_table, target_id, decision, note)
  values ((select auth.uid()), 'jobs', job_uuid, review_decision, nullif(trim(review_note), ''));

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
security definer
set search_path = public
as $$
declare
  company_record public.companies%rowtype;
  next_status text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review companies';
  end if;

  if review_decision not in ('approve', 'reject') then
    raise exception 'Unsupported review decision';
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

  next_status := case when review_decision = 'approve' then 'verified' else 'rejected' end;

  update public.companies
  set status = next_status
  where id = company_uuid;

  insert into public.admin_reviews (reviewer_id, target_table, target_id, decision, note)
  values ((select auth.uid()), 'companies', company_uuid, review_decision, nullif(trim(review_note), ''));
end;
$$;

alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.candidate_experiences enable row level security;
alter table public.candidate_educations enable row level security;
alter table public.candidate_skills enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_alerts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.plan_change_requests enable row level security;
alter table public.admin_reviews enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where policyname = any (array[
      'profiles_select_own_or_admin',
      'profiles_insert_own',
      'profiles_update_own_or_admin',
      'candidate_profiles_select_allowed',
      'candidate_profiles_insert_own',
      'candidate_profiles_update_own_or_admin',
      'candidate_profiles_delete_admin',
      'candidate_experiences_select_allowed',
      'candidate_experiences_write_own_or_admin',
      'candidate_educations_select_allowed',
      'candidate_educations_write_own_or_admin',
      'candidate_skills_select_allowed',
      'candidate_skills_write_own_or_admin',
      'companies_select_public_owned_or_admin',
      'companies_insert_owner_or_admin',
      'companies_update_owner_or_admin',
      'companies_delete_admin',
      'jobs_select_public_owned_or_admin',
      'jobs_insert_owned_company_or_admin',
      'jobs_update_owned_company_or_admin',
      'jobs_delete_owned_company_or_admin',
      'applications_select_allowed',
      'applications_insert_candidate_for_published_job',
      'applications_update_recruiter_or_admin',
      'applications_delete_admin',
      'saved_jobs_select_own_or_admin',
      'saved_jobs_insert_own_published',
      'saved_jobs_delete_own_or_admin',
      'job_alerts_select_own_or_admin',
      'job_alerts_insert_own',
      'job_alerts_update_own_or_admin',
      'job_alerts_delete_own_or_admin',
      'subscriptions_select_owner_or_admin',
      'subscriptions_insert_owner_or_admin',
      'subscriptions_update_owner_or_admin',
      'plan_change_requests_select_owner_or_admin',
      'plan_change_requests_insert_owner',
      'plan_change_requests_update_owner_cancel_or_admin',
      'admin_reviews_select_admin',
      'admin_reviews_select_owner_or_admin',
      'admin_reviews_insert_admin',
      'cvs_select_owner_or_admin',
      'cvs_select_owner_recruiter_or_admin',
      'cvs_select_applicant_owner_recruiter_or_admin',
      'cvs_insert_owner',
      'cvs_update_owner_or_admin',
      'cvs_delete_owner_or_admin',
      'company_media_public_read',
      'company_media_insert_owner_or_admin',
      'company_media_update_owner_or_admin',
      'company_media_delete_owner_or_admin'
    ])
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  end loop;
end $$;

create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((id = (select auth.uid()) and role <> 'admin') or (select public.is_admin()));

create policy profiles_update_own_or_admin on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy candidate_profiles_select_allowed on public.candidate_profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1
      from public.applications
      where public.applications.candidate_id = public.candidate_profiles.user_id
        and (select public.owns_job(public.applications.job_id))
    )
  );

create policy candidate_profiles_insert_own on public.candidate_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy candidate_profiles_update_own_or_admin on public.candidate_profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy candidate_profiles_delete_admin on public.candidate_profiles
  for delete to authenticated
  using ((select public.is_admin()));

create policy candidate_experiences_select_allowed on public.candidate_experiences
  for select to authenticated
  using (
    (select public.is_admin())
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

create policy candidate_experiences_write_own_or_admin on public.candidate_experiences
  for all to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_experiences.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

create policy candidate_educations_select_allowed on public.candidate_educations
  for select to authenticated
  using (
    (select public.is_admin())
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

create policy candidate_educations_write_own_or_admin on public.candidate_educations
  for all to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_educations.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

create policy candidate_skills_select_allowed on public.candidate_skills
  for select to authenticated
  using (
    (select public.is_admin())
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

create policy candidate_skills_write_own_or_admin on public.candidate_skills
  for all to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_admin())
    or exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.id = public.candidate_skills.candidate_profile_id
        and public.candidate_profiles.user_id = (select auth.uid())
    )
  );

create policy companies_select_public_owned_or_admin on public.companies
  for select to anon, authenticated
  using (status = 'verified' or owner_id = (select auth.uid()) or (select public.is_admin()));

create policy companies_insert_owner_or_admin on public.companies
  for insert to authenticated
  with check (
    (owner_id = (select auth.uid()) and status = 'incomplete')
    or (select public.is_admin())
  );

create policy companies_update_owner_or_admin on public.companies
  for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.is_admin()));

create policy companies_delete_admin on public.companies
  for delete to authenticated
  using ((select public.is_admin()));

create policy jobs_select_public_owned_or_admin on public.jobs
  for select to anon, authenticated
  using (
    (
      status = 'published'
      and exists (
        select 1
        from public.companies
        where public.companies.id = public.jobs.company_id
          and public.companies.status = 'verified'
      )
    )
    or (select public.owns_company(company_id))
    or (select public.is_admin())
  );

create policy jobs_insert_owned_company_or_admin on public.jobs
  for insert to authenticated
  with check (
    (
      (select public.owns_company(company_id))
      and status in ('draft', 'pending_review')
      and is_featured = false
      and is_urgent = false
    )
    or (select public.is_admin())
  );

create policy jobs_update_owned_company_or_admin on public.jobs
  for update to authenticated
  using ((select public.owns_company(company_id)) or (select public.is_admin()))
  with check ((select public.owns_company(company_id)) or (select public.is_admin()));

create policy jobs_delete_owned_company_or_admin on public.jobs
  for delete to authenticated
  using ((select public.owns_company(company_id)) or (select public.is_admin()));

create policy applications_select_allowed on public.applications
  for select to authenticated
  using (
    candidate_id = (select auth.uid())
    or (select public.owns_job(job_id))
    or (select public.is_admin())
  );

create policy applications_insert_candidate_for_published_job on public.applications
  for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and length(trim(cv_path)) > 0
    and status = 'submitted'
    and (select public.current_user_role()) = 'candidate'
    and exists (
      select 1
      from public.candidate_profiles
      where public.candidate_profiles.user_id = (select auth.uid())
        and public.candidate_profiles.cv_path = public.applications.cv_path
        and public.applications.cv_path like (select auth.uid())::text || '/%'
    )
    and exists (
      select 1
      from public.jobs
      join public.companies on public.companies.id = public.jobs.company_id
      where public.jobs.id = public.applications.job_id
        and public.jobs.status = 'published'
        and public.companies.status = 'verified'
    )
  );

create policy applications_update_recruiter_or_admin on public.applications
  for update to authenticated
  using ((select public.owns_job(job_id)) or (select public.is_admin()))
  with check ((select public.owns_job(job_id)) or (select public.is_admin()));

create policy applications_delete_admin on public.applications
  for delete to authenticated
  using ((select public.is_admin()));

create policy saved_jobs_select_own_or_admin on public.saved_jobs
  for select to authenticated
  using (candidate_id = (select auth.uid()) or (select public.is_admin()));

create policy saved_jobs_insert_own_published on public.saved_jobs
  for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and exists (
      select 1
      from public.jobs
      join public.companies on public.companies.id = public.jobs.company_id
      where public.jobs.id = public.saved_jobs.job_id
        and public.jobs.status = 'published'
        and public.companies.status = 'verified'
    )
  );

create policy saved_jobs_delete_own_or_admin on public.saved_jobs
  for delete to authenticated
  using (candidate_id = (select auth.uid()) or (select public.is_admin()));

create policy job_alerts_select_own_or_admin on public.job_alerts
  for select to authenticated
  using (candidate_id = (select auth.uid()) or (select public.is_admin()));

create policy job_alerts_insert_own on public.job_alerts
  for insert to authenticated
  with check (candidate_id = (select auth.uid()) or (select public.is_admin()));

create policy job_alerts_update_own_or_admin on public.job_alerts
  for update to authenticated
  using (candidate_id = (select auth.uid()) or (select public.is_admin()))
  with check (candidate_id = (select auth.uid()) or (select public.is_admin()));

create policy job_alerts_delete_own_or_admin on public.job_alerts
  for delete to authenticated
  using (candidate_id = (select auth.uid()) or (select public.is_admin()));

create policy subscriptions_select_owner_or_admin on public.subscriptions
  for select to authenticated
  using ((select public.owns_company(company_id)) or (select public.is_admin()));

create policy subscriptions_insert_owner_or_admin on public.subscriptions
  for insert to authenticated
  with check ((select public.is_admin()));

create policy subscriptions_update_owner_or_admin on public.subscriptions
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy plan_change_requests_select_owner_or_admin on public.plan_change_requests
  for select to authenticated
  using ((select public.is_admin()) or (select public.owns_company(company_id)));

create policy plan_change_requests_insert_owner on public.plan_change_requests
  for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and (select public.owns_company(company_id))
  );

create policy plan_change_requests_update_owner_cancel_or_admin on public.plan_change_requests
  for update to authenticated
  using ((select public.is_admin()) or (select public.owns_company(company_id)))
  with check (
    (select public.is_admin())
    or ((select public.owns_company(company_id)) and status = 'canceled')
  );

create policy admin_reviews_select_owner_or_admin on public.admin_reviews
  for select to authenticated
  using (
    (select public.is_admin())
    or (
      target_table = 'companies'
      and exists (
        select 1
        from public.companies
        where public.companies.id = public.admin_reviews.target_id
          and public.companies.owner_id = (select auth.uid())
      )
    )
    or (
      target_table = 'jobs'
      and exists (
        select 1
        from public.jobs
        join public.companies on public.companies.id = public.jobs.company_id
        where public.jobs.id = public.admin_reviews.target_id
          and public.companies.owner_id = (select auth.uid())
      )
    )
  );

create policy admin_reviews_insert_admin on public.admin_reviews
  for insert to authenticated
  with check ((select public.is_admin()) and reviewer_id = (select auth.uid()));

insert into storage.buckets (id, name, public)
values
  ('cvs', 'cvs', false),
  ('company-logos', 'company-logos', true),
  ('company-covers', 'company-covers', true)
on conflict (id) do nothing;

create policy cvs_select_owner_or_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );

create policy cvs_select_applicant_owner_recruiter_or_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
      or exists (
        select 1
        from public.applications
        where public.applications.cv_path = storage.objects.name
          and (select public.owns_job(public.applications.job_id))
      )
    )
  );

create policy cvs_insert_owner on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy cvs_update_owner_or_admin on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  )
  with check (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );

create policy cvs_delete_owner_or_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );

create policy company_media_public_read on storage.objects
  for select to public
  using (bucket_id in ('company-logos', 'company-covers'));

create policy company_media_insert_owner_or_admin on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('company-logos', 'company-covers')
    and (
      (select public.is_admin())
      or (select public.owns_company(public.safe_uuid((storage.foldername(name))[1])))
    )
  );

create policy company_media_update_owner_or_admin on storage.objects
  for update to authenticated
  using (
    bucket_id in ('company-logos', 'company-covers')
    and (
      (select public.is_admin())
      or (select public.owns_company(public.safe_uuid((storage.foldername(name))[1])))
    )
  )
  with check (
    bucket_id in ('company-logos', 'company-covers')
    and (
      (select public.is_admin())
      or (select public.owns_company(public.safe_uuid((storage.foldername(name))[1])))
    )
  );

create policy company_media_delete_owner_or_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('company-logos', 'company-covers')
    and (
      (select public.is_admin())
      or (select public.owns_company(public.safe_uuid((storage.foldername(name))[1])))
    )
  );
