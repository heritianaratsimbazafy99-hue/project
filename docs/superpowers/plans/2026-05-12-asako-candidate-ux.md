# Plan UI/UX candidat Asako

Date: 2026-05-12

## Analyse Chrome

Le compte candidat Asako connecté sur `/candidat/dashboard` présente un espace guidé: sidebar `Mon Asako`, progression profil, dashboard d'accueil, profil, candidatures et alertes.

Actions testées:

- Dashboard: lecture de la checklist 4 étapes avec profil à 0%.
- Profil: lecture de l'écran CV, tabs `Infos personnelles`, `Parcours`, `Compétences`, champs de situation professionnelle.
- Alertes: création d'une alerte test `Informatique & Digital · Antananarivo · CDI`, puis vérification du compteur `1 actives sur 1`.
- Candidatures: état vide avec CTA vers les offres.

## Points forts Asako

- Onboarding candidat direct: compte créé, CV, poste recherché, alerte.
- Profil candidat centré sur le CV, avec champs utiles et sections lisibles.
- Alertes simples à créer avec sélecteurs secteur, ville et contrat.
- Candidatures assumées en état vide, avec redirection claire vers les offres.
- Progression profil visible dans la sidebar.

## Ecarts JobMada traités maintenant

1. Renforcer le dashboard avec checklist 4 étapes, aides courtes et progression segmentée.
2. Adapter les recommandations d'offres à partir du profil quand le poste, la ville ou le secteur existent.
3. Clarifier la carte CV sans promettre d'analyse automatique non câblée.
4. Remplacer les champs libres ville, secteur, salaire et alertes par des sélecteurs guidés.
5. Ajouter des métriques de suivi en haut de `Mes candidatures`.

## Compte candidat test

Compte candidat créé via Supabase Auth:

- Email: `candidat.test.20260512103557@jobmada.mg`
- Mot de passe: `JobMadaTest2026!`
- Statut: créé, mais connexion bloquée par la confirmation email Supabase (`Email not confirmed`). Sans clé service-role locale, le profil candidat et l'alerte associée ne peuvent pas être hydratés côté base avant confirmation.

Compte candidat utilisable immédiatement pour les tests applicatifs:

- Email: `candidat.demo@jobmada.mg`
- Mot de passe: `jobmada-demo-password`
