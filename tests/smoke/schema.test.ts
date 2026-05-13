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
  "admin_reviews",
  "cooptation_referrals",
  "company_connect_profiles"
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
    expect(migrationSql).toContain("create or replace function private.can_read_cv_object");
    expect(migrationSql).toContain("security definer");
    expect(migrationSql).toContain("set search_path = ''");
    expect(migrationSql).toContain("public.applications.cv_path = object_name");
    expect(migrationSql).toContain("public.companies.owner_id = (select auth.uid())");
    expect(migrationSql).toContain("select private.can_read_cv_object(storage.objects.name)");
  });

  it("opens CV library candidate data to active subscriptions with CV access", () => {
    expect(migrationSql).toContain("create or replace function private.current_recruiter_has_cv_access");
    expect(migrationSql).toContain("public.subscriptions.cv_access_enabled = true");
    expect(migrationSql).toContain("public.subscriptions.plan in ('booster', 'agency')");
    expect(migrationSql).toContain("or (select private.current_recruiter_has_cv_access())");
    expect(migrationSql).toContain("public.candidate_profiles.cv_path = object_name");

    const accessDefinitions = migrationSql.match(
      /create or replace function private\.current_recruiter_has_cv_access\(\)[\s\S]*?\$\$;/g
    );
    const finalAccessDefinition = accessDefinitions?.at(-1) ?? "";

    expect(finalAccessDefinition).toContain("private.current_user_role() = 'recruiter'");
    expect(finalAccessDefinition).toContain("public.companies.status = 'verified'");
  });

  it("persists CV parsing metadata used by matching signals", () => {
    expect(migrationSql).toContain("alter table public.candidate_profiles");
    expect(migrationSql).toContain("cv_parsed_at timestamptz");
    expect(migrationSql).toContain("cv_parse_source text");
    expect(migrationSql).toContain("cv_parse_summary text");
    expect(migrationSql).toContain("cv_parse_source in ('openai', 'fallback')");
  });

  it("checks candidate CV ownership without recursive application policies", () => {
    expect(migrationSql).toContain("create or replace function private.candidate_owns_cv_path");

    const applicationInsertPolicies = migrationSql.match(
      /create policy applications_insert_candidate_for_published_job[\s\S]*?;\n/g
    );
    const finalInsertPolicy = applicationInsertPolicies?.at(-1) ?? "";

    expect(finalInsertPolicy).toContain("select private.candidate_owns_cv_path(public.applications.cv_path)");
    expect(finalInsertPolicy).not.toContain("from public.candidate_profiles");
  });

  it("keeps security-definer RLS helpers outside the exposed public schema", () => {
    expect(migrationSql).toContain("create schema if not exists private");
    expect(migrationSql).toContain("create or replace function private.current_user_role");
    expect(migrationSql).toContain("create or replace function private.is_admin");
    expect(migrationSql).toContain("create or replace function private.owns_company");
    expect(migrationSql).toContain("create or replace function private.owns_job");
    expect(migrationSql).toContain("revoke all on function public.current_user_role() from public, anon, authenticated");
    expect(migrationSql).toContain("revoke all on function public.is_admin() from public, anon, authenticated");
    expect(migrationSql).toContain("grant execute on function private.is_admin() to authenticated");

    const finalPolicies = migrationSql.slice(migrationSql.lastIndexOf("create schema if not exists private"));

    expect(finalPolicies).toContain("select private.is_admin()");
    expect(finalPolicies).toContain("select private.owns_company");
    expect(finalPolicies).toContain("select private.owns_job");
    expect(finalPolicies).not.toContain("select public.is_admin()");
    expect(finalPolicies).not.toContain("select public.owns_company");
    expect(finalPolicies).not.toContain("select public.owns_job");
  });

  it("routes plan upgrades through auditable admin requests", () => {
    expect(migrationSql).toContain("create table if not exists public.plan_change_requests");
    expect(migrationSql).toContain("create policy plan_change_requests_insert_owner");
    expect(migrationSql).toContain("create policy plan_change_requests_update_owner_cancel_or_admin");
    expect(migrationSql).toContain("create policy admin_reviews_select_owner_or_admin");
  });

  it("stores public cooptation referrals privately with admin-only review access", () => {
    expect(migrationSql).toContain("create table if not exists public.cooptation_referrals");
    expect(migrationSql).toContain("create policy cooptation_referrals_insert_public");
    expect(migrationSql).toContain("for insert to anon, authenticated");
    expect(migrationSql).toContain("create policy cooptation_referrals_select_admin");
    expect(migrationSql).toContain("create policy cooptation_referrals_update_admin");
    expect(migrationSql).toContain("create policy cooptation_referrals_delete_admin");
    expect(migrationSql).toContain("grant insert on public.cooptation_referrals to anon, authenticated");
    expect(migrationSql).toContain("cooptation_referrals_created_at_idx");
    expect(migrationSql).toContain("'interview'");
  });

  it("keeps cooptation CV uploads in a private storage bucket", () => {
    expect(migrationSql).toContain("'cooptation-cvs'");
    expect(migrationSql).toContain("public = false");
    expect(migrationSql).toContain("file_size_limit = 10485760");
    expect(migrationSql).toContain("create policy cooptation_cvs_insert_public");
    expect(migrationSql).toContain("for insert to anon, authenticated");
    expect(migrationSql).toContain("create policy cooptation_cvs_select_admin");
    expect(migrationSql).toContain("bucket_id = 'cooptation-cvs'");
    expect(migrationSql).toContain("select private.is_admin()");
  });

  it("adds public company career sites with private Connect leads", () => {
    expect(migrationSql).toContain("career_headline text");
    expect(migrationSql).toContain("career_intro text");
    expect(migrationSql).toContain("career_values text[] not null default '{}'");
    expect(migrationSql).toContain("career_benefits text[] not null default '{}'");
    expect(migrationSql).toContain("career_gallery_paths text[] not null default '{}'");
    expect(migrationSql).toContain("career_connect_enabled boolean not null default true");

    expect(migrationSql).toContain("create table if not exists public.company_connect_profiles");
    expect(migrationSql).toContain("company_id uuid not null references public.companies(id) on delete cascade");
    expect(migrationSql).toContain("consent_accepted boolean not null default false");
    expect(migrationSql).toContain("status text not null default 'new'");
    expect(migrationSql).toContain("status in ('new', 'reviewed', 'contacted', 'archived')");
    expect(migrationSql).toContain("alter table public.company_connect_profiles enable row level security");
    expect(migrationSql).toContain("create policy company_connect_profiles_insert_public");
    expect(migrationSql).toContain("for insert to anon, authenticated");
    expect(migrationSql).toContain("public.companies.status = 'verified'::public.company_status");
    expect(migrationSql).toContain("public.companies.career_connect_enabled = true");
    expect(migrationSql).toContain("create policy company_connect_profiles_select_owner_or_admin");
    expect(migrationSql).toContain("select private.is_admin()");
    expect(migrationSql).toContain("select private.owns_company(public.company_connect_profiles.company_id)");
  });

  it("keeps company Connect CV uploads in a private owner/admin bucket", () => {
    expect(migrationSql).toContain("'company-connect-cvs'");
    expect(migrationSql).toContain("public = false");
    expect(migrationSql).toContain("file_size_limit = 10485760");
    expect(migrationSql).toContain("create or replace function private.can_read_company_connect_cv_object");
    expect(migrationSql).toContain("grant execute on function private.can_read_company_connect_cv_object(text) to authenticated");
    expect(migrationSql).toContain("create policy company_connect_cvs_insert_public");
    expect(migrationSql).toContain("for insert to anon, authenticated");
    expect(migrationSql).toContain("create policy company_connect_cvs_select_owner_or_admin");
    expect(migrationSql).toContain("bucket_id = 'company-connect-cvs'");
    expect(migrationSql).toContain("select private.can_read_company_connect_cv_object(storage.objects.name)");
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
    expect(migrationSql).toContain("a rejection note is required");
    expect(migrationSql).toContain("grant execute on function public.review_job");
    expect(migrationSql).toContain("grant execute on function public.review_company");

    const reviewJobDefinitions = migrationSql.match(
      /create or replace function public\.review_job[\s\S]*?\$\$;/g
    );
    const reviewCompanyDefinitions = migrationSql.match(
      /create or replace function public\.review_company[\s\S]*?\$\$;/g
    );
    const finalReviewJobDefinition = reviewJobDefinitions?.at(-1) ?? "";
    const finalReviewCompanyDefinition = reviewCompanyDefinitions?.at(-1) ?? "";

    expect(finalReviewJobDefinition).toContain("security invoker");
    expect(finalReviewJobDefinition).toContain("set search_path = ''");
    expect(finalReviewJobDefinition).toContain("review_decision = 'reject'");
    expect(finalReviewCompanyDefinition).toContain("security invoker");
    expect(finalReviewCompanyDefinition).toContain("set search_path = ''");
    expect(finalReviewCompanyDefinition).toContain("review_decision = 'reject'");
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

    const planReviewDefinitions = migrationSql.match(
      /create or replace function public\.review_plan_change_request[\s\S]*?\$\$;/g
    );
    const finalPlanReviewDefinition = planReviewDefinitions?.at(-1) ?? "";

    expect(finalPlanReviewDefinition).toContain("security invoker");
    expect(finalPlanReviewDefinition).toMatch(/when 'booster' then\s+next_job_quota := 999;/);
  });
});
