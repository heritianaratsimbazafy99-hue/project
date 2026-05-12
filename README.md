# JobMada Full-Stack MVP

JobMada est maintenant une application Next.js + Supabase avec trois espaces:

- public: page d'accueil dynamique, liste d'offres, detail d'offre et colonne sticky `Derniers jours pour postuler` / `JobMada Pro`
- candidat: dashboard, profil, candidatures, alertes et depot de CV
- recruteur: dashboard, offres, creation d'offre, quota et soumission d'entreprise en revue
- admin: moderation des entreprises et des offres avec audit en base

Les anciens fichiers statiques (`index.html`, `app.js`, `styles.css`) restent dans le depot comme snapshot historique. L'application active est dans `app/` et `src/`.

## Stack

- Next.js App Router
- React 19
- Supabase Auth, Postgres, RLS et Storage
- Vitest pour les tests smoke

## Configuration locale

1. Installer les dependances:

```bash
npm install
```

2. Copier les variables d'environnement:

```bash
cp .env.example .env.local
```

3. Renseigner `.env.local` avec les valeurs du projet Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Appliquer le schema dans Supabase.

Depuis le SQL Editor Supabase, executer:

- `supabase/migrations/20260509_initial_schema.sql`
- puis `supabase/seed.sql`

Avec la CLI Supabase, l'equivalent est:

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Pour une base Supabase locale reproductible:

```bash
supabase start
supabase db reset
export SUPABASE_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

5. Lancer Next.js:

```bash
npm run dev
```

## Comptes demo seedes

Mot de passe commun:

```text
jobmada-demo-password
```

Comptes:

- `candidat.demo@jobmada.mg`
- `recruteur.demo@jobmada.mg`
- `admin.demo@jobmada.mg`

Comptes Supabase non-demo seedes pour la checklist V1:

- `candidat.live@jobmada.mg`
- `recruteur.live@jobmada.mg`
- `admin.live@jobmada.mg`

## Parcours principaux

- `/` charge les offres publiees depuis Supabase et garde les blocs sticky publics.
- `/emploi` propose recherche, filtres et cartes d'offres dynamiques.
- `/emploi/[slug]` affiche le detail d'une offre publiee par une entreprise verifiee.
- `/candidat/dashboard`, `/candidat/profil`, `/candidat/candidatures`, `/candidat/alertes` exigent le role candidat.
- `/recruteur/dashboard`, `/recruteur/offres`, `/recruteur/offres/nouvelle`, `/recruteur/candidatures`, `/recruteur/selection`, `/recruteur/abonnement` exigent le role recruteur.
- `/admin`, `/admin/offres`, `/admin/entreprises`, `/admin/abonnements`, `/admin/utilisateurs` exigent le role admin.

## Securite Supabase

Le schema active RLS sur toutes les tables metier. Les points sensibles:

- les offres publiques ne sont lisibles que si l'offre est `published` et l'entreprise `verified`
- les recruteurs peuvent creer des offres `draft` ou `pending_review`, mais pas s'auto-publier
- les recruteurs peuvent envoyer leur entreprise en revue, mais pas la verifier eux-memes
- les candidats ne peuvent postuler qu'avec le CV rattache a leur profil
- les recruteurs peuvent lire uniquement les CV des candidatures recues sur leurs propres offres
- les changements de plan passent par `plan_change_requests`; seul l'admin applique les nouveaux quotas dans `subscriptions`
- la moderation admin passe par des fonctions Postgres transactionnelles qui verrouillent la ligne, mettent a jour le statut et creent l'audit `admin_reviews`

## Verification

```bash
npm test
npm run test:rls # necessite SUPABASE_DB_URL et une base Supabase locale lancee
npm run typecheck
npm run build
git diff --check
```

La checklist manuelle complete est dans `tests/e2e/jobmada-smoke.md`.

## Deploiement Vercel

1. Verifier que `npm test`, `npm run typecheck`, `npm run build` et `git diff --check` passent.
2. Configurer `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans les variables Vercel.
3. Appliquer les migrations SQL et le seed sur la base cible avant de promouvoir la release.
4. Deployer avec l'integration Git Vercel ou `vercel deploy --prod`.
5. Rollback: restaurer le deploiement Vercel precedent et, si besoin, restaurer un backup Supabase pris avant migration.
