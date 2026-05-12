import Link from "next/link";

import { getCandidateApplicationsOrEmpty } from "@/features/applications/queries";
import { demoCandidateApplications } from "@/features/demo/workspace";
import { resolveCompanyLogoPath } from "@/features/public/company-logo";
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

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function applicationCompanyMark(name: string, fallbackText: string, logoPath: string | null) {
  const resolvedLogoPath = resolveCompanyLogoPath(logoPath);

  return resolvedLogoPath ? (
    <img src={resolvedLogoPath} alt="" width="38" height="38" />
  ) : (
    initials(name || fallbackText)
  );
}

function matchScore(status: ApplicationStatus) {
  if (["shortlisted", "interview", "hired"].includes(status)) {
    return "82/100";
  }

  if (status === "viewed") {
    return "64/100";
  }

  return "48/100";
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

  return (
    <div className="candidateStack">
      <section className="candidatePageHeading" aria-labelledby="applications-title">
        <h1 id="applications-title">Mes <strong>candidatures</strong></h1>
        <span>{applications.length}</span>
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
          <div className="candidateApplicationsTable">
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

            <div className="candidateApplicationTableHead" aria-hidden="true">
              <span>Poste</span>
              <span>Contrat</span>
              <span>Date</span>
              <span>Statut</span>
              <span>Match</span>
              <span />
            </div>
            {filteredApplications.map((application) => (
              <article key={application.id}>
                <Link className="candidateApplicationTitle" href={`/emploi/${application.job.slug}`}>
                  <span className="candidateCompanyMark" aria-hidden="true">
                    {applicationCompanyMark(
                      application.job.company.name,
                      application.job.title,
                      application.job.company.logo_path
                    )}
                  </span>
                  <span>
                    <strong>{application.job.title}</strong>
                    <small>{application.job.company.name}</small>
                  </span>
                </Link>
                <span>{application.job.contract || "Contrat"}</span>
                <span>{formatApplicationDate(application.created_at)}</span>
                <span className="candidateStatusPill">{statusLabels[application.status]}</span>
                <span className="candidateMatchPill">{matchScore(application.status)}</span>
                <div className="candidateTimeline" aria-label={`Statut: ${statusLabels[application.status]}`}>
                  {timelineStatuses.map((status, index) => (
                    <span key={status} className={index <= statusStageIndex[application.status] ? "isDone" : undefined} aria-hidden="true" />
                  ))}
                </div>
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
