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

## Parcours principaux

- `/` charge les offres publiees depuis Supabase et garde les blocs sticky publics.
- `/emploi` propose recherche, filtres et cartes d'offres dynamiques.
- `/emploi/[slug]` affiche le detail d'une offre publiee par une entreprise verifiee.
- `/candidat/dashboard`, `/candidat/profil`, `/candidat/candidatures`, `/candidat/alertes` exigent le role candidat.
- `/recruteur/dashboard`, `/recruteur/offres`, `/recruteur/offres/nouvelle` exigent le role recruteur.
- `/admin`, `/admin/offres`, `/admin/entreprises` exigent le role admin.

## Securite Supabase

Le schema active RLS sur toutes les tables metier. Les points sensibles:

- les offres publiques ne sont lisibles que si l'offre est `published` et l'entreprise `verified`
- les recruteurs peuvent creer des offres `draft` ou `pending_review`, mais pas s'auto-publier
- les recruteurs peuvent envoyer leur entreprise en revue, mais pas la verifier eux-memes
- les candidats ne peuvent postuler qu'avec le CV rattache a leur profil
- la moderation admin passe par des fonctions Postgres transactionnelles qui verrouillent la ligne, mettent a jour le statut et creent l'audit `admin_reviews`

## Verification

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

La checklist manuelle complete est dans `tests/e2e/jobmada-smoke.md`.
