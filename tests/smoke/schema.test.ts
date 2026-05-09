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
});
