import Link from "next/link";
import { BriefcaseBusiness, Clock, Eye, Layers, Plus, UsersRound } from "lucide-react";

import { demoRecruiterCompany, demoRecruiterJobs, demoRecruiterSubscription } from "@/features/demo/workspace";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type RecruiterOffersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type CompanyRow = {
  id: string;
};

type JobRow = {
  id: string;
  title: string;
  contract: string;
  city: string;
  sector: string;
  status: JobStatus;
  is_featured: boolean | null;
  is_urgent: boolean | null;
  created_at: string;
};

const tabs: Array<{ label: string; href: string; status?: JobStatus }> = [
  { label: "Toutes", href: "/recruteur/offres" },
  { label: "Brouillons", href: "/recruteur/offres?status=draft", status: "draft" },
  { label: "En revue", href: "/recruteur/offres?status=pending_review", status: "pending_review" },
  { label: "Publiées", href: "/recruteur/offres?status=published", status: "published" },
  { label: "Rejetées", href: "/recruteur/offres?status=rejected", status: "rejected" },
  { label: "Expirées", href: "/recruteur/offres?status=expired", status: "expired" },
  { label: "Archivées", href: "/recruteur/offres?status=archived", status: "archived" }
];

const statusLabels: Record<JobStatus, string> = {
  draft: "Brouillon",
  pending_review: "En revue",
  published: "Publiée",
  rejected: "Rejetée",
  expired: "Expirée",
  archived: "Archivée"
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RecruiterOffersPage({ searchParams }: RecruiterOffersPageProps) {
  const { user, isDemo } = await requireRole(["recruiter"]);
  const params = await searchParams;
  const requestedStatus = firstValue(params.status) as JobStatus | undefined;
  const created = firstValue(params.created) === "1";
  const activeStatus = tabs.some((tab) => tab.status === requestedStatus) ? requestedStatus : undefined;
  let company: CompanyRow | null = isDemo ? demoRecruiterCompany : null;
  let jobs: JobRow[] = isDemo ? demoRecruiterJobs : [];

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

    if (company) {
      let request = supabase
        .from("jobs")
        .select("id, title, contract, city, sector, status, is_featured, is_urgent, created_at")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (activeStatus) {
        request = request.eq("status", activeStatus);
      }

      const { data } = await request;
      jobs = (data ?? []) as JobRow[];
    }
  } else if (activeStatus) {
    jobs = demoRecruiterJobs.filter((job) => job.status === activeStatus);
  }

  const total = jobs.length;
  const published = jobs.filter((job) => job.status === "published").length;
  const inReview = jobs.filter((job) => job.status === "pending_review").length;
  const quota = demoRecruiterSubscription.job_quota;

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Mes offres</h1>
          <p>Gérez vos offres d'emploi et suivez leurs performances</p>
        </div>
        <Link className="btn btn-primary" href="/recruteur/offres/nouvelle">
          <Plus aria-hidden="true" size={18} />
          Publier une offre
        </Link>
      </div>

      <section className="dashboard-grid offers-kpis" aria-label="Indicateurs offres">
        {([
          ["Offres actives", published, BriefcaseBusiness, `${published} sur ${quota} · Plan Gratuit`],
          ["Candidatures", 0, UsersRound, "Aucune nouvelle"],
          ["Vues totales", isDemo ? 128 : 0, Eye, isDemo ? "+12 cette semaine" : "— vs sem. préc."],
          ["En revue", inReview, Clock, "Validation JobMada"]
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

      {created ? (
        <div className="notice-line" role="status">
          L'offre est envoyée à l'équipe JobMada pour revue.
        </div>
      ) : null}

      <section className="panel offers-panel">
        <div className="toolbar">
          <input className="input" placeholder="Rechercher une offre..." />
          <select className="select" defaultValue="recent">
            <option value="recent">Plus récentes</option>
            <option value="views">Plus de vues</option>
            <option value="applications">Plus de candidatures</option>
          </select>
        </div>

        <div className="status-tabs" aria-label="Filtrer les offres">
          {tabs.map((tab) => {
            const isActive = tab.status === activeStatus || (!tab.status && !activeStatus);
            const count = tab.status ? jobs.filter((job) => job.status === tab.status).length : total;

            return (
              <Link className={isActive ? "active" : undefined} href={tab.href} key={tab.href}>
                {tab.label} <span>{count}</span>
              </Link>
            );
          })}
        </div>

        {jobs.length > 0 ? (
          <div className="table-list">
            {jobs.map((job) => (
              <div className="table-row" key={job.id}>
                <div>
                  <strong>{job.title}</strong>
                  <p>
                    {job.contract} · {job.city} · {job.sector}
                  </p>
                </div>
                <span className="pill rose">{statusLabels[job.status]}</span>
                <Link className="btn btn-soft" href="/recruteur/offres/nouvelle">
                  Modifier
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state recruiter-empty">
            <Layers aria-hidden="true" size={24} />
            <p>{company ? "Aucune offre dans cet onglet" : "Aucune entreprise rattachée"}</p>
          </div>
        )}

        <div className="panel-footer">
          <span>{jobs.length} offres affichées</span>
          <span>Plan Gratuit · {total}/{quota} offres utilisées</span>
        </div>
      </section>
    </>
  );
}
