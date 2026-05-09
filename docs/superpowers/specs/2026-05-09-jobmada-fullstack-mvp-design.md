# JobMada Full-Stack MVP Design Spec

## Goal

Rebuild the current static JobMada prototype as a real full-stack marketplace using Next.js App Router and Supabase. The MVP must keep the visual and product direction already established for JobMada while replacing mocked data with authenticated users, persistent jobs, applications, candidate profiles, company profiles, CV uploads, and admin moderation.

The selected architecture is a clean rebuild, not a hybrid wrapper around the existing vanilla SPA.

## Approved Scope

The V1 marketplace includes four product areas:

- Public jobboard: dynamic home, job search, job detail, company directory, company profile, recruiter pricing.
- Candidate space: authenticated dashboard, profile/CV, applications, job alerts, apply flow.
- Recruiter space: authenticated dashboard, company profile, job creation/editing, job status management, applications received.
- Admin space: minimal moderation dashboard for job and company review.

The Supabase project already exists but is empty. The implementation must include setup from zero: database schema, RLS policies, Storage buckets, seed data, and environment configuration.

## Non-Goals For V1

- Paid billing integration and real payment collection.
- Full AI CV parsing or matching implementation. The UI should reserve the workflow, but the MVP may store parsed fields manually.
- Email delivery automation beyond database-backed alert records.
- Advanced recruiter analytics beyond basic counts.
- Multi-tenant agency sub-accounts.

## Technical Architecture

Use Next.js App Router with TypeScript. Prefer Server Components for read-heavy public pages and authenticated dashboards, with Client Components only for interactive forms, filters, tabs, uploads, and optimistic UI.

Use Supabase for:

- Auth: email/password magic or standard credentials, role stored in `profiles.role`.
- Postgres: source of truth for users, companies, jobs, candidates, applications, alerts, and moderation.
- Storage: CV files, company logos, company covers.
- RLS: strict user ownership and role-based access.

Use route groups to keep the app understandable:

- `(public)`: public pages.
- `(auth)`: sign-in and sign-up flows.
- `(candidate)`: candidate dashboard pages.
- `(recruiter)`: recruiter dashboard pages.
- `(admin)`: moderation pages.

## Proposed Routes

Public:

- `/`
- `/emploi`
- `/emploi/[slug]`
- `/entreprises`
- `/entreprises/[slug]`
- `/tarifs`

Auth:

- `/connexion`
- `/inscription/candidat`
- `/inscription/recruteur`

Candidate:

- `/candidat/dashboard`
- `/candidat/profil`
- `/candidat/candidatures`
- `/candidat/alertes`

Recruiter:

- `/recruteur/dashboard`
- `/recruteur/entreprise`
- `/recruteur/offres`
- `/recruteur/offres/nouvelle`
- `/recruteur/offres/[id]`
- `/recruteur/candidatures`
- `/recruteur/cvtheque`
- `/recruteur/abonnement`
- `/recruteur/profil`

Admin:

- `/admin`
- `/admin/offres`
- `/admin/entreprises`
- `/admin/utilisateurs`

## Data Model

Core tables:

- `profiles`: Supabase user profile, role, display name, contact info, onboarding completion.
- `candidate_profiles`: candidate-specific profile fields, city, sector, desired role, salary expectation, CV file path, profile completion.
- `candidate_experiences`: candidate work history.
- `candidate_educations`: candidate education history.
- `candidate_skills`: hard skills, soft skills, languages.
- `companies`: recruiter-owned companies, logo, cover, city, sector, description, moderation status.
- `jobs`: company job posts, title, slug, contract, city, sector, salary range, description, missions, profile, visibility options, status.
- `applications`: candidate applications to jobs, CV file path snapshot, status, message, timestamps.
- `saved_jobs`: candidate saved jobs.
- `job_alerts`: candidate alert filters.
- `subscriptions`: recruiter plan and quotas.
- `admin_reviews`: review history for moderated jobs and companies.

Status fields:

- `jobs.status`: `draft`, `pending_review`, `published`, `rejected`, `expired`, `archived`.
- `companies.status`: `incomplete`, `pending_review`, `verified`, `rejected`.
- `applications.status`: `submitted`, `viewed`, `shortlisted`, `rejected`, `interview`, `hired`.

## RLS Rules

Public users can read only published jobs and verified public company fields.

Candidates can:

- Read and update their own profile.
- Upload and read their own CV.
- Create applications for published jobs.
- Read their own applications, saved jobs, and alerts.

Recruiters can:

- Read and update their own company records.
- Create and manage jobs for companies they own.
- Read applications submitted to their jobs.
- Access limited candidate profile fields from submitted applications.

Admins can:

- Read and moderate all jobs, companies, profiles, and applications.
- Insert review records.

Storage buckets:

- `cvs`: private, candidate-owned upload paths.
- `company-logos`: public read, recruiter/admin write for owned companies.
- `company-covers`: public read, recruiter/admin write for owned companies.

## Public UX

The public side should keep the current JobMada visual language: blue-night brand base, green primary actions, yellow underline accents, violet/cyan secondary accents, rounded but professional surfaces, and the supplied JobMada logo.

Public pages become dynamic:

- Home pulls featured/latest jobs and company logos from Supabase.
- Job list supports query, contract, city, sector filters.
- Job detail includes breadcrumb, company summary, job metadata, content sections, and sticky application card.
- Only published jobs are public.

The current sticky right-rail behavior for urgent jobs and JobMada Pro remains part of the public page.

## Candidate UX Reference From Chrome Audit

The candidate area must reproduce the observed connected Asako candidate UX structure, adapted to JobMada branding and colors.

Candidate shell:

- Sticky/top public header remains visible.
- Left sidebar card includes avatar initial, role label, email, navigation, and active state.
- Sidebar nav: `Dashboard`, `Mon profil`, `Mes candidatures`, `Mes alertes`, `Déconnexion`.
- Progress card shows profile completion percentage and prompt to complete profile.

Dashboard:

- Greeting and welcome text.
- Onboarding card with four steps: account created, deposit CV, desired role, job alert.
- Progress indicator such as `1 étapes sur 4 complétées`.
- Recent jobs list to help the candidate start browsing.

Profile:

- CV upload card at the top, PDF/Word, 5 MB max.
- Tabs: `Infos personnelles`, `Parcours`, `Compétences`.
- Personal fields: first name, last name, email, phone, city.
- Professional fields: sector, desired role, salary expectation.
- Account security section with password change action.
- Journey tab with empty states for experiences and educations plus add buttons.
- Skills tab with hard skills, soft skills, and languages.

Applications:

- Empty state when no applications exist: title, short guidance, CTA to job list.
- Later state should list applications with job, company, date, and application status.

Alerts:

- Compact alert creation form: sector, city, contract, create button.
- Empty state when no alerts exist.

Apply flow:

- Job detail has a sticky `Postuler maintenant` CTA.
- If candidate is logged in but has no CV, open a centered modal requiring CV upload before applying.
- Modal includes connected email, job summary, CV guidance, dropzone, and CTA `Postuler avec ce CV`.
- Do not submit an application without a CV snapshot.

## Recruiter UX

Keep the previously implemented recruiter direction from the JobMada prototype:

- Dashboard with quotas, onboarding, empty state metrics, and activity panels.
- Offers page with status tabs and empty state.
- New offer flow with method picker and manual form.
- Manual form includes title, contract, city, location, salary range, internal reference, description, missions, profile, visibility options, and sticky submit actions.
- Applications page starts with empty state and later shows submitted applications.
- CVthèque exists as a plan-gated surface. V1 can show limited access and upsell while real candidate search can remain constrained to candidates who applied.
- Subscription page shows plan, quotas, and plan cards. Payment is not in V1.

## Admin UX

Admin is intentionally minimal:

- Overview counts: pending jobs, pending companies, users, applications.
- Jobs moderation table: title, company, recruiter, status, created date, approve, reject.
- Companies moderation table: company, owner, status, approve, reject.
- User list for support/debugging.

Admin actions must write `admin_reviews` records.

## Supabase Seed Data

Seed enough data to make the product usable locally:

- 8-12 companies with logos from the existing mock logo sheet or generated JobMada-compatible demo marks.
- 25-40 jobs across sectors, cities, and contracts.
- 1 recruiter user profile and company.
- 1 candidate user profile with incomplete onboarding.
- Optional admin user profile.

Seeds must avoid real private data from the Chrome audit. The audited account email should not be hard-coded into seed data.

## Security And Privacy

- Never expose private CV files publicly.
- Recruiters only see candidate details when there is an application to their job.
- Candidate email and phone are not public.
- Admin-only routes enforce admin role server-side.
- Server actions and route handlers must validate user session and role.
- Public search must not bypass job/company moderation status.

## Testing And Verification

Minimum verification:

- Unit/smoke tests for route guards and public data filters.
- Supabase SQL migration can run from a clean database.
- RLS smoke checks for candidate, recruiter, admin, and anonymous roles.
- Browser verification in Chrome for public job search, candidate profile/upload shell, apply modal, recruiter offer creation, and admin moderation.

Current static smoke tests should be replaced by Next.js/Supabase-aware tests during implementation.

## Implementation Boundaries

The existing `app.js` and `styles.css` are reference material, not the target architecture. The rebuild should introduce a structured Next.js codebase with reusable components and typed data access. Keep the JobMada logo asset and useful visual decisions from the current prototype.

## Open Implementation Questions

These do not block the design:

- Exact Supabase project URL and anon key.
- Whether the first auth method is password, magic link, or both.
- Whether the admin user will be created manually in Supabase or via seed script.

## Spec Self-Review

- No unresolved sections remain in the approved MVP scope.
- The candidate audit is documented without storing private session data.
- The architecture matches the approved Next.js + Supabase rebuild.
- The MVP is broad but bounded: billing, AI parsing, and email automation are explicitly out of V1.
- Security, RLS, and storage privacy are included before implementation planning.
