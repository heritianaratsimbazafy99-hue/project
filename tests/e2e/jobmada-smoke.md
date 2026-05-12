# JobMada Manual Smoke Checklist

Run this checklist after applying the Supabase migration and seed, then starting the app with `npm run dev`.

Use the `*.live@jobmada.mg` accounts for non-demo verification. The `*.demo@jobmada.mg` accounts still open the local demo cookie fallback when Supabase Auth is unavailable.

## Public jobboard

1. Open `/`.
2. Confirm the JobMada logo and palette load.
3. Confirm real jobs from Supabase appear in the main sections.
4. Scroll the page and confirm `Derniers jours pour postuler` and `JobMada Pro` keep the sticky rail behavior.
5. Open `/emploi`.
6. Search by title or summary.
7. Filter by contract, city, and sector.
8. Open a job detail page and confirm only published jobs from verified companies are visible.

## Candidate

1. Sign in as `candidat.live@jobmada.mg` with `jobmada-demo-password`.
2. Open `/candidat/dashboard`.
3. Confirm the sidebar mirrors the Asako candidate structure: dashboard, profil, candidatures, alertes.
4. Open `/candidat/profil`.
5. Confirm personal fields, professional fields, CV card, parcours, competences, langues and security blocks render.
6. Open `/candidat/candidatures`.
7. Confirm the seeded application appears.
8. Open `/candidat/alertes`.
9. Confirm the alert creation form and empty/list states render.
10. From a public job detail, submit a candidature only with the CV path attached to the candidate profile.
11. Pause, resume and delete an alert, then reload and confirm the state persists.

## Recruiter

1. Sign in as `recruteur.live@jobmada.mg` with `jobmada-demo-password`.
2. Open `/recruteur/dashboard`.
3. Confirm company state, quota card, onboarding steps and latest offers render.
4. If the company is incomplete or rejected, click `Envoyer en revue` and confirm `/admin/entreprises` receives it.
5. Open `/recruteur/offres`.
6. Confirm status tabs: all, draft, pending review, published, rejected.
7. Open `/recruteur/offres/nouvelle`.
8. Create an offer and confirm it lands in `pending_review` without featured or urgent flags.
9. Save another offer as draft, edit it from `/recruteur/offres/[id]/modifier`, duplicate it, archive it and restore it.
10. Open `/recruteur/candidatures` and confirm status/search filters update the listing.
11. If a candidate has applied with a CV, click `Voir le CV` and confirm the signed URL opens only for the owning recruiter.
12. Open `/recruteur/abonnement`, choose a paid plan and confirm a pending request appears instead of an immediate entitlement change.

## Admin

1. Sign in as `admin.live@jobmada.mg` with `jobmada-demo-password`.
2. Open `/admin`.
3. Confirm pending jobs, pending companies, pending plan requests, users and applications counts render.
4. Open `/admin/entreprises`.
5. Approve or reject a pending company and confirm an `admin_reviews` row is created.
6. Open `/admin/offres`.
7. Confirm each row shows job, company, recruiter, created date and actions.
8. Confirm jobs from unverified companies cannot be approved from the UI.
9. Approve a pending job from a verified company and confirm it appears on `/emploi`.
10. Reject a pending job and confirm it stays out of public listings.
11. Open `/admin/abonnements`, approve a pending plan request and confirm the company's `subscriptions` row changes.
12. Reject another plan request with a note and confirm the note is visible in the request history.

## Regression checks

1. Try opening candidate routes as recruiter/admin and confirm role guard redirects.
2. Try opening recruiter routes as candidate/admin and confirm role guard redirects.
3. Try opening admin routes as candidate/recruiter and confirm role guard redirects.
4. Confirm public Supabase reads do not expose published jobs from unverified companies.
5. Confirm rejected company/job notes are visible to the owning recruiter and not to unrelated recruiters.
6. Confirm `npm test`, `npm run test:rls`, `npm run typecheck`, `npm run build`, and `git diff --check` pass.
