import Link from "next/link";

import { createJobAndRedirect } from "@/features/jobs/actions";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

const methods = [
  { title: "Saisie manuelle", copy: "Contrôle complet sur le contenu envoyé à la revue JobMada.", active: true },
  { title: "Importer une fiche", copy: "Import PDF ou DOCX prévu pour une prochaine itération.", active: false },
  { title: "Assistant IA", copy: "Aide à la rédaction bientôt disponible pour les recruteurs.", active: false }
];

type NewRecruiterOfferPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewRecruiterOfferPage({ searchParams }: NewRecruiterOfferPageProps) {
  await requireRole(["recruiter"]);
  const errorMessage = firstValue((await searchParams).error);

  return (
    <div className="recruiterStack">
      <section className="recruiterHero compact" aria-labelledby="new-offer-title">
        <div>
          <p className="recruiterEyebrow">Nouvelle offre</p>
          <h1 id="new-offer-title">Créer une offre</h1>
          <p>Les annonces recruteur sont envoyées en revue avant publication publique.</p>
        </div>
        <Link className="headerLink" href="/recruteur/offres">
          Retour aux offres
        </Link>
      </section>

      <section className="recruiterPanel" aria-labelledby="method-title">
        <div className="recruiterSectionHeader">
          <div>
            <p className="recruiterEyebrow">Méthode</p>
            <h2 id="method-title">Choisir un point de départ</h2>
          </div>
        </div>
        <div className="recruiterMethodGrid">
          {methods.map((method) => (
            <article key={method.title} className={method.active ? "isActive" : undefined}>
              <h3>{method.title}</h3>
              <p>{method.copy}</p>
              <span>{method.active ? "Disponible" : "Bientôt"}</span>
            </article>
          ))}
        </div>
      </section>

      {errorMessage ? (
        <div className="recruiterNotice" role="status">
          {errorMessage}
        </div>
      ) : null}

      <form className="recruiterForm" action={createJobAndRedirect}>
        <section className="recruiterPanel" aria-labelledby="job-basics-title">
          <div className="recruiterSectionHeader">
            <div>
              <p className="recruiterEyebrow">Informations</p>
              <h2 id="job-basics-title">Détails de l'offre</h2>
            </div>
          </div>
          <div className="recruiterFormGrid">
            <label>
              Titre du poste
              <input name="title" required placeholder="Responsable commercial" />
            </label>
            <label>
              Contrat
              <input name="contract" required placeholder="CDI, CDD, Stage" />
            </label>
            <label>
              Ville
              <input name="city" required placeholder="Antananarivo" />
            </label>
            <label>
              Lieu précis
              <input name="location_detail" placeholder="Hybride, quartier, site" />
            </label>
            <label>
              Rémunération
              <input name="salary_range" placeholder="Selon profil" />
            </label>
            <label>
              Référence interne
              <input name="internal_reference" placeholder="JM-2026-001" />
            </label>
            <label>
              Secteur
              <input name="sector" required placeholder="Informatique & Digital" />
            </label>
            <label>
              Résumé court
              <input name="summary" placeholder="Une phrase visible dans les listes d'offres" />
            </label>
          </div>
        </section>

        <section className="recruiterPanel" aria-labelledby="job-content-title">
          <div className="recruiterSectionHeader">
            <div>
              <p className="recruiterEyebrow">Contenu</p>
              <h2 id="job-content-title">Description complète</h2>
            </div>
          </div>
          <div className="recruiterTextGrid">
            <label>
              Description
              <textarea name="description" rows={6} placeholder="Présentez le poste, l'équipe et le contexte." />
            </label>
            <label>
              Missions
              <textarea name="missions" rows={6} placeholder="Listez les responsabilités principales." />
            </label>
            <label>
              Profil recherché
              <textarea name="profile" rows={6} placeholder="Compétences, expérience et qualités attendues." />
            </label>
          </div>
        </section>

        <section className="recruiterPanel" aria-labelledby="visibility-title">
          <div className="recruiterSectionHeader">
            <div>
              <p className="recruiterEyebrow">Visibilité</p>
              <h2 id="visibility-title">Options administrées par JobMada</h2>
            </div>
          </div>
          <div className="recruiterVisibilityGrid">
            <label>
              <input type="checkbox" disabled />
              Mettre en avant l'offre
            </label>
            <label>
              <input type="checkbox" disabled />
              Marquer comme urgente
            </label>
          </div>
          <p className="recruiterHint">Ces options sont décidées pendant la revue et ne sont pas envoyées par le formulaire.</p>
        </section>

        <div className="recruiterSubmitBar">
          <p>Statut envoyé: en revue admin. Les boosts restent désactivés.</p>
          <div>
            <Link href="/recruteur/offres">Annuler</Link>
            <button type="submit">Envoyer en revue</button>
          </div>
        </div>
      </form>
    </div>
  );
}
