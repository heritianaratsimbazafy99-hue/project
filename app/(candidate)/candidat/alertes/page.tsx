import {
  createCandidateJobAlertAndRedirect,
  deleteCandidateJobAlertAndRedirect,
  updateCandidateJobAlertStatusAndRedirect
} from "@/features/candidate/actions";
import { demoCandidateAlerts } from "@/features/demo/workspace";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CandidateAlertsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type JobAlertRow = {
  id: string;
  query: string;
  sector: string | null;
  city: string | null;
  contract: string | null;
  frequency: string;
  is_active: boolean;
  created_at: string;
};

const alertSectors = [
  "Informatique & Digital",
  "Centres d'appels & BPO",
  "Commerce & Vente",
  "Marketing, Communication & Médias",
  "Banque, Finance & Comptabilité",
  "Gestion, Administration & Secrétariat",
  "Ressources humaines",
  "Hôtellerie, Restauration & Tourisme",
  "BTP, Construction & Immobilier",
  "Industrie & Production",
  "Logistique, Transport & Supply Chain",
  "Santé & Médical",
  "Enseignement & Formation",
  "Juridique",
  "Agriculture & Agroalimentaire",
  "Textile, Mode & Confection",
  "Énergie, Mines & Environnement",
  "Associatif, ONG & Humanitaire",
  "Artisanat & Métiers techniques",
  "Sécurité & Gardiennage",
  "Services à la personne"
];

const alertCities = [
  "Ambanja",
  "Antananarivo",
  "Antsirabe",
  "Antsiranana",
  "Fianarantsoa",
  "Mahajanga",
  "Moramanga",
  "Morondava",
  "Nosy Be",
  "Sainte-Marie",
  "Taolagnaro",
  "Toamasina",
  "Toliara",
  "Télétravail"
];

const alertContracts = ["CDI", "CDD", "Stage", "Freelance"];

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatFrequency(value: string) {
  if (value === "weekly") {
    return "Hebdomadaire";
  }

  return "Quotidienne";
}

export default async function CandidateAlertsPage({ searchParams }: CandidateAlertsPageProps) {
  const { user, isDemo } = await requireRole(["candidate"]);
  let alerts: JobAlertRow[] = isDemo ? demoCandidateAlerts : [];

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("job_alerts")
      .select("id, query, sector, city, contract, frequency, is_active, created_at")
      .eq("candidate_id", user.id)
      .order("created_at", { ascending: false });

    alerts = (data ?? []) as JobAlertRow[];
  }

  const query = await searchParams;
  const created = firstQueryValue(query.created);
  const paused = firstQueryValue(query.paused);
  const resumed = firstQueryValue(query.resumed);
  const deleted = firstQueryValue(query.deleted);
  const error = firstQueryValue(query.error);
  const activeAlerts = alerts.filter((alert) => alert.is_active).length;

  return (
    <div className="candidateStack">
      <section className="candidateHero" aria-labelledby="alerts-title">
        <p className="candidateEyebrow">Mes alertes</p>
        <h1 id="alerts-title">Alertes emploi</h1>
        <p>Créez des alertes ciblées par secteur, ville et contrat pour ne manquer aucune opportunité.</p>
      </section>

      <section className="candidateCard" aria-labelledby="alert-form-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Nouvelle alerte</p>
            <h2 id="alert-form-title">Critères de recherche</h2>
          </div>
        </div>

        {created ? (
          <div className="candidateNotice" role="status">
            Alerte emploi créée.
          </div>
        ) : null}
        {paused ? (
          <div className="candidateNotice" role="status">
            Alerte mise en pause.
          </div>
        ) : null}
        {resumed ? (
          <div className="candidateNotice" role="status">
            Alerte réactivée.
          </div>
        ) : null}
        {deleted ? (
          <div className="candidateNotice" role="status">
            Alerte supprimée.
          </div>
        ) : null}
        {error ? (
          <div className="candidateNotice isError" role="alert">
            {error}
          </div>
        ) : null}

        <form action={createCandidateJobAlertAndRedirect} className="candidateForm compact">
          <label>
            Mot-clé
            <input name="query" placeholder="Designer UI/UX, comptable, React..." />
          </label>
          <label>
            Secteur
            <select name="sector" defaultValue="">
              <option value="">Tous les secteurs</option>
              {alertSectors.map((sector) => (
                <option key={sector}>{sector}</option>
              ))}
            </select>
          </label>
          <label>
            Ville
            <select name="city" defaultValue="">
              <option value="">Toutes les villes</option>
              {alertCities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </label>
          <label>
            Contrat
            <select name="contract" defaultValue="">
              <option value="">Tous</option>
              {alertContracts.map((contract) => (
                <option key={contract}>{contract}</option>
              ))}
            </select>
          </label>
          <label>
            Fréquence
            <select name="frequency" defaultValue="daily">
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
          </label>
          <div className="candidateFormActions">
            <button type="submit">Créer</button>
          </div>
        </form>
      </section>

      <section className="candidateCard" aria-labelledby="alerts-empty-title">
        {alerts.length > 0 ? (
          <div className="candidateAlertList">
            <div className="candidateSectionHeader">
              <div>
                <p className="candidateEyebrow">Alertes sauvegardées</p>
                <h2 id="alerts-empty-title">
                  {activeAlerts} active{activeAlerts > 1 ? "s" : ""} sur {alerts.length}
                </h2>
              </div>
            </div>
            {alerts.map((alert) => (
              <article key={alert.id}>
                <div>
                  <strong>{alert.query || "Toutes les offres"}</strong>
                  <p>
                    {[alert.sector, alert.city, alert.contract].filter(Boolean).join(" · ") || "Tous les critères"}
                  </p>
                </div>
                <span>{formatFrequency(alert.frequency)}</span>
                <small>{alert.is_active ? "Active" : "En pause"}</small>
                <form action={updateCandidateJobAlertStatusAndRedirect}>
                  <input type="hidden" name="alert_id" value={alert.id} />
                  <input type="hidden" name="is_active" value={alert.is_active ? "false" : "true"} />
                  <button type="submit">{alert.is_active ? "Mettre en pause" : "Réactiver"}</button>
                </form>
                <form action={deleteCandidateJobAlertAndRedirect}>
                  <input type="hidden" name="alert_id" value={alert.id} />
                  <button type="submit">Supprimer</button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="candidateEmptyState">
            <h2 id="alerts-empty-title">Pas encore d’alertes</h2>
            <p>Vos alertes sauvegardées apparaîtront ici dès leur création.</p>
          </div>
        )}
      </section>
    </div>
  );
}
