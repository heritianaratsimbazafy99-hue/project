import Link from "next/link";

import { submitCompanyForReview } from "@/features/recruiter/company-actions";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompanyStatus, JobStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type CompanyRow = {
  id: string;
  name: string;
  status: CompanyStatus;
  sector: string | null;
  city: string | null;
};

type SubscriptionRow = {
  plan: string | null;
  status: string | null;
  job_quota: number | null;
  cv_access_enabled: boolean | null;
};

type JobRow = {
  id: string;
  title: string;
  status: JobStatus;
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

const companyStatusLabels: Record<CompanyStatus, string> = {
  incomplete: "Incomplète",
  pending_review: "En revue",
  verified: "Vérifiée",
  rejected: "Rejetée"
};

export default async function RecruiterDashboardPage() {
  const { user, profile } = await requireRole(["recruiter"]);
  const supabase = await createSupabaseServerClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, status, sector, city")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<CompanyRow>();

  const [{ data: subscription }, { data: jobs }, { count: totalJobCount }, { count: publishedCount }, { count: reviewCount }] = company
    ? await Promise.all([
        supabase
          .from("subscriptions")
          .select("plan, status, job_quota, cv_access_enabled")
          .eq("company_id", company.id)
          .maybeSingle<SubscriptionRow>(),
        supabase
          .from("jobs")
          .select("id, title, status, created_at")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("company_id", company.id),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .eq("status", "published"),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .eq("status", "pending_review")
      ])
    : [{ data: null }, { data: [] }, { count: 0 }, { count: 0 }, { count: 0 }];

  const ownedJobs = (jobs ?? []) as JobRow[];
  const jobCount = totalJobCount ?? 0;
  const quota = subscription?.job_quota ?? 0;
  const onboardingSteps = [
    { label: "Compte recruteur créé", done: true },
    { label: "Entreprise renseignée", done: Boolean(company) },
    { label: "Entreprise vérifiée", done: company?.status === "verified" },
    { label: "Première offre envoyée", done: jobCount > 0 }
  ];
  const completedSteps = onboardingSteps.filter((step) => step.done).length;

  return (
    <div className="recruiterStack">
      <section className="recruiterHero" aria-labelledby="recruiter-dashboard-title">
        <p className="recruiterEyebrow">Dashboard recruteur</p>
        <h1 id="recruiter-dashboard-title">
          Bonjour{profile.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p>
          Pilotez vos offres JobMada, suivez la revue de l'équipe et gardez une lecture claire de vos quotas.
        </p>
      </section>

      <section className="recruiterMetricGrid" aria-label="Indicateurs recruteur">
        <article>
          <span>Offres</span>
          <strong>{jobCount}</strong>
          <p>{quota > 0 ? `${Math.max(quota - jobCount, 0)} restantes sur votre plan` : "Quota à configurer"}</p>
        </article>
        <article>
          <span>En revue</span>
          <strong>{reviewCount}</strong>
          <p>Les offres soumises attendent la validation JobMada.</p>
        </article>
        <article>
          <span>Publiées</span>
          <strong>{publishedCount}</strong>
          <p>Visibles actuellement sur le site public.</p>
        </article>
      </section>

      <section className="recruiterPanel" aria-labelledby="recruiter-onboarding-title">
        <div className="recruiterSectionHeader">
          <div>
            <p className="recruiterEyebrow">Onboarding</p>
            <h2 id="recruiter-onboarding-title">Prêt à recruter</h2>
          </div>
          <span>
            {completedSteps} étapes sur {onboardingSteps.length}
          </span>
        </div>
        <ol className="recruiterStepList">
          {onboardingSteps.map((step) => (
            <li key={step.label} className={step.done ? "isDone" : undefined}>
              <span aria-hidden="true">{step.done ? "OK" : ""}</span>
              {step.label}
            </li>
          ))}
        </ol>
      </section>

      <div className="recruiterPanelGrid">
        <section className="recruiterPanel" aria-labelledby="recruiter-company-title">
          <div className="recruiterSectionHeader">
            <div>
              <p className="recruiterEyebrow">Entreprise</p>
              <h2 id="recruiter-company-title">{company?.name || "Aucune entreprise"}</h2>
            </div>
          </div>
          {company ? (
            <div className="recruiterCompanyReview">
              <p>
                {company.sector || "Secteur à préciser"} · {company.city || "Ville à préciser"} · Statut{" "}
                {companyStatusLabels[company.status]}
              </p>
              {company.status === "incomplete" || company.status === "rejected" ? (
                <form action={submitCompanyForReview.bind(null, company.id)}>
                  <button className="primaryAction" type="submit">
                    Envoyer en revue
                  </button>
                </form>
              ) : null}
              {company.status === "pending_review" ? (
                <p className="recruiterHint">La fiche est entre les mains de l'équipe JobMada.</p>
              ) : null}
            </div>
          ) : (
            <div className="recruiterEmptyState">
              <h3>Complétez votre fiche entreprise</h3>
              <p>Vos offres seront rattachées à votre entreprise dès qu'elle existe dans JobMada.</p>
            </div>
          )}
        </section>

        <section className="recruiterPanel" aria-labelledby="recruiter-activity-title">
          <div className="recruiterSectionHeader">
            <div>
              <p className="recruiterEyebrow">Activité</p>
              <h2 id="recruiter-activity-title">Dernières offres</h2>
            </div>
            <Link href="/recruteur/offres">Voir tout</Link>
          </div>
          {ownedJobs.length > 0 ? (
            <div className="recruiterActivityList">
              {ownedJobs.map((job) => (
                <Link key={job.id} href="/recruteur/offres">
                  <strong>{job.title}</strong>
                  <span>{statusLabels[job.status]}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="recruiterEmptyState">
              <h3>Aucune activité pour le moment</h3>
              <p>Créez une première offre pour alimenter ce fil.</p>
              <Link className="primaryAction" href="/recruteur/offres/nouvelle">
                Nouvelle offre
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
