do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'Missing prerequisite table: public.profiles';
  end if;

  if to_regprocedure('private.is_admin()') is null then
    raise exception 'Missing prerequisite function: private.is_admin()';
  end if;
end;
$$;

create table if not exists public.cooptation_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_name text not null check (char_length(trim(referrer_name)) between 2 and 160),
  referrer_email text not null check (referrer_email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  referrer_phone text,
  candidate_name text not null check (char_length(trim(candidate_name)) between 2 and 160),
  candidate_email text check (candidate_email is null or candidate_email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  candidate_phone text,
  candidate_city text,
  target_role text,
  message text,
  cv_path text not null check (char_length(trim(cv_path)) > 0),
  status text not null default 'submitted' check (status in ('submitted', 'reviewing', 'interview', 'reward_pending', 'rewarded', 'rejected')),
  reward_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cooptation_referrals_created_at_idx
  on public.cooptation_referrals (created_at desc);

create index if not exists cooptation_referrals_status_created_at_idx
  on public.cooptation_referrals (status, created_at desc);

create index if not exists cooptation_referrals_referrer_email_idx
  on public.cooptation_referrals (lower(referrer_email));

alter table public.cooptation_referrals enable row level security;

grant insert on public.cooptation_referrals to anon, authenticated;
grant select, update, delete on public.cooptation_referrals to authenticated;

drop policy if exists cooptation_referrals_insert_public on public.cooptation_referrals;
create policy cooptation_referrals_insert_public on public.cooptation_referrals
  for insert to anon, authenticated
  with check (
    status = 'submitted'
    and reward_note is null
  );

drop policy if exists cooptation_referrals_select_admin on public.cooptation_referrals;
create policy cooptation_referrals_select_admin on public.cooptation_referrals
  for select to authenticated
  using ((select private.is_admin()));

drop policy if exists cooptation_referrals_update_admin on public.cooptation_referrals;
create policy cooptation_referrals_update_admin on public.cooptation_referrals
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists cooptation_referrals_delete_admin on public.cooptation_referrals;
create policy cooptation_referrals_delete_admin on public.cooptation_referrals
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
  'cooptation-cvs',
  'cooptation-cvs',
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

drop policy if exists cooptation_cvs_insert_public on storage.objects;
create policy cooptation_cvs_insert_public on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'cooptation-cvs'
    and (storage.foldername(name))[1] = 'referrals'
  );

drop policy if exists cooptation_cvs_select_admin on storage.objects;
create policy cooptation_cvs_select_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cooptation-cvs'
    and (select private.is_admin())
  );

drop policy if exists cooptation_cvs_update_admin on storage.objects;
create policy cooptation_cvs_update_admin on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cooptation-cvs'
    and (select private.is_admin())
  )
  with check (
    bucket_id = 'cooptation-cvs'
    and (select private.is_admin())
  );

drop policy if exists cooptation_cvs_delete_admin on storage.objects;
create policy cooptation_cvs_delete_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'cooptation-cvs'
    and (select private.is_admin())
  );
