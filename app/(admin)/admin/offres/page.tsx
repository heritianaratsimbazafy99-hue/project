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

type AdminReviewRow = {
  target_id: string;
  decision: "approve" | "reject";
  note: string | null;
  created_at: string;
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
    .in("status", ["pending_review", "rejected"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Impossible de charger les offres à modérer.");
  }

  const jobs = (data ?? []) as unknown as PendingJobRow[];
  const jobIds = jobs.map((job) => job.id);
  let reviewsByJob = new Map<string, AdminReviewRow[]>();

  if (jobIds.length > 0) {
    const { data: reviews, error: reviewsError } = await supabase
      .from("admin_reviews")
      .select("target_id, decision, note, created_at")
      .eq("target_table", "jobs")
      .in("target_id", jobIds)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      throw new Error("Impossible de charger l'historique de modération des offres.");
    }

    reviewsByJob = ((reviews ?? []) as AdminReviewRow[]).reduce((map, review) => {
      map.set(review.target_id, [...(map.get(review.target_id) ?? []), review]);
      return map;
    }, new Map<string, AdminReviewRow[]>());
  }

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
          {jobs.map((job) => {
            const reviews = reviewsByJob.get(job.id) ?? [];
            const canReview = job.status === "pending_review";

            return (
              <article key={job.id} className="adminTableRow" role="row">
                <strong role="cell">{job.title}</strong>
                <span role="cell">{getCompanyName(job.company)}</span>
                <span role="cell">{getRecruiterLabel(job.company)}</span>
                <time role="cell" dateTime={job.created_at}>
                  {formatDate(job.created_at)}
                </time>
                <div className="adminActions" role="cell">
                  <span className="adminStatus">{statusLabels[job.status]}</span>
                  {reviews.length > 0 ? (
                    <div className="adminActionHint">
                      Historique:
                      {reviews.map((review) => (
                        <span key={`${review.created_at}-${review.decision}`}>
                          {formatDate(review.created_at)} · {review.decision === "approve" ? "Approuvée" : "Rejetée"}
                          {review.note ? ` · ${review.note}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {canReview && isCompanyVerified(job.company) ? (
                    <form action={reviewJob.bind(null, job.id, "approve")}>
                      <button type="submit">Approuver</button>
                    </form>
                  ) : null}
                  {canReview && !isCompanyVerified(job.company) ? (
                    <span className="adminActionHint">Entreprise à vérifier</span>
                  ) : null}
                  {canReview ? (
                    <form action={reviewJob.bind(null, job.id, "reject")}>
                      <label>
                        Note de rejet
                        <textarea name="note" required minLength={5} placeholder="Expliquez ce que le recruteur doit corriger." />
                      </label>
                      <button className="isDanger" type="submit">
                        Rejeter
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
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
