# JobMada V1 Operationnelle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer l'etat actuel de JobMada en V1 operationnelle: parcours public, candidat, recruteur et admin persistants, boutons visibles fonctionnels, RLS verifiee, et release deployable.

**Architecture:** Garder la stack existante Next.js App Router + Supabase. Avancer par vertical slices testees: schema/RLS, action serveur, UI, test smoke, puis verification navigateur. Les fonctionnalites payantes qui ne peuvent pas etre monetisees immediatement doivent devenir des demandes de changement de plan tracees en base, pas des boutons decoratifs.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase Auth/Postgres/Storage/RLS, Vitest, tests RLS SQL ou integration Supabase locale, Playwright/browser smoke, Vercel.

---

## Etat Verifie Le 2026-05-12

Commandes passees:

- `npm test`: 20 fichiers, 59 tests passes.
- `npm run typecheck`: passe.
- `npm run build`: passe.
- `git diff --check`: passe.

Fonctionnel aujourd'hui:

- Auth: connexion, inscription candidat/recruteur, sessions demo locales, guards par role.
- Public: accueil, liste d'offres, detail d'offre, CTA de candidature selon etat candidat.
- Candidat: profil de base, upload CV prive, alertes emploi, liste des candidatures.
- Recruteur: profil entreprise, soumission entreprise en revue, creation d'offre en `pending_review`, archivage, liste d'offres, changement de statut de candidature.
- Admin: compteurs, moderation entreprises/offres, fonctions SQL transactionnelles `review_company` et `review_job`.
- Securite: RLS activee sur les tables metier, buckets `cvs`, `company-logos`, `company-covers`, triggers pour proteger roles/statuts/entitlements.

Lacunes V1:

- Plusieurs boutons visibles restent statiques: filtres publics, charger plus, profil candidat securite/parcours/competences, profil recruteur, logo entreprise, CVtheque, selection, abonnement, edition d'offre, brouillon, options de visibilite.
- La CVtheque est une page demo; les recruteurs voient seulement un `cv_path` de candidature, sans URL signee autorisee par RLS.
- Le detail d'offre affiche des textes generiques pour missions/profil au lieu du contenu stocke en base.
- Les quotas et plans sont affiches mais peu appliques; les boutons de changement de plan ne creent aucun etat.
- Les tests RLS actuels lisent surtout le SQL; il manque une verification runtime des politiques avec utilisateurs candidate/recruiter/admin.

---

## File Structure

### Schema et securite

- Modify: `supabase/migrations/20260509_initial_schema.sql`
  - Ajouter politiques Storage permettant au recruteur proprietaire d'une offre de lire uniquement les CV des candidatures recues.
  - Ajouter tables de support si necessaire: `plan_change_requests`, `candidate_shortlists`, `job_metrics` ou `recruiter_saved_candidates`.
- Modify: `src/types/database.ts`
  - Ajouter types utilises par les nouvelles actions.
- Create: `tests/rls/jobmada-rls.test.ts`
  - Verifier les politiques par role contre une base Supabase locale ou un client mock contractuel.
- Create: `supabase/config.toml`
  - Normaliser le demarrage local Supabase pour tests RLS et seed.

### Public

- Modify: `src/features/jobs/queries.ts`
  - Ajouter pagination, filtre entreprise, tri, compteur total.
- Modify: `app/(public)/emploi/page.tsx`
  - Transformer les filtres en vrai formulaire GET et remplacer `Charger plus` par pagination.
- Modify: `app/(public)/emploi/[slug]/page.tsx`
  - Afficher `description`, `missions`, `profile`, salaire et dates depuis Supabase.
- Test: `tests/smoke/job-filters.test.ts`
- Test: `tests/smoke/public-job-detail.test.ts`

### Candidat

- Modify: `supabase/migrations/20260509_initial_schema.sql`
  - S'assurer que `candidate_experiences`, `candidate_educations`, `candidate_skills`, `saved_jobs` et `job_alerts` couvrent les actions V1.
- Modify: `src/features/candidate/actions.ts`
  - Ajouter CRUD experiences, formations, competences, alertes, suppression CV, sauvegarde d'offres, update mot de passe.
- Modify: `app/(candidate)/candidat/profil/page.tsx`
  - Cablage des boutons parcours, competences, securite.
- Modify: `app/(candidate)/candidat/alertes/page.tsx`
  - Ajouter pause/reprise/suppression.
- Modify: `app/(candidate)/candidat/candidatures/page.tsx`
  - Ajouter filtres par statut et feedback lisible.
- Test: `tests/smoke/candidate-actions.test.ts`
- Test: `tests/smoke/candidate-profile-sections.test.ts`

### Recruteur

- Modify: `src/features/jobs/actions.ts`
  - Ajouter edition, brouillon, duplication, desarchivage, controle quota, validations longueur contenu.
- Create: `app/(recruiter)/recruteur/offres/[id]/modifier/page.tsx`
  - Edition d'une offre existante.
- Modify: `app/(recruiter)/recruteur/offres/page.tsx`
  - Cablage recherche, tri, lien modifier vers la vraie route, actions archive/desarchive.
- Modify: `app/(recruiter)/recruteur/offres/nouvelle/page.tsx`
  - Bouton brouillon operationnel, quota dynamique, options payantes redirigeant vers demande de plan.
- Modify: `src/features/applications/actions.ts`
  - Ajouter creation d'URL signee CV apres verification recruteur/offre.
- Modify: `src/features/applications/queries.ts`
  - Ajouter filtres et metadonnees candidature.
- Modify: `app/(recruiter)/recruteur/candidatures/page.tsx`
  - Cablage recherche/statuts, lien de consultation CV, notes internes.
- Modify: `app/(recruiter)/recruteur/cvtheque/page.tsx`
  - Remplacer profils demo par recherche autorisee, ou transformer en page d'upgrade sans faux resultats.
- Modify: `app/(recruiter)/recruteur/selection/page.tsx`
  - Persister les candidats sauvegardes.
- Modify: `app/(recruiter)/recruteur/profil/page.tsx`
  - Sauvegarde profil et changement mot de passe.
- Modify: `app/(recruiter)/recruteur/entreprise/page.tsx`
  - Upload logo/couverture, bouton annuler, preview publique.
- Test: `tests/smoke/job-actions.test.ts`
- Test: `tests/smoke/application-actions.test.ts`
- Test: `tests/smoke/recruiter-workspace-actions.test.ts`

### Admin et plans

- Modify: `src/features/admin/actions.ts`
  - Renvoyer les erreurs admin sous forme visible, forcer note de rejet, revalider tous les espaces touches.
- Modify: `app/(admin)/admin/offres/page.tsx`
  - Ajouter note de rejet, detail offre, historique decisions.
- Modify: `app/(admin)/admin/entreprises/page.tsx`
  - Ajouter note de rejet, detail entreprise, historique decisions.
- Create: `app/(admin)/admin/utilisateurs/page.tsx`
  - Rendre le lien utilisateurs operationnel ou retirer le lien du layout.
- Modify: `app/(admin)/admin/layout.tsx`
  - Remplacer `aria-disabled` par vraie route ou retirer l'entree.
- Modify: `app/(recruiter)/recruteur/abonnement/page.tsx`
  - Les boutons `Choisir` creent une demande de plan.
- Create: `src/features/subscriptions/actions.ts`
  - Demander plan, annuler demande, admin approuve/rejette.
- Test: `tests/smoke/admin-review.test.ts`
- Test: `tests/smoke/subscription-actions.test.ts`

### Verification release

- Modify: `tests/e2e/jobmada-smoke.md`
  - Ajouter parcours non-demo et verification des boutons V1.
- Create: `tests/e2e/jobmada-v1.spec.ts`
  - Playwright: public browse, signup/login, candidat apply, recruteur create/review, admin moderation.
- Modify: `README.md`
  - Procedure V1: Supabase local, migrations, seed, env, build, deploy.

---

## Task 1: Securite Runtime RLS Et Acces CV

**Files:**
- Modify: `supabase/migrations/20260509_initial_schema.sql`
- Modify: `src/types/database.ts`
- Create: `tests/rls/jobmada-rls.test.ts`
- Modify: `package.json`

- [ ] Ajouter un script de test RLS distinct, par exemple `test:rls`, qui peut etre lance apres demarrage Supabase local.
- [ ] Ajouter une politique Storage `cvs_select_applicant_owner_recruiter_or_admin` permettant a un recruteur de lire un CV seulement s'il existe une candidature dont `applications.cv_path = storage.objects.name` et `owns_job(applications.job_id)`.
- [ ] Verifier que les candidats ne peuvent pas lire les CV d'autres candidats.
- [ ] Verifier que les recruteurs ne peuvent pas lire les CV sans candidature recue.
- [ ] Verifier que les admins gardent l'acces moderation.
- [ ] Executer `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`.

**Acceptance:** Le recruteur peut ouvrir le CV d'un candidat ayant postule a son offre, sans elargir l'acces aux autres CV.

## Task 2: Public Jobboard Entierement Operable

**Files:**
- Modify: `src/features/jobs/queries.ts`
- Modify: `app/(public)/emploi/page.tsx`
- Modify: `app/(public)/emploi/[slug]/page.tsx`
- Modify: `tests/smoke/job-filters.test.ts`
- Create: `tests/smoke/public-job-detail.test.ts`

- [ ] Etendre `JobFilters` avec `company`, `urgent`, `page`, `pageSize`, `sort`.
- [ ] Faire porter les filtres publics par un formulaire GET unique.
- [ ] Remplacer `Charger plus d'offres` par une pagination conservant les filtres.
- [ ] Afficher les champs reels `description`, `missions`, `profile`, `salary_range`, `location_detail`, `expires_at`.
- [ ] Corriger les liens entreprise pour qu'ils filtrent vraiment les offres.
- [ ] Garder le fallback demo uniquement pour resilience locale, avec message non trompeur si Supabase est vide.
- [ ] Executer tests, typecheck, build.

**Acceptance:** Tous les controles visibles de `/emploi` et `/emploi/[slug]` modifient l'etat ou naviguent vers un resultat utile.

## Task 3: Profil Candidat Complet

**Files:**
- Modify: `src/features/candidate/actions.ts`
- Modify: `app/(candidate)/candidat/profil/page.tsx`
- Modify: `src/features/candidate/completion.ts`
- Modify: `tests/smoke/candidate-actions.test.ts`
- Create: `tests/smoke/candidate-profile-sections.test.ts`

- [ ] Ajouter actions serveur pour experiences, formations et competences.
- [ ] Remplacer les boutons `Ajouter une experience` et `Ajouter une formation` par formulaires persistants.
- [ ] Enregistrer les champs competences/langues dans `candidate_skills`.
- [ ] Ajouter suppression de CV et recalcul completion.
- [ ] Cacher ou cabler `Modifier le mot de passe` via Supabase Auth.
- [ ] Executer tests, typecheck, build.

**Acceptance:** Le profil candidat ne contient plus de bouton decoratif; les donnees saisies sont relues depuis Supabase apres rechargement.

## Task 4: Alertes Et Candidatures Candidat

**Files:**
- Modify: `src/features/candidate/actions.ts`
- Modify: `app/(candidate)/candidat/alertes/page.tsx`
- Modify: `app/(candidate)/candidat/candidatures/page.tsx`
- Modify: `tests/smoke/candidate-actions.test.ts`

- [ ] Ajouter pause/reprise/suppression d'alertes.
- [ ] Ajouter filtre de candidatures par statut.
- [ ] Afficher l'erreur/succes apres chaque action.
- [ ] Verifier qu'un candidat ne peut modifier que ses alertes.
- [ ] Executer tests, typecheck, build.

**Acceptance:** L'espace candidat permet de gerer ses alertes et de suivre ses candidatures sans action morte.

## Task 5: Cycle De Vie Offre Recruteur

**Files:**
- Modify: `src/features/jobs/actions.ts`
- Create: `app/(recruiter)/recruteur/offres/[id]/modifier/page.tsx`
- Modify: `app/(recruiter)/recruteur/offres/page.tsx`
- Modify: `app/(recruiter)/recruteur/offres/nouvelle/page.tsx`
- Modify: `tests/smoke/job-actions.test.ts`

- [ ] Ajouter `saveDraftJob`, `updateRecruiterJob`, `duplicateRecruiterJob`, `unarchiveRecruiterJob`.
- [ ] Appliquer le quota avant creation ou publication.
- [ ] Diriger `Modifier` vers la route d'edition de l'offre.
- [ ] Rendre `Enregistrer en brouillon` persistant.
- [ ] Transformer les boutons options payantes en demande de plan ou les masquer pour le plan gratuit.
- [ ] Executer tests, typecheck, build.

**Acceptance:** Un recruteur peut creer, sauvegarder, editer, soumettre, archiver et restaurer ses offres dans les limites de son plan.

## Task 6: Candidatures Recruteur Et CV Autorises

**Files:**
- Modify: `src/features/applications/actions.ts`
- Modify: `src/features/applications/queries.ts`
- Modify: `app/(recruiter)/recruteur/candidatures/page.tsx`
- Modify: `tests/smoke/application-actions.test.ts`
- Create: `tests/smoke/recruiter-cv-access.test.ts`

- [ ] Ajouter action `createRecruiterCandidateCvSignedUrl(applicationId)`.
- [ ] Verifier role recruteur, ownership de l'offre, et existence de la candidature avant signature.
- [ ] Ajouter filtre par statut/offre/recherche sur `/recruteur/candidatures`.
- [ ] Ajouter lien `Voir le CV` uniquement quand l'acces est autorise.
- [ ] Ajouter notes internes recruteur si retenues pour V1.
- [ ] Executer tests, typecheck, build.

**Acceptance:** Les recruteurs peuvent traiter les candidatures et consulter uniquement les CV autorises.

## Task 7: Entreprise, Profil Recruteur, CVtheque Et Selection

**Files:**
- Modify: `src/features/recruiter/company-actions.ts`
- Modify: `app/(recruiter)/recruteur/entreprise/page.tsx`
- Modify: `app/(recruiter)/recruteur/profil/page.tsx`
- Modify: `app/(recruiter)/recruteur/cvtheque/page.tsx`
- Modify: `app/(recruiter)/recruteur/selection/page.tsx`
- Create: `src/features/recruiter/profile-actions.ts`
- Create: `src/features/recruiter/selection-actions.ts`
- Create: `tests/smoke/recruiter-profile-actions.test.ts`
- Create: `tests/smoke/recruiter-selection-actions.test.ts`

- [ ] Ajouter upload logo/couverture sur buckets publics avec chemin `companyId/file`.
- [ ] Enregistrer profil recruteur et changement mot de passe.
- [ ] Remplacer CVtheque demo par resultats autorises ou par gate d'abonnement clair.
- [ ] Persister `Ma selection` pour les profils visibles au recruteur.
- [ ] Cacher les recherches populaires si elles ne declenchent pas une recherche.
- [ ] Executer tests, typecheck, build.

**Acceptance:** Aucun bouton recruteur visible ne reste un simple `type="button"` sans effet.

## Task 8: Abonnements V1 Sans Paiement Direct

**Files:**
- Modify: `supabase/migrations/20260509_initial_schema.sql`
- Create: `src/features/subscriptions/actions.ts`
- Modify: `app/(recruiter)/recruteur/abonnement/page.tsx`
- Modify: `app/(admin)/admin/page.tsx`
- Create: `app/(admin)/admin/abonnements/page.tsx`
- Create: `tests/smoke/subscription-actions.test.ts`

- [ ] Ajouter `plan_change_requests` avec RLS: recruteur cree pour son entreprise, admin lit/traite.
- [ ] Les boutons `Choisir` creent une demande de plan.
- [ ] Admin approuve/rejette et met a jour `subscriptions`.
- [ ] Les quotas visibles lisent `subscriptions`, pas des valeurs hardcodees.
- [ ] Executer tests, typecheck, build.

**Acceptance:** La montee en plan existe en mode manuel auditable, sans promettre un paiement automatique absent.

## Task 9: Admin Moderation Et Rejets Utilisables

**Files:**
- Modify: `src/features/admin/actions.ts`
- Modify: `app/(admin)/admin/offres/page.tsx`
- Modify: `app/(admin)/admin/entreprises/page.tsx`
- Modify: `app/(admin)/admin/layout.tsx`
- Create: `app/(admin)/admin/utilisateurs/page.tsx`
- Modify: `tests/smoke/admin-review.test.ts`

- [ ] Ajouter note obligatoire au rejet.
- [ ] Afficher l'historique `admin_reviews` sur les lignes moderees ou pages detail.
- [ ] Exposer la raison de rejet au recruteur.
- [ ] Rendre `Utilisateurs` operationnel ou retirer l'entree.
- [ ] Afficher les erreurs de RPC au lieu de les avaler silencieusement.
- [ ] Executer tests, typecheck, build.

**Acceptance:** L'admin peut expliquer chaque rejet, et le recruteur sait quoi corriger.

## Task 10: QA V1 Et Release

**Files:**
- Modify: `tests/e2e/jobmada-smoke.md`
- Create: `tests/e2e/jobmada-v1.spec.ts`
- Modify: `README.md`
- Modify: `.env.example`

- [ ] Ajouter smoke Playwright sur public, candidat, recruteur, admin.
- [ ] Ajouter checklist manuelle non-demo avec comptes Supabase seedes.
- [ ] Documenter Supabase local, migrations, seed, env, build et deploy Vercel.
- [ ] Verifier routes principales en navigateur desktop/mobile.
- [ ] Executer `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`.

**Acceptance:** La V1 est livrable avec une checklist reproductible, des tests automatises et une procedure de rollback/deploiement claire.

---

## Ordre Recommande

1. Task 1, car les acces CV/RLS conditionnent les parcours recruteur.
2. Task 2, car le public est l'entree principale.
3. Tasks 3 et 4, pour rendre le candidat complet.
4. Tasks 5 et 6, pour rendre le recruteur complet.
5. Tasks 7 et 8, pour eliminer les pages/boutons demo ou payants non operationnels.
6. Task 9, pour finaliser la moderation.
7. Task 10, pour figer la release.

## Definition Of Done V1

- Tous les boutons visibles declenchent une action, une navigation utile, ou sont retires.
- Les donnees saisies dans les espaces connectes persistent en base et survivent au reload.
- Les offres publiques viennent d'entreprises verifiees; les offres non publiees restent invisibles.
- Un candidat peut s'inscrire, completer son profil, uploader son CV, postuler et suivre son dossier.
- Un recruteur peut s'inscrire, completer son entreprise, gerer ses offres, recevoir des candidatures, changer les statuts et ouvrir les CV autorises.
- Un admin peut moderer entreprises/offres, expliquer les rejets et auditer les decisions.
- Les politiques RLS sont testees en runtime, pas seulement detectees dans le SQL.
- `npm test`, `npm run typecheck`, `npm run build`, `git diff --check` passent avant de taguer la V1.
