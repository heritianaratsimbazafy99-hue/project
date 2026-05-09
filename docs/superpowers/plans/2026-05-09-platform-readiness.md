# JobMada Platform Readiness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Commit and push every verified tranche before moving to the next one.

**Goal:** Bring the current JobMada implementation to a production-ready MVP: real user journeys, real Supabase persistence, recruiter and candidate workspaces that behave consistently, and a UI that stays close to the Asako.mg reference already audited in Chrome.

**Architecture:** Continue with the existing Next.js App Router + Supabase stack. Avoid new SQL unless the feature genuinely needs schema, policy, or storage changes. Prefer vertical slices with tests first, then implementation, then browser/build verification.

**Tech Stack:** Next.js App Router, TypeScript, Supabase SSR/Auth/Postgres/RLS, Vitest, browser smoke checks, Vercel deployment.

---

## Readiness Milestones

### 1. Recruiter Application Workflow

Enable recruiters to act on received applications from `/recruteur/candidatures`.

- [ ] Add a tested server action for recruiter-owned application status changes.
- [ ] Expose actions for viewed, shortlisted, rejected, interview, and hired states.
- [ ] Revalidate recruiter dashboard and applications pages after each update.
- [ ] Keep the UI compact and close to the existing Asako recruiter workspace.

### 2. Public Job Application Flow

Make the job detail page a real candidate entrypoint.

- [ ] Show the apply CTA based on authentication and candidate profile state.
- [ ] Let real candidates apply with their stored CV path.
- [ ] Surface duplicate, missing CV, unavailable job, and success states clearly.
- [ ] Revalidate candidate application history after applying.

### 3. Candidate CV Storage

Replace placeholder CV path handling with a real upload path.

- [ ] Add the required Supabase Storage bucket/policies only if they are not already in executed SQL.
- [ ] Upload candidate CVs under a user-scoped path.
- [ ] Store the resulting path in `candidate_profiles.cv_path`.
- [ ] Prepare recruiter access through controlled signed URLs.

### 4. Recruiter Offer Lifecycle

Finish the operational offer flow.

- [ ] Support editing existing recruiter jobs.
- [ ] Support archive/unarchive or close actions.
- [ ] Keep submitted jobs in pending review unless the company or role allows publishing.
- [ ] Keep quota feedback consistent across dashboard, offer list, and new offer page.

### 5. Admin Moderation Loop

Complete the back-office readiness path.

- [ ] Verify company review, job review, and rejection states end-to-end.
- [ ] Make moderation actions visible from admin dashboards.
- [ ] Ensure rejected entities can display a useful reason where available.

### 6. Connected Workspace Polish

Bring connected candidate/recruiter pages back in line with the Asako.mg reference.

- [ ] Audit dashboard density, font scale, icon scale, spacing, and card shapes.
- [ ] Fix pages that still look like temporary implementation screens.
- [ ] Keep empty states helpful without oversized marketing styling.
- [ ] Validate desktop and mobile screenshots against the reference proportions.

### 7. Production Verification

Run the final platform readiness pass.

- [ ] Run full tests, typecheck, and production build.
- [ ] Smoke test public, candidate, recruiter, and admin journeys.
- [ ] Verify demo accounts and real Supabase auth paths.
- [ ] Push final branch state and verify the Vercel deployment.

---

## Definition Of Ready

- Public visitors can browse jobs and companies without demo-only data.
- Candidates can sign up, complete a profile, upload/reference a CV, apply, and track applications.
- Recruiters can sign up, complete their company, post offers, receive applications, and manage statuses.
- Admins can moderate companies and offers.
- The platform survives a production build and browser smoke test.
- The visual density remains close to Asako.mg, especially connected workspaces.
