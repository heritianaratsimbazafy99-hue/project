create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce((select auth.role()) = 'service_role', false)
    or current_user in ('postgres', 'supabase_admin')
    or session_user in ('postgres', 'supabase_admin')
$$;

alter table public.subscriptions alter column job_quota set default 2;

create or replace function public.signup_slugify(value text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      trim(
        both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g')
      ),
      ''
    ),
    'entreprise'
  )
$$;

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
    and exists (
      select 1
      from public.companies
      where public.companies.id = new.company_id
        and public.companies.owner_id = (select auth.uid())
    ) then
    return new;
  end if;

  raise exception 'Subscription entitlements are admin-managed';
end;
$$;

drop trigger if exists protect_subscription_entitlements on public.subscriptions;
create trigger protect_subscription_entitlements
  before insert or update on public.subscriptions
  for each row execute function public.protect_subscription_entitlements();

drop policy if exists subscriptions_insert_owner_or_admin on public.subscriptions;
create policy subscriptions_insert_owner_or_admin on public.subscriptions
  for insert to authenticated
  with check (
    (select public.is_admin())
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

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_role public.user_role;
  first_name text;
  last_name text;
  display_name text;
  desired_role text;
  company_name text;
  company_slug text;
  company_uuid uuid;
begin
  account_role := case
    when new.raw_user_meta_data->>'role' = 'recruiter' then 'recruiter'::public.user_role
    else 'candidate'::public.user_role
  end;

  first_name := nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), '');
  last_name := nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), '');
  display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');
  desired_role := nullif(trim(coalesce(new.raw_user_meta_data->>'desired_role', '')), '');
  company_name := nullif(trim(coalesce(new.raw_user_meta_data->>'company_name', '')), '');

  if display_name is null then
    display_name := nullif(trim(concat_ws(' ', first_name, last_name)), '');
  end if;

  if display_name is null then
    display_name := split_part(coalesce(new.email, 'utilisateur@jobmada.mg'), '@', 1);
  end if;

  insert into public.profiles (id, role, display_name, email, onboarding_completion)
  values (
    new.id,
    account_role,
    display_name,
    coalesce(new.email, ''),
    case when account_role = 'recruiter' then 35 when desired_role is not null then 35 else 20 end
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    email = excluded.email,
    onboarding_completion = excluded.onboarding_completion,
    updated_at = now();

  if account_role = 'candidate' then
    insert into public.candidate_profiles (
      user_id,
      first_name,
      last_name,
      desired_role,
      profile_completion
    )
    values (
      new.id,
      coalesce(first_name, ''),
      coalesce(last_name, ''),
      desired_role,
      case when desired_role is not null then 35 else 20 end
    )
    on conflict (user_id) do update
    set
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      desired_role = excluded.desired_role,
      profile_completion = excluded.profile_completion,
      updated_at = now();
  else
    company_name := coalesce(company_name, display_name || ' Entreprise');
    company_slug := public.signup_slugify(company_name) || '-' || left(replace(new.id::text, '-', ''), 8);

    insert into public.companies (owner_id, name, slug, status)
    values (new.id, company_name, company_slug, 'incomplete')
    on conflict (slug) do nothing
    returning id into company_uuid;

    if company_uuid is null then
      select id
      into company_uuid
      from public.companies
      where owner_id = new.id
      order by created_at asc
      limit 1;
    end if;

    if company_uuid is not null then
      insert into public.subscriptions (company_id, plan, status, job_quota, cv_access_enabled)
      values (company_uuid, 'free', 'active', 2, false)
      on conflict (company_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
