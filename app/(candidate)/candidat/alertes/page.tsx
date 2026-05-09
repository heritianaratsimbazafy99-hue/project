import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function CandidateAlertsPage() {
  await requireRole(["candidate"]);

  return (
    <div className="candidateStack">
      <section className="candidateHero" aria-labelledby="alerts-title">
        <p className="candidateEyebrow">Mes alertes</p>
        <h1 id="alerts-title">Alertes emploi</h1>
        <p>Créez des alertes pour recevoir les offres qui correspondent à votre recherche.</p>
      </section>

      <section className="candidateCard" aria-labelledby="alert-form-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Nouvelle alerte</p>
            <h2 id="alert-form-title">Critères de recherche</h2>
          </div>
        </div>

        <form className="candidateForm compact">
          <label>
            Secteur
            <input name="sector" placeholder="Informatique & Digital" />
          </label>
          <label>
            Ville
            <input name="city" placeholder="Antananarivo" />
          </label>
          <label>
            Contrat
            <input name="contract" placeholder="CDI, CDD, Stage" />
          </label>
          <div className="candidateFormActions">
            <button type="button">Créer</button>
          </div>
        </form>
      </section>

      <section className="candidateCard" aria-labelledby="alerts-empty-title">
        <div className="candidateEmptyState">
          <h2 id="alerts-empty-title">Pas encore d’alertes</h2>
          <p>Vos alertes sauvegardées apparaîtront ici dès leur création.</p>
        </div>
      </section>
    </div>
  );
}
