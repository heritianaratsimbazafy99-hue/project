do $$
begin
  if to_regclass('public.companies') is null then
    raise exception 'Missing prerequisite table: public.companies';
  end if;

  if to_regprocedure('private.is_admin()') is null then
    raise exception 'Missing prerequisite function: private.is_admin()';
  end if;

  if to_regprocedure('private.owns_company(uuid)') is null then
    raise exception 'Missing prerequisite function: private.owns_company(uuid)';
  end if;
end;
$$;

alter table public.companies
  add column if not exists size_label text,
  add column if not exists career_headline text,
  add column if not exists career_intro text,
  add column if not exists career_values text[] not null default '{}',
  add column if not exists career_benefits text[] not null default '{}',
  add column if not exists career_gallery_paths text[] not null default '{}',
  add column if not exists career_connect_enabled boolean not null default true,
  add column if not exists career_connect_title text,
  add column if not exists career_connect_description text;

create table if not exists public.company_connect_profiles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidate_id uuid references public.profiles(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) between 2 and 180),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  phone text,
  desired_role text,
  message text,
  cv_path text not null check (char_length(trim(cv_path)) > 0),
  status text not null default 'new' check (status in ('new', 'reviewed', 'contacted', 'archived')),
  consent_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_connect_profiles_company_created_at_idx
  on public.company_connect_profiles (company_id, created_at desc);

create index if not exists company_connect_profiles_status_created_at_idx
  on public.company_connect_profiles (status, created_at desc);

create index if not exists company_connect_profiles_email_idx
  on public.company_connect_profiles (lower(email));

alter table public.company_connect_profiles enable row level security;

grant insert on public.company_connect_profiles to anon, authenticated;
grant select, update, delete on public.company_connect_profiles to authenticated;

drop policy if exists company_connect_profiles_insert_public on public.company_connect_profiles;
create policy company_connect_profiles_insert_public on public.company_connect_profiles
  for insert to anon, authenticated
  with check (
    status = 'new'
    and consent_accepted = true
    and cv_path like company_id::text || '/%'
    and (candidate_id is null or candidate_id = (select auth.uid()))
    and exists (
      select 1
      from public.companies
      where public.companies.id = public.company_connect_profiles.company_id
        and public.companies.status = 'verified'::public.company_status
        and public.companies.career_connect_enabled = true
    )
  );

drop policy if exists company_connect_profiles_select_owner_or_admin on public.company_connect_profiles;
create policy company_connect_profiles_select_owner_or_admin on public.company_connect_profiles
  for select to authenticated
  using (
    (select private.is_admin())
    or (select private.owns_company(public.company_connect_profiles.company_id))
  );

drop policy if exists company_connect_profiles_update_owner_or_admin on public.company_connect_profiles;
create policy company_connect_profiles_update_owner_or_admin on public.company_connect_profiles
  for update to authenticated
  using (
    (select private.is_admin())
    or (select private.owns_company(public.company_connect_profiles.company_id))
  )
  with check (
    (select private.is_admin())
    or (select private.owns_company(public.company_connect_profiles.company_id))
  );

drop policy if exists company_connect_profiles_delete_admin on public.company_connect_profiles;
create policy company_connect_profiles_delete_admin on public.company_connect_profiles
  for delete to authenticated
  using ((select private.is_admin()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'company-connect-cvs',
  'company-connect-cvs',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

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
        and (select private.owns_company(public.company_connect_profiles.company_id))
    )
$$;

revoke all on function private.can_read_company_connect_cv_object(text) from public, anon;
grant execute on function private.can_read_company_connect_cv_object(text) to authenticated;

drop policy if exists company_connect_cvs_insert_public on storage.objects;
create policy company_connect_cvs_insert_public on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'company-connect-cvs'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.companies
      where public.companies.id = ((storage.foldername(name))[1])::uuid
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
