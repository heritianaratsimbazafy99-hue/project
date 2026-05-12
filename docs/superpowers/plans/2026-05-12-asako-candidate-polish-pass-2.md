# Candidate Polish Pass 2

Date: 2026-05-12

## Chrome Reference

Compte candidat Asako connecté inspecté sur:

- `/candidat/dashboard`
- `/candidat/profil`
- `/candidat/alertes`
- `/candidat/candidatures`

Points retenus: sidebar très lisible, progression visible, checklist courte, prochain geste clair, profil guidé autour du CV, alertes sous forme de critères simples et candidatures assumées avec un état vide direct.

## Écarts JobMada Ciblés

1. Dashboard trop plat: ajout d'un résumé profil, d'une carte `Action prioritaire` et de cartes onboarding plus expressives.
2. Sidebar trop administrative: ajout d'icônes, d'une liste de readiness `CV / Poste recherché / Alerte emploi` et d'un CTA plus visible.
3. Profil trop linéaire: ajout d'un guide de priorité et déplacement de la sécurité en bas de page.
4. CV pas assez rassurant: ajout de garanties lisibles sur la préparation et la visibilité.
5. Alertes trop techniques: ajout d'un guide en 3 étapes, d'un tableau visuel et d'un CTA d'état vide.
6. Candidatures trop statiques: ajout d'un guide de statut et d'une timeline par candidature.

## Vérification Prévue

- `git diff --check`
- `npm test -- tests/smoke/candidate-profile-sections.test.ts tests/smoke/candidate-completion.test.ts tests/smoke/candidate-actions.test.ts tests/smoke/candidate-applications.test.ts tests/smoke/application-apply-state.test.ts`
- `npm run typecheck`
- `npm run build`
- Vérification HTTP locale avec session candidat démo sur les 4 pages candidat.
