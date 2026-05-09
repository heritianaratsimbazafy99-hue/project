import { BriefcaseBusiness, Eye, UsersRound } from "lucide-react";

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

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "À traiter",
  viewed: "Consultée",
  shortlisted: "Shortlistée",
  rejected: "Rejetée",
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

export default async function RecruiterApplicationsPage() {
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

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Candidatures reçues</h1>
          <p>{total} candidature{total > 1 ? "s" : ""} au total</p>
        </div>
      </div>

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
                </div>
                <span className="pill rose">{statusLabels[application.status]}</span>
                <span className="btn btn-soft recruiter-static-action">CV reçu</span>
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
