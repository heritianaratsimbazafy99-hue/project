# Plan UI/UX recruteur Asako

Date: 2026-05-12

## Analyse Chrome

Le compte recruteur Asako est accessible sur `/recruteur/dashboard`. Le parcours observé couvre les écrans clés d'une V1 recruteur: dashboard, offres, création d'offre, candidatures, CVthèque, sélection, entreprise, abonnement et profil.

Un brouillon non publié a été créé pour tester le parcours réel:

- Titre: `[TEST UI/UX] Chargé de sourcing digital`
- Statut: brouillon
- Effet observé: l'offre apparaît dans `Mes offres`, onglet `Brouillon`, avec actions `Modifier` et `Supprimer`.

## Points forts Asako

- Sidebar très lisible par domaines: recrutement, sourcing, entreprise, compte.
- Dashboard orienté activation avec onboarding en 3 étapes, quota, stats rapides et activité 7 jours.
- Création d'offre en deux méthodes: rédaction manuelle ou génération IA.
- Formulaire d'offre progressif avec compteur de complétude, compteurs de caractères et conseil éditorial.
- Gating commercial clair: plan gratuit, quota restant, options `Vedette` et `Urgent` verrouillées par plan.
- CVthèque présentée comme un vrai produit avec recherche libre, matching par offre, stats de volume et recherches populaires.
- Abonnement plus détaillé que notre version actuelle: quotas, options mensuelles, pricing par plan et transaction history.

## Ecarts JobMada prioritaires

1. Ajouter sur l'accueil public la section candidat `Comment ça marche ?` en 3 étapes.
2. Rendre les métriques dashboard recruteur plus crédibles: candidatures non lues, shortlist, vues et activité 7 jours doivent être réellement alimentées.
3. Améliorer le traitement des candidatures: fiche candidat, notes internes, historique de statut et pipeline visuel.
4. Enrichir `Mes offres`: aperçu public, vues/candidatures par offre, dates de publication/expiration et statut de revue plus lisible.
5. Transformer la CVthèque en produit assumé: recherche limitée par plan ou gating commercial plus ambitieux.
6. Clarifier les fonctions premium: IA, Vedette, Urgent, remontée et accès CVthèque doivent mener à une demande de plan contextualisée.

## Tâches exécutées maintenant

1. Explorer Asako dans Chrome connecté avec création d'un brouillon de test.
2. Comparer avec le dashboard recruteur JobMada déployé.
3. Ajouter la section `Comment ça marche ?` sur la homepage JobMada, avec wording adapté aux capacités actuelles.
4. Mettre à jour les tests smoke publics.
5. Vérifier `git diff --check`, tests smoke ciblés, `npm run typecheck` et `npm run build`: tous passés.
