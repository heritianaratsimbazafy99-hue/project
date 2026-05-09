import Link from "next/link";

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
  { label: "Rejetées", href: "/recruteur/offres?status=rejected", status: "rejected" }
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
  const { user } = await requireRole(["recruiter"]);
  const params = await searchParams;
  const requestedStatus = firstValue(params.status) as JobStatus | undefined;
  const created = firstValue(params.created) === "1";
  const activeStatus = tabs.some((tab) => tab.status === requestedStatus) ? requestedStatus : undefined;
  const supabase = await createSupabaseServerClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<CompanyRow>();

  let jobs: JobRow[] = [];

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

  return (
    <div className="recruiterStack">
      <section className="recruiterHero compact" aria-labelledby="recruiter-offers-title">
        <div>
          <p className="recruiterEyebrow">Offres</p>
          <h1 id="recruiter-offers-title">Vos offres d'emploi</h1>
          <p>Préparez, soumettez et suivez les annonces rattachées à votre entreprise.</p>
        </div>
        <Link className="primaryAction" href="/recruteur/offres/nouvelle">
          Nouvelle offre
        </Link>
      </section>

      <nav className="recruiterTabs" aria-label="Filtrer les offres">
        {tabs.map((tab) => {
          const isActive = tab.status === activeStatus || (!tab.status && !activeStatus);

          return (
            <Link key={tab.href} className={isActive ? "isActive" : undefined} href={tab.href}>
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {created ? (
        <div className="recruiterNotice" role="status">
          L'offre est envoyée à l'équipe JobMada pour revue.
        </div>
      ) : null}

      {jobs.length > 0 ? (
        <div className="recruiterOfferList" aria-label="Liste des offres recruteur">
          {jobs.map((job) => (
            <article key={job.id} className="recruiterOfferCard">
              <div>
                <span className="recruiterStatus">{statusLabels[job.status]}</span>
                <h2>{job.title}</h2>
                <p>
                  {job.contract} · {job.city} · {job.sector}
                </p>
              </div>
              <div className="recruiterBoosts" aria-label="Options de visibilité">
                <span>{job.is_featured ? "Mise en avant" : "Standard"}</span>
                <span>{job.is_urgent ? "Urgente" : "Non urgente"}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="recruiterEmptyState isLarge" aria-labelledby="recruiter-offers-empty-title">
          <h2 id="recruiter-offers-empty-title">
            {company ? "Aucune offre dans cet onglet" : "Aucune entreprise rattachée"}
          </h2>
          <p>
            {company
              ? "Créez une offre manuelle ou revenez sur l'ensemble des statuts pour retrouver vos annonces."
              : "Votre espace recruteur est prêt, mais une fiche entreprise est nécessaire avant la création d'offres."}
          </p>
          <Link className="primaryAction" href="/recruteur/offres/nouvelle">
            Nouvelle offre
          </Link>
        </section>
      )}
    </div>
  );
}
