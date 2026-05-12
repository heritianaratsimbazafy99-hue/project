import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const databaseUrl = process.env.SUPABASE_DB_URL;

function runSql(sql: string) {
  if (!databaseUrl) {
    throw new Error("SUPABASE_DB_URL is required for RLS integration tests.");
  }

  return execFileSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-Atqc", sql], {
    encoding: "utf8"
  }).trim();
}

const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("JobMada RLS runtime policies", () => {
  it("scopes private CV storage objects to the owner, authorized recruiter and admin", () => {
    const result = runSql(`
      begin;

      insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
      values
        ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-candidate-owner@jobmada.test', 'x', now(), now(), now()),
        ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-candidate-other@jobmada.test', 'x', now(), now(), now()),
        ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-recruiter-owner@jobmada.test', 'x', now(), now(), now()),
        ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-recruiter-other@jobmada.test', 'x', now(), now(), now()),
        ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-admin@jobmada.test', 'x', now(), now(), now())
      on conflict (id) do nothing;

      insert into public.profiles (id, role, display_name, email)
      values
        ('10000000-0000-0000-0000-000000000001', 'candidate', 'Owner Candidate', 'rls-candidate-owner@jobmada.test'),
        ('10000000-0000-0000-0000-000000000002', 'candidate', 'Other Candidate', 'rls-candidate-other@jobmada.test'),
        ('10000000-0000-0000-0000-000000000003', 'recruiter', 'Owner Recruiter', 'rls-recruiter-owner@jobmada.test'),
        ('10000000-0000-0000-0000-000000000004', 'recruiter', 'Other Recruiter', 'rls-recruiter-other@jobmada.test'),
        ('10000000-0000-0000-0000-000000000005', 'admin', 'Admin', 'rls-admin@jobmada.test')
      on conflict (id) do update set role = excluded.role;

      insert into public.companies (id, owner_id, name, slug, status)
      values ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000003', 'RLS Company', 'rls-company', 'verified')
      on conflict (id) do nothing;

      insert into public.jobs (id, company_id, title, slug, contract, city, sector, status)
      values ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000101', 'RLS Job', 'rls-job', 'CDI', 'Antananarivo', 'IT', 'published')
      on conflict (id) do nothing;

      insert into public.applications (job_id, candidate_id, cv_path)
      values ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001/cv.pdf')
      on conflict (job_id, candidate_id) do update set cv_path = excluded.cv_path;

      insert into storage.objects (id, bucket_id, name, owner, metadata)
      values
        ('10000000-0000-0000-0000-000000000301', 'cvs', '10000000-0000-0000-0000-000000000001/cv.pdf', '10000000-0000-0000-0000-000000000001', '{}'::jsonb),
        ('10000000-0000-0000-0000-000000000302', 'cvs', '10000000-0000-0000-0000-000000000002/cv.pdf', '10000000-0000-0000-0000-000000000002', '{}'::jsonb)
      on conflict (id) do nothing;

      set local role authenticated;

      select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
      select count(*) from storage.objects where bucket_id = 'cvs' and name = '10000000-0000-0000-0000-000000000001/cv.pdf';

      select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
      select count(*) from storage.objects where bucket_id = 'cvs' and name = '10000000-0000-0000-0000-000000000001/cv.pdf';

      select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
      select count(*) from storage.objects where bucket_id = 'cvs' and name = '10000000-0000-0000-0000-000000000001/cv.pdf';
      select count(*) from storage.objects where bucket_id = 'cvs' and name = '10000000-0000-0000-0000-000000000002/cv.pdf';

      select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
      select count(*) from storage.objects where bucket_id = 'cvs' and name = '10000000-0000-0000-0000-000000000001/cv.pdf';

      select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
      select count(*) from storage.objects where bucket_id = 'cvs' and name = '10000000-0000-0000-0000-000000000001/cv.pdf';

      rollback;
    `);

    expect(result.split("\n")).toEqual(["1", "0", "1", "0", "0", "1"]);
  });
});
