import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  MessageCircle,
  UserCheck,
  UsersRound,
  UserX,
  type LucideIcon
} from "lucide-react";

import { updateRecruiterApplicationStatus } from "@/features/applications/actions";
import {
  getRecruiterApplicationsOrEmpty,
  type RecruiterApplication
} from "@/features/applications/queries";
import { demoRecruiterApplications, demoRecruiterCompany } from "@/features/demo/workspace";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type CompanyRow = {
  id: string;
};

type RecruiterApplicationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "À traiter",
  viewed: "Consultée",
  shortlisted: "Shortlistée",
  rejected: "Rejetée",
  interview: "Entretien",
  hired: "Recruté"
};

const statusActions: Array<{
  status: Exclude<ApplicationStatus, "submitted">;
  label: string;
  Icon: LucideIcon;
  tone?: "danger" | "success";
}> = [
  { status: "viewed", label: "Vu", Icon: Eye },
  { status: "shortlisted", label: "Shortlist", Icon: UserCheck },
  { status: "interview", label: "Entretien", Icon: MessageCircle },
  { status: "hired", label: "Recruté", Icon: CheckCircle2, tone: "success" },
  { status: "rejected", label: "Rejeter", Icon: UserX, tone: "danger" }
];

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatApplicationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

async function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
  "use server";

  const result = await updateRecruiterApplicationStatus(applicationId, status);
  const param = result.ok ? "updated" : "error";

  redirect(`/recruteur/candidatures?${param}=${encodeURIComponent(result.message)}`);
}

export default async function RecruiterApplicationsPage({ searchParams }: RecruiterApplicationsPageProps) {
  const { user, isDemo } = await requireRole(["recruiter"]);
  let applications: RecruiterApplication[] = isDemo ? demoRecruiterApplications : [];
  let company: CompanyRow | null = isDemo ? demoRecruiterCompany : null;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data: companyData } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<CompanyRow>();

    company = companyData;
    applications = company ? await getRecruiterApplicationsOrEmpty(company.id) : [];
  }

  const total = applications.length;
  const submittedCount = applications.filter((application) => application.status === "submitted").length;
  const viewedCount = applications.filter((application) =>
    ["viewed", "shortlisted", "interview", "hired"].includes(application.status)
  ).length;
  const query = await searchParams;
  const updatedMessage = firstQueryValue(query.updated);
  const errorMessage = firstQueryValue(query.error);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Candidatures reçues</h1>
          <p>{total} candidature{total > 1 ? "s" : ""} au total</p>
        </div>
      </div>

      {updatedMessage ? (
        <div className="recruiterNotice" role="status">
          {updatedMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="recruiterNotice isError" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <section className="dashboard-grid applications-kpis" aria-label="Indicateurs candidatures">
        {([
          ["Total", String(total), UsersRound, `${total} candidature${total > 1 ? "s" : ""}`],
          ["Nouvelles", String(submittedCount), BriefcaseBusiness, submittedCount > 0 ? "À traiter" : "Tout vu"],
          ["Consultées", String(viewedCount), Eye, viewedCount > 0 ? "Déjà vues" : "Aucune consultation"]
        ] as const).map(([label, value, Icon, hint]) => (
          <article className="metric-card" key={String(label)}>
            <span className="icon-tile">
              <Icon aria-hidden="true" size={18} />
            </span>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{hint}</span>
          </article>
        ))}
      </section>

      <section className="panel offers-panel">
        <div className="toolbar">
          <input className="input" placeholder="Rechercher un candidat ou une offre..." />
          <select className="select" defaultValue="all">
            <option value="all">Toutes les offres</option>
          </select>
          <select className="select" defaultValue="recent">
            <option value="recent">Plus récentes</option>
            <option value="match">Meilleur score</option>
            <option value="name">Nom A-Z</option>
          </select>
        </div>
        <div className="status-tabs">
          {[
            ["Toutes", total],
            ["À traiter", submittedCount],
            ["Consultées", viewedCount],
            ["Shortlistées", applications.filter((application) => application.status === "shortlisted").length],
            ["Rejetées", applications.filter((application) => application.status === "rejected").length]
          ].map(([label, count], index) => (
            <button className={index === 0 ? "active" : undefined} type="button" key={label}>
              {label} <span>{count}</span>
            </button>
          ))}
        </div>
        {applications.length > 0 ? (
          <div className="table-list recruiter-applications-list">
            {applications.map((application) => (
              <div className="table-row" key={application.id}>
                <div>
                  <strong>{application.candidate.displayName}</strong>
                  <p>
                    {application.candidate.desiredRole || "Profil candidat"} ·{" "}
                    {application.candidate.city || "Ville à préciser"}
                  </p>
                  <small>
                    Pour {application.job.title} · envoyée le {formatApplicationDate(application.created_at)}
                  </small>
                  <span className="recruiter-application-cv">
                    {application.cv_path ? "CV reçu" : "CV à demander"}
                  </span>
                </div>
                <span className="pill rose">{statusLabels[application.status]}</span>
                <div className="recruiter-application-actions" aria-label={`Actions pour ${application.candidate.displayName}`}>
                  {statusActions.map(({ status, label, Icon, tone }) => (
                    <form action={updateApplicationStatus.bind(null, application.id, status)} key={status}>
                      <button
                        className={`recruiter-action-button${tone ? ` ${tone}` : ""}`}
                        type="submit"
                        disabled={application.status === status || isDemo}
                      >
                        <Icon aria-hidden="true" size={15} />
                        {label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state recruiter-empty">
            <BriefcaseBusiness aria-hidden="true" size={24} />
            <p>{company ? "Aucune candidature" : "Aucune entreprise rattachée"}</p>
          </div>
        )}
        <div className="panel-footer">
          <span>
            {applications.length} candidature{applications.length > 1 ? "s" : ""} affichée
            {applications.length > 1 ? "s" : ""}
          </span>
        </div>
      </section>
    </>
  );
}
