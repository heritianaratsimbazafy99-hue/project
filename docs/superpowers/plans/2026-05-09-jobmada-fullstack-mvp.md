# JobMada Full-Stack MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild JobMada as a real Next.js + Supabase marketplace with public jobs, candidate space, recruiter space, and admin moderation.

**Architecture:** Replace the vanilla SPA with a Next.js App Router TypeScript application. Supabase provides Auth, Postgres, Row-Level Security, Storage buckets, and seed data. Implement the MVP in vertical slices so every milestone produces working, testable software.

**Tech Stack:** Next.js App Router, TypeScript, Supabase JS/SSR, Postgres SQL migrations, Supabase Storage, CSS Modules or global CSS tokens, Vitest, Playwright/Chrome verification.

---

## File Structure

- Create `package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`, `app/*`, `src/*`, `supabase/*`, `tests/*`.
- Keep `assets/logos/jobmada-logo.jpg`, `assets/logos/mock-company-logo-sheet.png`, and `assets/company-photos/mock-company-photo-sheet.png`.
- Move reusable visual rules from `styles.css` into `app/globals.css`.
- Treat `app.js` and `styles.css` as reference files until the Next.js routes replace them.
- Supabase SQL lives in `supabase/migrations/20260509_initial_schema.sql`.
- Seed SQL lives in `supabase/seed.sql`.

## Milestone Order

1. Next.js foundation.
2. Supabase schema, RLS, storage, and seed data.
3. Auth and role-based route guards.
4. Public jobboard.
5. Candidate space from Chrome audit.
6. Recruiter space.
7. Admin moderation.
8. End-to-end verification and cleanup.

---

### Task 1: Scaffold Next.js Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `src/config/brand.ts`
- Test: `tests/smoke/brand.test.ts`

- [ ] **Step 1: Create package metadata**

Create `package.json`:

```json
{
  "name": "jobmada-fullstack",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.75.0",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.8.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create TypeScript and Next config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co"
      }
    ]
  }
};

export default nextConfig;
```

- [ ] **Step 3: Create brand config and smoke test**

Create `src/config/brand.ts`:

```ts
export const brand = {
  name: "JobMada",
  tagline: "Vous cherchez, nous trouvons",
  logoPath: "/assets/logos/jobmada-logo.jpg",
  colors: {
    navy: "#0b2f6b",
    green: "#8ee321",
    purple: "#7428c8",
    cyan: "#28c8f5",
    yellow: "#ffd83d"
  }
} as const;
```

Create `tests/smoke/brand.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { brand } from "@/config/brand";

describe("JobMada brand", () => {
  it("uses the approved JobMada name and logo", () => {
    expect(brand.name).toBe("JobMada");
    expect(brand.logoPath).toBe("/assets/logos/jobmada-logo.jpg");
    expect(brand.colors.green).toBe("#8ee321");
  });
});
```

- [ ] **Step 4: Create initial app shell**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobMada — L'emploi à Madagascar",
  description: "Jobboard et marketplace recrutement pour Madagascar."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
import { brand } from "@/config/brand";

export default function HomePage() {
  return (
    <main className="page">
      <header className="siteHeader">
        <a className="brand" href="/">
          <img src={brand.logoPath} alt={brand.name} />
          <span>{brand.name}</span>
        </a>
      </header>
      <section className="hero">
        <h1>L'emploi qui vous correspond</h1>
        <p>La nouvelle marketplace emploi JobMada arrive en full-stack.</p>
      </section>
    </main>
  );
}
```

Create `app/globals.css`:

```css
:root {
  --navy: #0b2f6b;
  --navy-ink: #041636;
  --green: #8ee321;
  --purple: #7428c8;
  --cyan: #28c8f5;
  --yellow: #ffd83d;
  --page: #f5f9ff;
  --surface: #ffffff;
  --line: #dce7f6;
  --muted: #68789d;
  --shadow: 0 18px 55px rgba(4, 22, 54, 0.1);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--page);
  color: var(--navy);
  font-family: "DM Sans", Inter, system-ui, sans-serif;
}

.siteHeader {
  display: flex;
  align-items: center;
  min-height: 72px;
  padding: 0 8vw;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--navy);
  font-size: 26px;
  font-weight: 950;
  text-decoration: none;
}

.brand img {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  object-fit: cover;
}

.hero {
  padding: 80px 8vw;
}

.hero h1 {
  max-width: 720px;
  margin: 0;
  color: var(--navy);
  font-size: 64px;
  line-height: 1;
}
```

- [ ] **Step 5: Run foundation checks**

Run:

```bash
npm install
npm test
npm run typecheck
npm run build
```

Expected: all commands pass.

- [ ] **Step 6: Commit foundation**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts app src tests
git commit -m "feat: scaffold JobMada Next.js foundation"
```

---

### Task 2: Supabase Schema, Storage, And Seeds

**Files:**
- Create: `supabase/migrations/20260509_initial_schema.sql`
- Create: `supabase/seed.sql`
- Create: `src/types/database.ts`
- Test: `tests/smoke/schema.test.ts`

- [ ] **Step 1: Write schema smoke test**

Create `tests/smoke/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import fs from "node:fs";

const sql = fs.readFileSync("supabase/migrations/20260509_initial_schema.sql", "utf8");

describe("Supabase schema", () => {
  it("defines the marketplace core tables and RLS", () => {
    for (const table of [
      "profiles",
      "candidate_profiles",
      "companies",
      "jobs",
      "applications",
      "job_alerts",
      "subscriptions",
      "admin_reviews"
    ]) {
      expect(sql).toContain(`create table if not exists public.${table}`);
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/smoke/schema.test.ts
```

Expected: FAIL because `supabase/migrations/20260509_initial_schema.sql` does not exist.

- [ ] **Step 3: Create initial migration**

Create `supabase/migrations/20260509_initial_schema.sql` with enums, tables, indexes, and RLS. Include this opening structure and then complete each listed table in the same file:

```sql
create extension if not exists "pgcrypto";

create type public.user_role as enum ('candidate', 'recruiter', 'admin');
create type public.job_status as enum ('draft', 'pending_review', 'published', 'rejected', 'expired', 'archived');
create type public.company_status as enum ('incomplete', 'pending_review', 'verified', 'rejected');
create type public.application_status as enum ('submitted', 'viewed', 'shortlisted', 'rejected', 'interview', 'hired');
create type public.skill_kind as enum ('hard', 'soft', 'language');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  display_name text not null default '',
  email text not null,
  phone text,
  onboarding_completion integer not null default 0 check (onboarding_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  city text,
  sector text,
  desired_role text,
  salary_expectation text,
  cv_path text,
  profile_completion integer not null default 0 check (profile_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  sector text,
  city text,
  website text,
  description text,
  logo_path text,
  cover_path text,
  status public.company_status not null default 'incomplete',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  slug text not null unique,
  contract text not null,
  city text not null,
  sector text not null,
  salary_range text,
  location_detail text,
  internal_reference text,
  summary text not null default '',
  description text not null default '',
  missions text not null default '',
  profile text not null default '',
  is_featured boolean not null default false,
  is_urgent boolean not null default false,
  status public.job_status not null default 'draft',
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  cv_path text not null,
  message text,
  status public.application_status not null default 'submitted',
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);
```

Continue the migration with `candidate_experiences`, `candidate_educations`, `candidate_skills`, `saved_jobs`, `job_alerts`, `subscriptions`, and `admin_reviews`. Add indexes for `jobs(status, published_at)`, `jobs(city)`, `jobs(contract)`, `jobs(sector)`, `applications(candidate_id)`, and `applications(job_id)`.

Enable RLS for every public table and create policies matching the design spec. Use helper checks:

```sql
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;
```

- [ ] **Step 4: Add storage setup notes**

At the end of the migration, include bucket inserts:

```sql
insert into storage.buckets (id, name, public)
values
  ('cvs', 'cvs', false),
  ('company-logos', 'company-logos', true),
  ('company-covers', 'company-covers', true)
on conflict (id) do nothing;
```

- [ ] **Step 5: Create typed database surface**

Create `src/types/database.ts`:

```ts
export type UserRole = "candidate" | "recruiter" | "admin";
export type JobStatus = "draft" | "pending_review" | "published" | "rejected" | "expired" | "archived";
export type CompanyStatus = "incomplete" | "pending_review" | "verified" | "rejected";
export type ApplicationStatus = "submitted" | "viewed" | "shortlisted" | "rejected" | "interview" | "hired";

export type JobListItem = {
  id: string;
  slug: string;
  title: string;
  contract: string;
  city: string;
  sector: string;
  summary: string;
  is_featured: boolean;
  is_urgent: boolean;
  published_at: string | null;
  company: {
    name: string;
    slug: string;
    logo_path: string | null;
  };
};
```

- [ ] **Step 6: Run schema test**

Run:

```bash
npm test -- tests/smoke/schema.test.ts
```

Expected: PASS.

- [ ] **Step 7: Create seed file**

Create `supabase/seed.sql` with demo companies and jobs. Use generated deterministic UUIDs and avoid real audited user data. Include at least:

```sql
insert into public.companies (id, owner_id, name, slug, sector, city, description, status)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Media Click', 'media-click', 'Informatique & Digital', 'Antananarivo', 'Studio digital orienté produit et croissance.', 'verified'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'ONG MEDAIR', 'ong-medair', 'Associatif, ONG & Humanitaire', 'Fianarantsoa', 'Organisation humanitaire active à Madagascar.', 'verified');

insert into public.jobs (id, company_id, title, slug, contract, city, sector, summary, description, missions, profile, is_featured, is_urgent, status, published_at)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Designer UI/UX', 'designer-ui-ux-media-click', 'CDI', 'Antananarivo', 'Informatique & Digital', 'Concevoir des interfaces utiles et élégantes.', 'Vous rejoignez une équipe produit locale.', 'Recherche utilisateur, wireframes, design system.', 'Portfolio solide et sens du détail.', true, false, 'published', now()),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'Health, nutrition & community engagement manager', 'health-nutrition-community-engagement-manager-medair', 'CDD', 'Fianarantsoa', 'Associatif, ONG & Humanitaire', 'Renforcer l’engagement communautaire.', 'Poste terrain avec forte coordination.', 'Mise en œuvre, suivi, coordination.', 'Expérience santé publique ou sciences sociales.', true, true, 'published', now());
```

- [ ] **Step 8: Commit schema**

```bash
git add supabase src/types tests/smoke/schema.test.ts
git commit -m "feat: add Supabase schema and seed foundation"
```

---

### Task 3: Supabase Clients And Auth Guards

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/auth/require-role.ts`
- Create: `middleware.ts`
- Test: `tests/smoke/env.test.ts`

- [ ] **Step 1: Write env tests**

Create `tests/smoke/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getRequiredEnv } from "@/lib/env";

describe("environment helpers", () => {
  it("throws a readable error for missing required values", () => {
    expect(() => getRequiredEnv("JOBMADA_MISSING_TEST_VALUE")).toThrow("Missing environment variable: JOBMADA_MISSING_TEST_VALUE");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/smoke/env.test.ts
```

Expected: FAIL because `src/lib/env.ts` does not exist.

- [ ] **Step 3: Implement env helper**

Create `src/lib/env.ts`:

```ts
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: () => getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
};
```

- [ ] **Step 4: Implement Supabase clients**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      }
    }
  });
}
```

Create `src/lib/supabase/client.ts`:

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(env.supabaseUrl(), env.supabaseAnonKey());
}
```

- [ ] **Step 5: Implement role guard**

Create `src/lib/auth/require-role.ts`:

```ts
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function requireRole(roles: UserRole[]) {
  const supabase = await createSupabaseServerClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    redirect("/connexion");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, email, display_name")
    .eq("id", userResult.user.id)
    .single();

  if (error || !profile || !roles.includes(profile.role as UserRole)) {
    redirect("/");
  }

  return { user: userResult.user, profile };
}
```

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
npm test -- tests/smoke/env.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit auth foundation**

```bash
git add src/lib middleware.ts tests/smoke/env.test.ts
git commit -m "feat: add Supabase clients and role guards"
```

---

### Task 4: Public Jobboard Vertical Slice

**Files:**
- Create: `src/features/jobs/queries.ts`
- Create: `src/features/jobs/components/job-card.tsx`
- Create: `app/(public)/emploi/page.tsx`
- Create: `app/(public)/emploi/[slug]/page.tsx`
- Modify: `app/page.tsx`
- Test: `tests/smoke/job-filters.test.ts`

- [ ] **Step 1: Write filter test**

Create `tests/smoke/job-filters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildJobFilters } from "@/features/jobs/queries";

describe("buildJobFilters", () => {
  it("normalizes public job filters from URL search params", () => {
    const filters = buildJobFilters({
      q: "  designer ",
      contract: "CDI",
      city: "Antananarivo",
      sector: "Informatique & Digital"
    });

    expect(filters).toEqual({
      query: "designer",
      contract: "CDI",
      city: "Antananarivo",
      sector: "Informatique & Digital"
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/smoke/job-filters.test.ts
```

Expected: FAIL because `buildJobFilters` does not exist.

- [ ] **Step 3: Implement job queries**

Create `src/features/jobs/queries.ts`:

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type JobFilters = {
  query: string;
  contract: string;
  city: string;
  sector: string;
};

export function buildJobFilters(input: Record<string, string | string[] | undefined>): JobFilters {
  const value = (key: string) => {
    const raw = input[key];
    if (Array.isArray(raw)) return raw[0] ? raw[0].trim() : "";
    return raw ? raw.trim() : "";
  };

  return {
    query: value("q"),
    contract: value("contract"),
    city: value("city"),
    sector: value("sector")
  };
}

export async function getPublishedJobs(filters: JobFilters) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("jobs")
    .select("id, slug, title, contract, city, sector, summary, is_featured, is_urgent, published_at, companies(name, slug, logo_path)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (filters.query) query = query.ilike("title", `%${filters.query}%`);
  if (filters.contract) query = query.eq("contract", filters.contract);
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.sector) query = query.eq("sector", filters.sector);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

- [ ] **Step 4: Implement public pages**

Create `app/(public)/emploi/page.tsx`:

```tsx
import { buildJobFilters, getPublishedJobs } from "@/features/jobs/queries";

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = buildJobFilters(await searchParams);
  const jobs = await getPublishedJobs(filters);

  return (
    <main className="publicPage">
      <h1>Offres d'emploi à Madagascar</h1>
      <p>{jobs.length} offres disponibles</p>
      <div className="jobList">
        {jobs.map((job) => (
          <a key={job.id} className="jobCard" href={`/emploi/${job.slug}`}>
            <strong>{job.title}</strong>
            <span>{job.city} · {job.contract} · {job.sector}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run public slice checks**

Run:

```bash
npm test -- tests/smoke/job-filters.test.ts
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit public slice**

```bash
git add app src/features/jobs tests/smoke/job-filters.test.ts
git commit -m "feat: add public jobboard slice"
```

---

### Task 5: Candidate Space From Chrome Audit

**Files:**
- Create: `app/(candidate)/candidat/layout.tsx`
- Create: `app/(candidate)/candidat/dashboard/page.tsx`
- Create: `app/(candidate)/candidat/profil/page.tsx`
- Create: `app/(candidate)/candidat/candidatures/page.tsx`
- Create: `app/(candidate)/candidat/alertes/page.tsx`
- Create: `src/features/candidate/components/candidate-sidebar.tsx`
- Create: `src/features/candidate/components/cv-upload-card.tsx`
- Create: `src/features/applications/actions.ts`
- Test: `tests/smoke/candidate-completion.test.ts`

- [ ] **Step 1: Write candidate completion test**

Create `tests/smoke/candidate-completion.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateCandidateCompletion } from "@/features/candidate/completion";

describe("calculateCandidateCompletion", () => {
  it("matches the audited onboarding steps", () => {
    expect(calculateCandidateCompletion({
      accountCreated: true,
      hasCv: false,
      hasDesiredRole: false,
      hasAlert: false
    })).toEqual({ percent: 25, completedSteps: 1, totalSteps: 4 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/smoke/candidate-completion.test.ts
```

Expected: FAIL because `completion.ts` does not exist.

- [ ] **Step 3: Implement candidate completion**

Create `src/features/candidate/completion.ts`:

```ts
export type CandidateCompletionInput = {
  accountCreated: boolean;
  hasCv: boolean;
  hasDesiredRole: boolean;
  hasAlert: boolean;
};

export function calculateCandidateCompletion(input: CandidateCompletionInput) {
  const steps = [input.accountCreated, input.hasCv, input.hasDesiredRole, input.hasAlert];
  const completedSteps = steps.filter(Boolean).length;
  return {
    percent: Math.round((completedSteps / steps.length) * 100),
    completedSteps,
    totalSteps: steps.length
  };
}
```

- [ ] **Step 4: Implement candidate shell**

Create `src/features/candidate/components/candidate-sidebar.tsx`:

```tsx
import Link from "next/link";

export function CandidateSidebar({ email, completion }: { email: string; completion: number }) {
  return (
    <aside className="candidateSidebar">
      <div className="candidateCard">
        <div className="avatar">C</div>
        <strong>Candidat</strong>
        <span>{email}</span>
      </div>
      <nav>
        <Link href="/candidat/dashboard">Dashboard</Link>
        <Link href="/candidat/profil">Mon profil</Link>
        <Link href="/candidat/candidatures">Mes candidatures</Link>
        <Link href="/candidat/alertes">Mes alertes</Link>
      </nav>
      <div className="completionCard">
        <strong>{completion}%</strong>
        <span>Complétez votre profil</span>
      </div>
    </aside>
  );
}
```

Create `app/(candidate)/candidat/layout.tsx`:

```tsx
import { requireRole } from "@/lib/auth/require-role";
import { CandidateSidebar } from "@/features/candidate/components/candidate-sidebar";

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(["candidate"]);
  return (
    <div className="dashboardShell">
      <CandidateSidebar email={profile.email} completion={Number(profile.onboarding_completion || 0)} />
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Implement candidate pages**

Create pages that match the Chrome audit labels exactly:

```tsx
export default function CandidateDashboardPage() {
  return (
    <section>
      <h1>Bonjour</h1>
      <p>Bienvenue sur JobMada, votre prochain emploi commence ici</p>
      <div className="panel">
        <h2>Bienvenue sur JobMada</h2>
        <p>Voici comment démarrer en 4 étapes</p>
        <ul>
          <li>Compte créé</li>
          <li>Déposer votre CV</li>
          <li>Indiquer le poste recherché</li>
          <li>Activer une alerte emploi</li>
        </ul>
      </div>
    </section>
  );
}
```

Apply the same structure for `/profil`, `/candidatures`, and `/alertes` using the spec labels.

- [ ] **Step 6: Implement apply modal action**

Create `src/features/applications/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function applyToJob(jobId: string, cvPath: string) {
  if (!cvPath) {
    return { ok: false, message: "Ajoutez votre CV pour postuler." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    return { ok: false, message: "Connectez-vous pour postuler." };
  }

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    candidate_id: userResult.user.id,
    cv_path: cvPath
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/candidat/candidatures");
  return { ok: true, message: "Candidature envoyée." };
}
```

- [ ] **Step 7: Run candidate checks**

Run:

```bash
npm test -- tests/smoke/candidate-completion.test.ts
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 8: Verify in Chrome**

Run `npm run dev`, open Chrome to `/candidat/dashboard`, `/candidat/profil`, `/candidat/candidatures`, `/candidat/alertes`, and compare against the audited skeleton: sidebar, completion card, profile tabs, applications empty state, alert form.

- [ ] **Step 9: Commit candidate slice**

```bash
git add app src/features/candidate src/features/applications tests/smoke/candidate-completion.test.ts
git commit -m "feat: add candidate workspace"
```

---

### Task 6: Recruiter Workspace

**Files:**
- Create: `app/(recruiter)/recruteur/layout.tsx`
- Create: `app/(recruiter)/recruteur/dashboard/page.tsx`
- Create: `app/(recruiter)/recruteur/offres/page.tsx`
- Create: `app/(recruiter)/recruteur/offres/nouvelle/page.tsx`
- Create: `src/features/recruiter/components/recruiter-sidebar.tsx`
- Create: `src/features/jobs/actions.ts`
- Test: `tests/smoke/job-status.test.ts`

- [ ] **Step 1: Write job status transition test**

Create `tests/smoke/job-status.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { nextJobStatusAfterSubmit } from "@/features/jobs/status";

describe("job status transitions", () => {
  it("submits drafts for admin review", () => {
    expect(nextJobStatusAfterSubmit("draft")).toBe("pending_review");
  });
});
```

- [ ] **Step 2: Implement status helper**

Create `src/features/jobs/status.ts`:

```ts
import type { JobStatus } from "@/types/database";

export function nextJobStatusAfterSubmit(current: JobStatus): JobStatus {
  if (current === "draft" || current === "rejected") return "pending_review";
  return current;
}
```

- [ ] **Step 3: Implement recruiter shell and pages**

Use `requireRole(["recruiter"])` in `app/(recruiter)/recruteur/layout.tsx`. Implement dashboard, offers, and new offer pages with the previously approved recruiter UX: quotas, empty states, status tabs, method picker, and manual form.

- [ ] **Step 4: Implement create job action**

Create `src/features/jobs/actions.ts` with a server action that validates role, company ownership, required title/contract/city/sector fields, and inserts `status = "pending_review"` on publish.

- [ ] **Step 5: Run recruiter checks**

Run:

```bash
npm test -- tests/smoke/job-status.test.ts
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 6: Verify in Chrome**

Open `/recruteur/dashboard`, `/recruteur/offres`, and `/recruteur/offres/nouvelle`. Confirm the offer form persists to Supabase and new offers appear as `pending_review`.

- [ ] **Step 7: Commit recruiter slice**

```bash
git add app src/features/recruiter src/features/jobs tests/smoke/job-status.test.ts
git commit -m "feat: add recruiter workspace"
```

---

### Task 7: Admin Moderation

**Files:**
- Create: `app/(admin)/admin/layout.tsx`
- Create: `app/(admin)/admin/page.tsx`
- Create: `app/(admin)/admin/offres/page.tsx`
- Create: `src/features/admin/actions.ts`
- Test: `tests/smoke/admin-review.test.ts`

- [ ] **Step 1: Write admin review test**

Create `tests/smoke/admin-review.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeReviewDecision } from "@/features/admin/review";

describe("admin review decision", () => {
  it("maps approve to published job status", () => {
    expect(normalizeReviewDecision("approve")).toBe("published");
  });

  it("maps reject to rejected job status", () => {
    expect(normalizeReviewDecision("reject")).toBe("rejected");
  });
});
```

- [ ] **Step 2: Implement review helper**

Create `src/features/admin/review.ts`:

```ts
import type { JobStatus } from "@/types/database";

export type ReviewDecision = "approve" | "reject";

export function normalizeReviewDecision(decision: ReviewDecision): JobStatus {
  return decision === "approve" ? "published" : "rejected";
}
```

- [ ] **Step 3: Implement admin actions**

Create `src/features/admin/actions.ts` with server actions `reviewJob(jobId, decision, note)` and `reviewCompany(companyId, decision, note)`. Each action must call `requireRole(["admin"])`, update the reviewed record, and insert an `admin_reviews` row.

- [ ] **Step 4: Implement admin pages**

Use tables with pending jobs and companies. Columns: title/name, owner, status, created date, approve, reject.

- [ ] **Step 5: Run admin checks**

Run:

```bash
npm test -- tests/smoke/admin-review.test.ts
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit admin slice**

```bash
git add app src/features/admin tests/smoke/admin-review.test.ts
git commit -m "feat: add admin moderation"
```

---

### Task 8: Final Verification And Deployment Readiness

**Files:**
- Create: `.env.example`
- Create: `tests/e2e/jobmada-smoke.md`
- Modify: `README.md`

- [ ] **Step 1: Create environment example**

Create `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 2: Create manual Chrome QA checklist**

Create `tests/e2e/jobmada-smoke.md`:

```md
# JobMada Chrome Smoke Checklist

- Public `/emploi`: search, contract filter, city filter, job detail.
- Candidate `/candidat/dashboard`: sidebar, onboarding, recent jobs.
- Candidate `/candidat/profil`: CV upload card, personal fields, tabs.
- Candidate apply modal: no CV blocks submission.
- Recruiter `/recruteur/offres/nouvelle`: create offer, status becomes pending review.
- Admin `/admin/offres`: approve offer, public job appears.
```

- [ ] **Step 3: Run final automated checks**

Run:

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Run Chrome verification**

Use Chrome plugin with the local dev server. Capture desktop and mobile screenshots for public, candidate profile, recruiter offer creation, and admin moderation. Fix layout defects before handoff.

- [ ] **Step 5: Commit verification docs**

```bash
git add .env.example tests/e2e README.md
git commit -m "docs: add JobMada full-stack verification guide"
```

---

## Self-Review

Spec coverage:

- Next.js + Supabase clean rebuild: Tasks 1-3.
- Supabase empty project setup: Task 2.
- Public jobboard: Task 4.
- Candidate area from Chrome audit: Task 5.
- Recruiter workspace: Task 6.
- Admin moderation: Task 7.
- Testing and Chrome verification: Task 8.

No unresolved implementation notes are left in this plan. Names introduced in later tasks match earlier file paths and helper names. The plan intentionally keeps payments, real AI CV parsing, and email automation outside V1, matching the approved spec.
