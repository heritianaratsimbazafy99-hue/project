with ranked_pending_plan_requests as (
  select
    id,
    row_number() over (
      partition by company_id, requested_plan
      order by requested_at asc, created_at asc, id asc
    ) as request_rank
  from public.plan_change_requests
  where status = 'pending'
)
update public.plan_change_requests
set
  status = 'canceled',
  review_note = coalesce(review_note, 'Duplicate pending request canceled during plan review hardening.'),
  updated_at = now()
where id in (
  select id
  from ranked_pending_plan_requests
  where request_rank > 1
);

create unique index if not exists plan_change_requests_one_pending_per_company_plan_idx
  on public.plan_change_requests (company_id, requested_plan)
  where status = 'pending';

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
        next_job_quota := 25;
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
