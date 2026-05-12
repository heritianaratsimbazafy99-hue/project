create or replace function public.can_read_cv_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (storage.foldername(object_name))[1] = (select auth.uid())::text
    or (select public.is_admin())
    or exists (
      select 1
      from public.applications
      join public.jobs
        on public.jobs.id = public.applications.job_id
      join public.companies
        on public.companies.id = public.jobs.company_id
      where public.applications.cv_path = object_name
        and public.companies.owner_id = (select auth.uid())
    );
$$;

revoke all on function public.can_read_cv_object(text) from public;
grant execute on function public.can_read_cv_object(text) to authenticated;

drop policy if exists cvs_select_applicant_owner_recruiter_or_admin on storage.objects;

create policy cvs_select_applicant_owner_recruiter_or_admin
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cvs'
  and (select public.can_read_cv_object(storage.objects.name))
);
