create or replace function public.enforce_company_job_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  company_quota integer;
  active_job_count integer;
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if new.status = 'archived' then
    return new;
  end if;

  perform 1
  from public.companies
  where id = new.company_id
  for update;

  select coalesce(public.subscriptions.job_quota, 2)
  into company_quota
  from public.subscriptions
  where public.subscriptions.company_id = new.company_id
  for update;

  company_quota := coalesce(company_quota, 2);

  if company_quota >= 999 then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select count(*)
    into active_job_count
    from public.jobs
    where company_id = new.company_id
      and status <> 'archived';
  else
    select count(*)
    into active_job_count
    from public.jobs
    where company_id = new.company_id
      and status <> 'archived'
      and id <> old.id;
  end if;

  if active_job_count >= company_quota then
    raise exception 'Company job quota exceeded';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_company_job_quota on public.jobs;
create trigger enforce_company_job_quota
  before insert or update of company_id, status on public.jobs
  for each row execute function public.enforce_company_job_quota();

create index if not exists applications_cv_path_idx
  on public.applications (cv_path)
  where cv_path is not null;

create index if not exists jobs_company_created_at_idx
  on public.jobs (company_id, created_at desc);

create index if not exists jobs_company_status_created_at_idx
  on public.jobs (company_id, status, created_at desc);

create index if not exists applications_job_status_created_at_idx
  on public.applications (job_id, status, created_at desc);

create index if not exists admin_reviews_target_created_at_idx
  on public.admin_reviews (target_table, target_id, created_at desc);
