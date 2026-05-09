import { reviewJob } from "@/features/admin/actions";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type PendingJobRow = {
  id: string;
  title: string;
  status: JobStatus;
  created_at: string;
  company:
    | {
        name: string;
        status: string;
        owner:
          | {
              display_name: string | null;
              email: string | null;
            }
          | Array<{
              display_name: string | null;
              email: string | null;
            }>
          | null;
      }
    | Array<{
        name: string;
        status: string;
        owner:
          | {
              display_name: string | null;
              email: string | null;
            }
          | Array<{
              display_name: string | null;
              email: string | null;
            }>
          | null;
      }>
    | null;
};

const statusLabels: Record<JobStatus, string> = {
  draft: "Brouillon",
  pending_review: "En revue",
  published: "Publiée",
  rejected: "Rejetée",
  expired: "Expirée",
  archived: "Archivée"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MG", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function getCompanyName(company: PendingJobRow["company"]) {
  if (Array.isArray(company)) {
    return company[0]?.name || "Entreprise inconnue";
  }

  return company?.name || "Entreprise inconnue";
}

function getRecruiterLabel(company: PendingJobRow["company"]) {
  const companyRow = Array.isArray(company) ? company[0] : company;
  const owner = Array.isArray(companyRow?.owner) ? companyRow.owner[0] : companyRow?.owner;

  return owner?.display_name || owner?.email || "Recruteur inconnu";
}

function isCompanyVerified(company: PendingJobRow["company"]) {
  const companyRow = Array.isArray(company) ? company[0] : company;

  return companyRow?.status === "verified";
}

export default async function AdminOffersPage() {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, status, created_at, company:companies(name, status, owner:profiles(display_name, email))")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Impossible de charger les offres à modérer.");
  }

  const jobs = (data ?? []) as unknown as PendingJobRow[];

  return (
    <div className="adminStack">
      <section className="adminHero compact" aria-labelledby="admin-offers-title">
        <p className="adminEyebrow">Offres</p>
        <h1 id="admin-offers-title">Offres à modérer</h1>
        <p>Contrôlez les annonces soumises par les recruteurs avant publication.</p>
      </section>

      {jobs.length > 0 ? (
        <div className="adminTable" role="table" aria-label="Offres en attente">
          <div className="adminTableHeader" role="row">
            <span role="columnheader">Offre</span>
            <span role="columnheader">Entreprise</span>
            <span role="columnheader">Recruteur</span>
            <span role="columnheader">Créée</span>
            <span role="columnheader">Décision</span>
          </div>
          {jobs.map((job) => (
            <article key={job.id} className="adminTableRow" role="row">
              <strong role="cell">{job.title}</strong>
              <span role="cell">{getCompanyName(job.company)}</span>
              <span role="cell">{getRecruiterLabel(job.company)}</span>
              <time role="cell" dateTime={job.created_at}>
                {formatDate(job.created_at)}
              </time>
              <div className="adminActions" role="cell">
                <span className="adminStatus">{statusLabels[job.status]}</span>
                {isCompanyVerified(job.company) ? (
                  <form action={reviewJob.bind(null, job.id, "approve")}>
                    <button type="submit">Approuver</button>
                  </form>
                ) : (
                  <span className="adminActionHint">Entreprise à vérifier</span>
                )}
                <form action={reviewJob.bind(null, job.id, "reject")}>
                  <button className="isDanger" type="submit">
                    Rejeter
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="adminEmptyState" aria-labelledby="admin-offers-empty-title">
          <h2 id="admin-offers-empty-title">Aucune offre en attente</h2>
          <p>Les nouvelles soumissions apparaîtront ici dès qu'un recruteur les enverra en revue.</p>
        </section>
      )}
    </div>
  );
}
