import { createCandidateJobAlertAndRedirect } from "@/features/candidate/actions";
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
  const error = firstQueryValue(query.error);

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

        {created ? (
          <div className="candidateNotice" role="status">
            Alerte emploi créée.
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
                  {alerts.length} alerte{alerts.length > 1 ? "s" : ""} active
                  {alerts.length > 1 ? "s" : ""}
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
