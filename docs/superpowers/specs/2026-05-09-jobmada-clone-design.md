# Reproduction JobMada Design Spec

## Objectif

Construire une plateforme locale très proche de l'expérience JobMada, avec un jobboard public, des pages de détail, des tarifs recruteur et un espace recruteur connecté simulé. Le workspace est vide, donc la livraison sera une SPA statique en HTML/CSS/JS, avec données mockées et parcours cliquables.

## Sources D'Observation

- Accueil public JobMada: hero, job cards, entreprises, secteurs, CTA candidats/recruteurs, footer.
- Liste d'offres: recherche, filtres contrat/ville/secteur, cards, compteur et chargement.
- Tarifs recruteur: plans Gratuit, Starter, Booster, Agence, toggle mensuel/trimestriel, bénéfices, FAQ.
- Espace recruteur connecté: sidebar, profil entreprise, plan gratuit, formulaire logo/identité/présentation/présence en ligne/facturation.

## Direction UI

La reproduction doit utiliser le vocabulaire visuel JobMada:

- Fond très clair lilas `#f7f5fb`, surfaces blanches, bordures lilas pâle.
- Texte principal navy-violet `#474476`, texte secondaire gris-violet.
- Accent rose `#f2537b` pour CTA, badges sponsorisés et champs actifs.
- Accent mauve `#a78bcd`, jaune doux pour alerte/CTA candidat.
- Typographie ronde proche de DM Sans avec titres très gras.
- Cards à rayon large, ombres diffuses, pills, icônes linéaires, grands espaces verticaux.

## Surface Publique

Pages et états attendus:

- Accueil: header sticky, hero "L'emploi qui vous correspond", recherche, stats, offres à la une, logos entreprises, bannière JobMada Pro, dernières offres, sidebar deadlines, secteurs, préparation candidat, timeline "Comment ça marche", CTA candidats/recruteurs, section mission et footer.
- Offres: recherche, filtres en pills/checkboxes, liste filtrable, compteur, bouton charger plus, panneau "Ne ratez plus rien".
- Détail offre: breadcrumb, titre, entreprise, badges, contenu missions/profil, panneau résumé, bouton candidature, entreprises similaires.
- Entreprises: grille de cartes entreprises avec filtres par secteur.
- Tarifs: quatre plans, toggle mensuel/trimestriel, métriques, témoignages, FAQ.
- Auth mock: inscription candidat et recruteur sous forme de formulaires visuellement cohérents.

## Surface Recruteur

L'espace recruteur doit simuler une session connectée avec:

- Sidebar fixe: compte, sections Recrutement, Sourcing, Entreprise, Mon compte, CTA "Publier une offre", carte plan gratuit.
- Dashboard: métriques, pipeline candidatures, offres récentes, recommandations IA.
- Mes offres: tableau/cards avec statut, vues, candidatures et actions.
- Nouvelle offre: formulaire complet titre, contrat, ville, secteur, salaire, description, missions, profil, options boost.
- Candidatures: colonnes par statut, fiches candidats fictifs, filtres, action de déplacement.
- CVthèque: recherche de profils fictifs, compétences, ville, score matching, sélection.
- Ma sélection: liste de profils sauvegardés.
- Mon entreprise: formulaire fidèle au screenshot collecté.
- Abonnement: plans et usage du quota.
- Profil: informations utilisateur mockées.

## Interactions

- Navigation SPA par hash, sans rechargement.
- Recherche instantanée sur offres/profils.
- Filtres contrat, ville, secteur.
- Toggle tarifs mensuel/trimestriel.
- Boutons "charger plus", "sauvegarder", "déplacer étape", "aperçu", "annuler".
- Formulaire recruteur avec compteurs de caractères et toast de sauvegarde.
- Responsive mobile: header compact, sidebar recruteur transformée en barre supérieure + navigation horizontale.

## Données

Les données doivent être fictives ou publiques non sensibles. Les données issues du compte recruteur ne doivent pas être recopiées telles quelles. Les noms de candidats, emails, téléphones et CV doivent être inventés.

## Livraison

- `index.html`: shell applicatif.
- `styles.css`: design system et responsive.
- `app.js`: données, rendu SPA, interactions.
- `docs/superpowers/plans/2026-05-09-jobmada-clone.md`: plan d'implémentation.

## Tests D'Acceptation

- Ouvrir `index.html` doit afficher l'accueil proche de JobMada.
- Les routes principales via hash doivent fonctionner.
- Les filtres d'offres et de CVthèque doivent modifier les listes.
- L'espace recruteur doit être navigable sans login réel.
- Le rendu desktop doit rappeler fortement la capture publique et la capture recruteur.
- Le mobile ne doit pas chevaucher les textes ou casser les cards.
