# Asako Candidate Reference Refactor Plan

Date: 2026-05-12

## Objectif

Refondre uniquement l'espace candidat JobMada pour le rapprocher de la reference Asako observee sur `https://www.asako.mg/candidat/dashboard`, sans modifier les pages publiques, recruteur ou admin.

## Analyse Reference

- Shell: header blanc global avec logo, liens emploi, bouton compte sombre, puis layout deux colonnes avec sidebar fixe et contenu compact.
- Palette: fond tres clair lavande, texte principal violet-navy, accent rose pour l'etat actif et les CTAs secondaires, vert uniquement pour le profil complet ou les toggles actifs.
- Sidebar: carte compte compacte, label `Mon Asako`, navigation a icones, badge alerte rose, separation avant `Deconnexion`, puis carte progression en bloc vert pale avec jauge circulaire.
- Dashboard: titre court `Bienvenue, Prenom`, grand panneau `Vos prochaines pistes`, cartes offres en grille 2 colonnes, puis tableau `Dernieres candidatures`.
- Profil: carte CV analysee en premier, chips de competences, actions `Tout est bon` et `Voir mon CV`, tabs horizontaux avec soulignement rose, formulaire sobre en carte blanche.
- Candidatures: page table-first, titre avec compteur, colonnes `Poste / Contrat / Date / Statut / Match`, ligne compacte.
- Alertes: formulaire court `Creer une alerte` avec secteur, ville, contrat, bouton rose, puis tableau secteur-ville-contrat-statut-actions.

## Perimetre Autorise

- `app/(candidate)/candidat/layout.tsx`
- `app/(candidate)/candidat/dashboard/page.tsx`
- `app/(candidate)/candidat/profil/page.tsx`
- `app/(candidate)/candidat/candidatures/page.tsx`
- `app/(candidate)/candidat/alertes/page.tsx`
- `src/features/candidate/components/candidate-sidebar.tsx`
- `src/features/candidate/components/cv-upload-card.tsx`
- Section CSS candidate scopee de `app/globals.css`
- Tests smoke candidat.

## Contraintes

- Conserver les `name` de champs et les actions serveur existantes.
- Ne pas changer les routes publiques, admin ou recruteur.
- Garder les styles sous `.candidateArea`, `.candidate*`, `.cv*`, `.completion*` pour eviter les effets de bord.
- Conserver l'accessibilite: un `h1` par page, liens et boutons natifs, textes de statut visibles.

## Mise En Place

1. Ajouter des attentes smoke sur le shell reference: topbar candidat, label `Mon Asako`, badge alerte, ring de progression.
2. Remplacer le header candidat par une topbar Asako-like avec navigation emploi et bouton compte.
3. Re-styler la sidebar en carte compacte avec etat actif rose, badge alerte et carte progression circulaire.
4. Recomposer le dashboard autour de `Vos prochaines pistes` et `Dernieres candidatures`, avec onboarding secondaire.
5. Transformer la carte CV/profil en carte d'analyse lisible et tabs proches de la reference.
6. Recomposer `Mes candidatures` et `Mes alertes` en interfaces table-first.
7. Refaire le CSS candidat: fond lavande, surfaces blanches, ombres legeres, boutons roses/verts, dimensions compactes, responsive.
8. Verifier avec tests smoke candidat, typecheck, build, puis captures desktop/mobile locales.

## Statut D'Execution

- Complete: analyse visuelle de la reference dashboard/profil/candidatures/alertes.
- Complete: tests smoke candidat renforces avant la refonte.
- Complete: shell candidat, sidebar, dashboard, profil, candidatures et alertes refondus.
- Complete: CSS candidat refait avec styles scopes a l'espace candidat.
- Complete: smoke tests candidat, typecheck, build, diff check et captures desktop/mobile.
