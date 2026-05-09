import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260509_initial_schema.sql"
);

const coreTables = [
  "profiles",
  "candidate_profiles",
  "companies",
  "jobs",
  "applications",
  "job_alerts",
  "subscriptions",
  "admin_reviews"
] as const;

describe("initial Supabase schema", () => {
  const migrationSql = readFileSync(migrationPath, "utf8").toLowerCase();

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
});
