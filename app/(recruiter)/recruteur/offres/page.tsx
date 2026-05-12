import Link from "next/link";
import { Archive, BriefcaseBusiness, Clock, Copy, Eye, Layers, Pencil, Plus, RotateCcw, UsersRound } from "lucide-react";

import { demoRecruiterCompany, demoRecruiterJobs, demoRecruiterSubscription } from "@/features/demo/workspace";
import {
  archiveRecruiterJobAndRedirect,
  duplicateRecruiterJobAndRedirect,
  unarchiveRecruiterJobAndRedirect
} from "@/features/jobs/actions";
import { calculateJobQuotaUsage, isJobCountedTowardQuota } from "@/features/recruiter/quota";
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

type SubscriptionRow = {
  plan: string | null;
  job_quota: number | null;
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

type AdminReviewRow = {
  target_id: string;
  note: string | null;
  decision: "approve" | "reject";
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
  const query = (firstValue(params.q) ?? "").toLowerCase();
  const sort = firstValue(params.sort) || "recent";
  const created = firstValue(params.created) === "1";
  const draft = firstValue(params.draft) === "1";
  const archived = firstValue(params.archived) === "1";
  const restored = firstValue(params.restored) === "1";
  const duplicated = firstValue(params.duplicated) === "1";
  const updated = firstValue(params.updated);
  const error = firstValue(params.error);
  const activeStatus = tabs.some((tab) => tab.status === requestedStatus) ? requestedStatus : undefined;
  let company: CompanyRow | null = isDemo ? demoRecruiterCompany : null;
  let allJobs: JobRow[] = isDemo ? demoRecruiterJobs : [];
  let subscription: SubscriptionRow = isDemo ? demoRecruiterSubscription : { plan: "free", job_quota: 2 };
  let reviewsByJob = new Map<string, AdminReviewRow[]>();

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
      const [{ data: jobData }, { data: subscriptionData }] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, title, contract, city, sector, status, is_featured, is_urgent, created_at")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("subscriptions")
          .select("plan, job_quota")
          .eq("company_id", company.id)
          .maybeSingle<SubscriptionRow>()
      ]);

      allJobs = (jobData ?? []) as JobRow[];
      subscription = subscriptionData ?? subscription;

      const jobIds = allJobs.map((job) => job.id);
      if (jobIds.length > 0) {
        const { data: reviews } = await supabase
          .from("admin_reviews")
          .select("target_id, decision, note, created_at")
          .eq("target_table", "jobs")
          .in("target_id", jobIds)
          .order("created_at", { ascending: false });

        reviewsByJob = ((reviews ?? []) as AdminReviewRow[]).reduce((map, review) => {
          map.set(review.target_id, [...(map.get(review.target_id) ?? []), review]);
          return map;
        }, new Map<string, AdminReviewRow[]>());
      }
    }
  }

  let jobs = activeStatus ? allJobs.filter((job) => job.status === activeStatus) : allJobs;
  if (query) {
    jobs = jobs.filter((job) => `${job.title} ${job.contract} ${job.city} ${job.sector}`.toLowerCase().includes(query));
  }
  if (sort === "title") {
    jobs = [...jobs].sort((left, right) => left.title.localeCompare(right.title, "fr"));
  }

  const total = jobs.length;
  const activeJobs = allJobs.filter((job) => isJobCountedTowardQuota(job.status)).length;
  const published = allJobs.filter((job) => job.status === "published").length;
  const inReview = allJobs.filter((job) => job.status === "pending_review").length;
  const quota = subscription.job_quota ?? demoRecruiterSubscription.job_quota;
  const quotaUsage = calculateJobQuotaUsage({ quota, used: activeJobs });
  const planLabel = subscription.plan ? subscription.plan.toUpperCase() : "GRATUIT";

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
          ["Offres actives", activeJobs, BriefcaseBusiness, `${published} publiée(s) · Plan ${planLabel}`],
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
      {draft ? (
        <div className="notice-line" role="status">
          Brouillon enregistré.
        </div>
      ) : null}
      {archived ? (
        <div className="notice-line" role="status">
          Offre archivée.
        </div>
      ) : null}
      {restored ? (
        <div className="notice-line" role="status">
          Offre restaurée en brouillon.
        </div>
      ) : null}
      {duplicated ? (
        <div className="notice-line" role="status">
          Offre dupliquée en brouillon.
        </div>
      ) : null}
      {updated ? (
        <div className="notice-line" role="status">
          {updated}
        </div>
      ) : null}
      {error ? (
        <div className="notice-line is-error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="panel offers-panel">
        <form className="toolbar" action="/recruteur/offres">
          {activeStatus ? <input type="hidden" name="status" value={activeStatus} /> : null}
          <input className="input" name="q" defaultValue={firstValue(params.q)} placeholder="Rechercher une offre..." />
          <select className="select" name="sort" defaultValue={sort}>
            <option value="recent">Plus récentes</option>
            <option value="title">Titre A-Z</option>
          </select>
          <button className="btn btn-soft" type="submit">Filtrer</button>
        </form>

        <div className="status-tabs" aria-label="Filtrer les offres">
          {tabs.map((tab) => {
            const isActive = tab.status === activeStatus || (!tab.status && !activeStatus);
            const count = tab.status ? allJobs.filter((job) => job.status === tab.status).length : allJobs.length;

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
                  {reviewsByJob.get(job.id)?.map((review) =>
                    review.decision === "reject" && review.note ? (
                      <small className="adminActionHint" key={`${review.created_at}-${review.note}`}>
                        Rejet JobMada: {review.note}
                      </small>
                    ) : null
                  )}
                </div>
                <span className="pill rose">{statusLabels[job.status]}</span>
                <div className="offer-row-actions">
                  <Link className="btn btn-soft" href={`/recruteur/offres/${job.id}/modifier`}>
                    <Pencil aria-hidden="true" size={15} />
                    Modifier
                  </Link>
                  <form action={duplicateRecruiterJobAndRedirect.bind(null, job.id)}>
                    <button type="submit" disabled={isDemo}>
                      <Copy aria-hidden="true" size={15} />
                      Dupliquer
                    </button>
                  </form>
                  {job.status !== "archived" ? (
                    <form action={archiveRecruiterJobAndRedirect.bind(null, job.id)}>
                      <button type="submit" disabled={isDemo}>
                        <Archive aria-hidden="true" size={15} />
                        Archiver
                      </button>
                    </form>
                  ) : (
                    <form action={unarchiveRecruiterJobAndRedirect.bind(null, job.id)}>
                      <button type="submit" disabled={isDemo}>
                        <RotateCcw aria-hidden="true" size={15} />
                        Restaurer
                      </button>
                    </form>
                  )}
                </div>
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
          <span>Plan {planLabel} · {quotaUsage.label}</span>
        </div>
      </section>
    </>
  );
}
