# JobMada Manual Smoke Checklist

Run this checklist after applying the Supabase migration and seed, then starting the app with `npm run dev`.

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

1. Sign in as `candidat.demo@jobmada.mg` with `jobmada-demo-password`.
2. Open `/candidat/dashboard`.
3. Confirm the sidebar mirrors the Asako candidate structure: dashboard, profil, candidatures, alertes.
4. Open `/candidat/profil`.
5. Confirm personal fields, professional fields, CV card, parcours, competences, langues and security blocks render.
6. Open `/candidat/candidatures`.
7. Confirm the seeded application appears.
8. Open `/candidat/alertes`.
9. Confirm the alert creation form and empty/list states render.
10. From a public job detail, submit a candidature only with the CV path attached to the candidate profile.

## Recruiter

1. Sign in as `recruteur.demo@jobmada.mg` with `jobmada-demo-password`.
2. Open `/recruteur/dashboard`.
3. Confirm company state, quota card, onboarding steps and latest offers render.
4. If the company is incomplete or rejected, click `Envoyer en revue` and confirm `/admin/entreprises` receives it.
5. Open `/recruteur/offres`.
6. Confirm status tabs: all, draft, pending review, published, rejected.
7. Open `/recruteur/offres/nouvelle`.
8. Create an offer and confirm it lands in `pending_review` without featured or urgent flags.

## Admin

1. Sign in as `admin.demo@jobmada.mg` with `jobmada-demo-password`.
2. Open `/admin`.
3. Confirm pending jobs, pending companies, users and applications counts render.
4. Open `/admin/entreprises`.
5. Approve or reject a pending company and confirm an `admin_reviews` row is created.
6. Open `/admin/offres`.
7. Confirm each row shows job, company, recruiter, created date and actions.
8. Confirm jobs from unverified companies cannot be approved from the UI.
9. Approve a pending job from a verified company and confirm it appears on `/emploi`.
10. Reject a pending job and confirm it stays out of public listings.

## Regression checks

1. Try opening candidate routes as recruiter/admin and confirm role guard redirects.
2. Try opening recruiter routes as candidate/admin and confirm role guard redirects.
3. Try opening admin routes as candidate/recruiter and confirm role guard redirects.
4. Confirm public Supabase reads do not expose published jobs from unverified companies.
5. Confirm `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check` pass.
