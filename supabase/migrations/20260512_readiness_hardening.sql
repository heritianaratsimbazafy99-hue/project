do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'Missing prerequisite table: public.profiles';
  end if;

  if to_regclass('public.companies') is null then
    raise exception 'Missing prerequisite table: public.companies';
  end if;

  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Missing prerequisite function: public.is_admin()';
  end if;

  if to_regprocedure('public.is_service_role()') is null then
    raise exception 'Missing prerequisite function: public.is_service_role()';
  end if;

  if to_regprocedure('public.owns_company(uuid)') is null then
    raise exception 'Missing prerequisite function: public.owns_company(uuid)';
  end if;
end;
$$;

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

alter table public.plan_change_requests enable row level security;

drop policy if exists plan_change_requests_select_owner_or_admin on public.plan_change_requests;
create policy plan_change_requests_select_owner_or_admin on public.plan_change_requests
  for select to authenticated
  using ((select public.is_admin()) or (select public.owns_company(company_id)));

drop policy if exists plan_change_requests_insert_owner on public.plan_change_requests;
create policy plan_change_requests_insert_owner on public.plan_change_requests
  for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and (select public.owns_company(company_id))
  );

drop policy if exists plan_change_requests_update_owner_cancel_or_admin on public.plan_change_requests;
create policy plan_change_requests_update_owner_cancel_or_admin on public.plan_change_requests
  for update to authenticated
  using ((select public.is_admin()) or (select public.owns_company(company_id)))
  with check (
    (select public.is_admin())
    or ((select public.owns_company(company_id)) and status = 'canceled')
  );

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'Profile identity is managed by authentication';
  end if;

  if new.email is distinct from old.email then
    raise exception 'Profile email is managed by authentication';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_system_fields on public.profiles;
create trigger protect_profile_system_fields
  before update on public.profiles
  for each row execute function public.protect_profile_system_fields();

create or replace function public.protect_plan_request_owner_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if old.status <> 'pending' or new.status <> 'canceled' then
    raise exception 'Only pending plan requests can be canceled by company owners';
  end if;

  if new.company_id is distinct from old.company_id
    or new.requested_plan is distinct from old.requested_plan
    or new.requested_by is distinct from old.requested_by
    or new.reviewed_by is distinct from old.reviewed_by
    or new.review_note is distinct from old.review_note
    or new.requested_at is distinct from old.requested_at
    or new.reviewed_at is distinct from old.reviewed_at
    or new.created_at is distinct from old.created_at then
    raise exception 'Plan request audit fields are admin-managed';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_plan_request_owner_cancel on public.plan_change_requests;
create trigger protect_plan_request_owner_cancel
  before update on public.plan_change_requests
  for each row execute function public.protect_plan_request_owner_cancel();

create index if not exists plan_change_requests_requested_by_idx
  on public.plan_change_requests (requested_by);

create index if not exists plan_change_requests_reviewed_by_idx
  on public.plan_change_requests (reviewed_by);

create index if not exists plan_change_requests_company_id_idx
  on public.plan_change_requests (company_id);

create index if not exists plan_change_requests_status_idx
  on public.plan_change_requests (status, requested_at desc);

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
where id = 'cvs';

update storage.buckets
set
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('company-logos', 'company-covers');
