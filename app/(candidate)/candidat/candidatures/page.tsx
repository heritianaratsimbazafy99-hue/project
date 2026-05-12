import Link from "next/link";

import { getCandidateApplicationsOrEmpty } from "@/features/applications/queries";
import { demoCandidateApplications } from "@/features/demo/workspace";
import { requireRole } from "@/lib/auth/require-role";
import type { ApplicationStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type CandidateApplicationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Envoyée",
  viewed: "Consultée",
  shortlisted: "Shortlistée",
  rejected: "Non retenue",
  interview: "Entretien",
  hired: "Recruté"
};

const statusFilterOptions: Array<{ value: "all" | ApplicationStatus; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "submitted", label: statusLabels.submitted },
  { value: "viewed", label: statusLabels.viewed },
  { value: "shortlisted", label: statusLabels.shortlisted },
  { value: "interview", label: statusLabels.interview },
  { value: "rejected", label: statusLabels.rejected },
  { value: "hired", label: statusLabels.hired }
];

const statusHints: Record<ApplicationStatus, string> = {
  submitted: "Votre candidature est bien transmise.",
  viewed: "Le recruteur a consulté votre profil.",
  shortlisted: "Votre profil est retenu pour la suite.",
  rejected: "Cette piste est fermée, continuez à postuler.",
  interview: "Préparez vos disponibilités pour l'entretien.",
  hired: "Félicitations, le processus est terminé."
};

const timelineStatuses: ApplicationStatus[] = ["submitted", "viewed", "shortlisted", "interview"];
const statusStageIndex: Record<ApplicationStatus, number> = {
  submitted: 0,
  viewed: 1,
  shortlisted: 2,
  rejected: 0,
  interview: 3,
  hired: 3
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isApplicationStatus(value: string | undefined): value is ApplicationStatus {
  return Boolean(value && value in statusLabels);
}

function formatApplicationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default async function CandidateApplicationsPage({ searchParams }: CandidateApplicationsPageProps) {
  const { user, isDemo } = await requireRole(["candidate"]);
  const applications = isDemo ? demoCandidateApplications : await getCandidateApplicationsOrEmpty(user.id);
  const query = await searchParams;
  const selectedStatus = firstQueryValue(query.status);
  const activeStatus = isApplicationStatus(selectedStatus) ? selectedStatus : "all";
  const filteredApplications =
    activeStatus === "all" ? applications : applications.filter((application) => application.status === activeStatus);
  const activeCount = filteredApplications.filter((application) => !["rejected", "hired"].includes(application.status)).length;
  const viewedCount = filteredApplications.filter((application) =>
    ["viewed", "shortlisted", "interview", "hired"].includes(application.status)
  ).length;
  const totalActiveCount = applications.filter((application) => !["rejected", "hired"].includes(application.status)).length;
  const totalViewedCount = applications.filter((application) =>
    ["viewed", "shortlisted", "interview", "hired"].includes(application.status)
  ).length;
  const shortlistedCount = applications.filter((application) =>
    ["shortlisted", "interview", "hired"].includes(application.status)
  ).length;

  return (
    <div className="candidateStack">
      <section className="candidateHero" aria-labelledby="applications-title">
        <p className="candidateEyebrow">Mes candidatures</p>
        <h1 id="applications-title">Suivi des candidatures</h1>
        <p>Retrouvez ici les offres auxquelles vous avez postulé et leur avancement.</p>
      </section>

      <section className="candidateMetricGrid" aria-label="Résumé des candidatures">
        <article>
          <span>Total</span>
          <strong>{applications.length}</strong>
          <small>candidature{applications.length > 1 ? "s" : ""}</small>
        </article>
        <article>
          <span>Actives</span>
          <strong>{totalActiveCount}</strong>
          <small>en cours</small>
        </article>
        <article>
          <span>Consultées</span>
          <strong>{totalViewedCount}</strong>
          <small>par les recruteurs</small>
        </article>
        <article>
          <span>Shortlist</span>
          <strong>{shortlistedCount}</strong>
          <small>profil retenu</small>
        </article>
      </section>

      <section className="candidateStatusGuide" aria-label="Lecture du suivi des candidatures">
        <span>Envoyée</span>
        <span>Consultée</span>
        <span>Shortlist</span>
        <span>Entretien</span>
      </section>

      <section className="candidateCard" aria-labelledby="applications-empty-title">
        <div className="candidateTabs" aria-label="Filtrer les candidatures par statut">
          {statusFilterOptions.map((option) => (
            <Link
              key={option.value}
              href={option.value === "all" ? "/candidat/candidatures" : `/candidat/candidatures?status=${option.value}`}
              aria-current={activeStatus === option.value ? "page" : undefined}
            >
              {option.label}
            </Link>
          ))}
        </div>

        {filteredApplications.length > 0 ? (
          <div className="candidateApplicationList">
            <div className="candidateSectionHeader">
              <div>
                <p className="candidateEyebrow">Suivi</p>
                <h2 id="applications-empty-title">
                  {filteredApplications.length} candidature{filteredApplications.length > 1 ? "s" : ""}
                </h2>
              </div>
              <span>
                {activeCount} active{activeCount > 1 ? "s" : ""} · {viewedCount} consultée
                {viewedCount > 1 ? "s" : ""}
              </span>
            </div>

            {filteredApplications.map((application) => (
              <article key={application.id}>
                <div>
                  <strong>{application.job.title}</strong>
                  <p>
                    {application.job.company.name} · {application.job.city || "Madagascar"} ·{" "}
                    {application.job.contract || "Contrat à préciser"}
                  </p>
                  <small>Envoyée le {formatApplicationDate(application.created_at)}</small>
                  <div className="candidateTimeline" aria-label={`Statut: ${statusLabels[application.status]}`}>
                    {timelineStatuses.map((status, index) => (
                      <span key={status} className={index <= statusStageIndex[application.status] ? "isDone" : undefined} aria-hidden="true" />
                    ))}
                  </div>
                  <small>{statusHints[application.status]}</small>
                </div>
                <span>{statusLabels[application.status]}</span>
                <Link href={`/emploi/${application.job.slug}`}>Voir l'offre</Link>
              </article>
            ))}
          </div>
        ) : applications.length > 0 ? (
          <div className="candidateEmptyState isLarge">
            <h2 id="applications-empty-title">Aucune candidature avec ce statut</h2>
            <p>Changez de filtre pour retrouver le reste de votre suivi.</p>
            <Link className="primaryAction" href="/candidat/candidatures">
              Toutes les candidatures
            </Link>
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
