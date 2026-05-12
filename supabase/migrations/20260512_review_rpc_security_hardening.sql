create or replace function public.review_job(
  job_uuid uuid,
  review_decision text,
  review_note text default null
)
returns table(slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_record public.jobs%rowtype;
  next_status public.job_status;
  company_status public.company_status;
  normalized_review_note text;
begin
  if not public.is_admin() then
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
security definer
set search_path = ''
as $$
declare
  company_record public.companies%rowtype;
  next_status public.company_status;
  normalized_review_note text;
begin
  if not public.is_admin() then
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

revoke all on function public.review_job(uuid, text, text) from public;
revoke all on function public.review_company(uuid, text, text) from public;
grant execute on function public.review_job(uuid, text, text) to authenticated;
grant execute on function public.review_company(uuid, text, text) to authenticated;

create or replace function public.review_plan_change_request(
  request_uuid uuid,
  review_decision text,
  review_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_record public.plan_change_requests%rowtype;
  next_status text;
  next_job_quota integer;
  next_cv_access_enabled boolean;
begin
  if not public.is_admin() then
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

revoke all on function public.review_plan_change_request(uuid, text, text) from public;
grant execute on function public.review_plan_change_request(uuid, text, text) to authenticated;
