import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations"
);

const coreTables = [
  "profiles",
  "candidate_profiles",
  "candidate_experiences",
  "candidate_educations",
  "candidate_skills",
  "companies",
  "jobs",
  "applications",
  "saved_jobs",
  "job_alerts",
  "subscriptions",
  "plan_change_requests",
  "admin_reviews"
] as const;

describe("initial Supabase schema", () => {
  const migrationSql = readdirSync(migrationPath)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map((fileName) => readFileSync(resolve(migrationPath, fileName), "utf8"))
    .join("\n")
    .toLowerCase();

  it.each(coreTables)("creates and protects public.%s", (tableName) => {
    expect(migrationSql).toContain(
      `create table if not exists public.${tableName}`
    );
    expect(migrationSql).toContain(
      `alter table public.${tableName} enable row level security`
    );
  });

  it("keeps public jobs behind verified companies", () => {
    expect(migrationSql).toContain("create policy jobs_select_public_owned_or_admin");
    expect(migrationSql).toContain("status = 'published'");
    expect(migrationSql).toContain("public.companies.status = 'verified'");
  });

  it("allows recruiters to read CV storage objects only for received applications", () => {
    expect(migrationSql).toContain("create policy cvs_select_applicant_owner_recruiter_or_admin");
    expect(migrationSql).toContain("create or replace function public.can_read_cv_object");
    expect(migrationSql).toContain("security definer");
    expect(migrationSql).toContain("set search_path = ''");
    expect(migrationSql).toContain("public.applications.cv_path = object_name");
    expect(migrationSql).toContain("public.companies.owner_id = (select auth.uid())");
    expect(migrationSql).toContain("select public.can_read_cv_object(storage.objects.name)");
  });

  it("routes plan upgrades through auditable admin requests", () => {
    expect(migrationSql).toContain("create table if not exists public.plan_change_requests");
    expect(migrationSql).toContain("create policy plan_change_requests_insert_owner");
    expect(migrationSql).toContain("create policy plan_change_requests_update_owner_cancel_or_admin");
    expect(migrationSql).toContain("create policy admin_reviews_select_owner_or_admin");
  });

  it("allows recruiter company submission without self-verification", () => {
    expect(migrationSql).toContain("new.status = 'pending_review'");
    expect(migrationSql).toContain("new.owner_id = (select auth.uid())");
    expect(migrationSql).toContain("raise exception 'company moderation status is admin-managed'");
  });

  it("reviews jobs and companies through transactional functions", () => {
    expect(migrationSql).toContain("create or replace function public.review_job");
    expect(migrationSql).toContain("create or replace function public.review_company");
    expect(migrationSql).toContain("for update");
    expect(migrationSql).toContain("insert into public.admin_reviews");
  });

  it("onboards new Supabase Auth users into their business workspace", () => {
    expect(migrationSql).toContain("create or replace function public.handle_new_auth_user");
    expect(migrationSql).toContain("after insert on auth.users");
    expect(migrationSql).toContain("insert into public.candidate_profiles");
    expect(migrationSql).toContain("insert into public.companies");
    expect(migrationSql).toContain("insert into public.subscriptions");
  });

  it("hardens readiness-sensitive data paths", () => {
    expect(migrationSql).toContain("protect_profile_system_fields");
    expect(migrationSql).toContain("profile email is managed by authentication");
    expect(migrationSql).toContain("protect_plan_request_owner_cancel");
    expect(migrationSql).toContain("only pending plan requests can be canceled by company owners");
    expect(migrationSql).toContain("plan_change_requests_requested_by_idx");
    expect(migrationSql).toContain("plan_change_requests_reviewed_by_idx");
    expect(migrationSql).toContain("allowed_mime_types");
    expect(migrationSql).toContain("application/pdf");
  });

  it("keeps the final service-role helper safe for security definer triggers", () => {
    const serviceRoleDefinitions = migrationSql.match(
      /create or replace function public\.is_service_role\(\)[\s\S]*?\$\$;/g
    );
    const finalDefinition = serviceRoleDefinitions?.at(-1) ?? "";

    expect(finalDefinition).toContain("auth.role()) = 'service_role'");
    expect(finalDefinition).toContain("session_user in ('postgres', 'supabase_admin')");
    expect(finalDefinition).not.toContain("current_user");
  });

  it("enforces recruiter job quotas and indexes sensitive lookups in the database", () => {
    expect(migrationSql).toContain("create or replace function public.enforce_company_job_quota");
    expect(migrationSql).toContain("company job quota exceeded");
    expect(migrationSql).toContain("drop trigger if exists enforce_company_job_quota on public.jobs");
    expect(migrationSql).toContain("applications_cv_path_idx");
    expect(migrationSql).toContain("jobs_company_status_created_at_idx");
    expect(migrationSql).toContain("applications_job_status_created_at_idx");
    expect(migrationSql).toContain("admin_reviews_target_created_at_idx");
  });

  it("reviews plan changes transactionally and blocks duplicate pending requests", () => {
    expect(migrationSql).toContain("plan_change_requests_one_pending_per_company_plan_idx");
    expect(migrationSql).toContain("where status = 'pending'");
    expect(migrationSql).toContain("create or replace function public.review_plan_change_request");
    expect(migrationSql).toContain("for update");
    expect(migrationSql).toContain("on conflict (company_id) do update");
    expect(migrationSql).toContain("grant execute on function public.review_plan_change_request");
  });
});
