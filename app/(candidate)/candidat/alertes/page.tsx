import {
  createCandidateJobAlertAndRedirect,
  deleteCandidateJobAlertAndRedirect,
  updateCandidateJobAlertStatusAndRedirect
} from "@/features/candidate/actions";
import { Bell, Trash2 } from "lucide-react";
import { demoCandidateAlerts } from "@/features/demo/workspace";
import { JOB_CONTRACT_OPTIONS } from "@/features/jobs/contracts";
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

const alertContracts = JOB_CONTRACT_OPTIONS;

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
      <section className="candidatePageHeading" aria-labelledby="alerts-title">
        <h1 id="alerts-title">Mes <strong>alertes</strong></h1>
        <span>
          {activeAlerts} active{activeAlerts > 1 ? "s" : ""} sur {alerts.length}
        </span>
      </section>

      <section className="candidateCard" aria-labelledby="alert-form-title">
        <div className="candidateSectionHeader compact">
          <div>
            <span className="candidatePanelIcon muted" aria-hidden="true">
              <Bell size={18} />
            </span>
            <div>
              <h2 id="alert-form-title">Créer une alerte</h2>
              <p>Sélectionnez un secteur, une ville ou un contrat pour suivre les opportunités.</p>
            </div>
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

        <form action={createCandidateJobAlertAndRedirect} className="candidateForm compact candidateAlertForm">
          <input type="hidden" name="query" value="" />
          <input type="hidden" name="frequency" value="daily" />
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
          <div className="candidateFormActions">
            <button type="submit">+ Créer</button>
          </div>
        </form>
      </section>

      <section className="candidateCard" aria-labelledby="alerts-empty-title">
        {alerts.length > 0 ? (
          <div className="candidateAlertTable">
            <div className="candidateAlertTableHead" aria-hidden="true">
              <span>Secteur</span>
              <span>Ville</span>
              <span>Contrat</span>
              <span>Statut</span>
              <span />
            </div>
            <h2 id="alerts-empty-title" className="srOnly">
              Alertes sauvegardées
            </h2>
            {alerts.map((alert) => (
              <article key={alert.id}>
                <strong>{alert.sector || alert.query || "Toutes les offres"}</strong>
                <span>{alert.city || "Toutes les villes"}</span>
                <span>{alert.contract || "Tous"}</span>
                <form action={updateCandidateJobAlertStatusAndRedirect}>
                  <input type="hidden" name="alert_id" value={alert.id} />
                  <input type="hidden" name="is_active" value={alert.is_active ? "false" : "true"} />
                  <button className={alert.is_active ? "candidateToggle isOn" : "candidateToggle"} type="submit">
                    <span>{alert.is_active ? "Active" : "Pause"}</span>
                  </button>
                </form>
                <form action={deleteCandidateJobAlertAndRedirect}>
                  <input type="hidden" name="alert_id" value={alert.id} />
                  <button className="candidateIconButton" type="submit" aria-label="Supprimer l'alerte">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="candidateEmptyState isLarge">
            <h2 id="alerts-empty-title">Pas encore d’alertes</h2>
            <p>Vos alertes sauvegardées apparaîtront ici dès leur création.</p>
            <a className="primaryAction" href="#alert-form-title">
              Créer ma première alerte
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
