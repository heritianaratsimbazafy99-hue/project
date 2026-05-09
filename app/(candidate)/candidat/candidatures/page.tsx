import Link from "next/link";

import { getCandidateApplicationsOrEmpty } from "@/features/applications/queries";
import { demoCandidateApplications } from "@/features/demo/workspace";
import { requireRole } from "@/lib/auth/require-role";
import type { ApplicationStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Envoyée",
  viewed: "Consultée",
  shortlisted: "Shortlistée",
  rejected: "Non retenue",
  interview: "Entretien",
  hired: "Recruté"
};

function formatApplicationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default async function CandidateApplicationsPage() {
  const { user, isDemo } = await requireRole(["candidate"]);
  const applications = isDemo ? demoCandidateApplications : await getCandidateApplicationsOrEmpty(user.id);
  const activeCount = applications.filter((application) => !["rejected", "hired"].includes(application.status)).length;
  const viewedCount = applications.filter((application) =>
    ["viewed", "shortlisted", "interview", "hired"].includes(application.status)
  ).length;

  return (
    <div className="candidateStack">
      <section className="candidateHero" aria-labelledby="applications-title">
        <p className="candidateEyebrow">Mes candidatures</p>
        <h1 id="applications-title">Suivi des candidatures</h1>
        <p>Retrouvez ici les offres auxquelles vous avez postulé et leur avancement.</p>
      </section>

      <section className="candidateCard" aria-labelledby="applications-empty-title">
        {applications.length > 0 ? (
          <div className="candidateApplicationList">
            <div className="candidateSectionHeader">
              <div>
                <p className="candidateEyebrow">Suivi</p>
                <h2 id="applications-empty-title">
                  {applications.length} candidature{applications.length > 1 ? "s" : ""}
                </h2>
              </div>
              <span>
                {activeCount} active{activeCount > 1 ? "s" : ""} · {viewedCount} consultée
                {viewedCount > 1 ? "s" : ""}
              </span>
            </div>

            {applications.map((application) => (
              <article key={application.id}>
                <div>
                  <strong>{application.job.title}</strong>
                  <p>
                    {application.job.company.name} · {application.job.city || "Madagascar"} ·{" "}
                    {application.job.contract || "Contrat à préciser"}
                  </p>
                  <small>Envoyée le {formatApplicationDate(application.created_at)}</small>
                </div>
                <span>{statusLabels[application.status]}</span>
                <Link href={`/emploi/${application.job.slug}`}>Voir l'offre</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="candidateEmptyState isLarge">
            <h2 id="applications-empty-title">Vous n’avez pas encore postulé</h2>
            <p>
              Explorez les offres disponibles sur JobMada, préparez votre CV, puis postulez aux opportunités qui
              correspondent à votre profil.
            </p>
            <Link className="primaryAction" href="/emploi">
              Voir les offres
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
