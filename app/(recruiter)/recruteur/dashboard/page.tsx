import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, Circle, Eye, FileText, Plus, TrendingUp, UsersRound, Zap } from "lucide-react";

import { demoRecruiterCompany, demoRecruiterJobs, demoRecruiterSubscription } from "@/features/demo/workspace";
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
  const { user, profile, isDemo } = await requireRole(["recruiter"]);
  let company: CompanyRow | null = isDemo ? demoRecruiterCompany : null;
  let subscription: SubscriptionRow | null = isDemo ? demoRecruiterSubscription : null;
  let ownedJobs: JobRow[] = isDemo ? demoRecruiterJobs : [];
  let publishedCount = isDemo ? 1 : 0;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();

    const { data: companyData } = await supabase
      .from("companies")
      .select("id, name, status, sector, city")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<CompanyRow>();

    company = companyData;

    if (company) {
      const [{ data: subscriptionData }, { data: jobs }, { count: published }] = await Promise.all([
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
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .eq("status", "published")
      ]);

      subscription = subscriptionData;
      ownedJobs = (jobs ?? []) as JobRow[];
      publishedCount = published ?? 0;
    }
  }

  const jobCount = ownedJobs.length;
  const quota = subscription?.job_quota ?? 0;
  const remaining = quota > 0 ? Math.max(quota - jobCount, 0) : 0;
  const displayName = profile.display_name?.replace("JobMada", "").trim() || profile.email || "recruteur";
  const onboardingSteps = [
    { label: "Créer votre compte", done: true },
    { label: "Compléter le profil entreprise", done: Boolean(company) },
    { label: "Publier votre première offre", done: jobCount > 0 }
  ];
  const completedSteps = onboardingSteps.filter((step) => step.done).length;

  const metrics = [
    ["Offres actives", publishedCount, BriefcaseBusiness, `${publishedCount} publiée(s)`],
    ["Candidatures non lues", 0, UsersRound, "Aucune nouvelle"],
    ["Shortlistés en cours", 0, FileText, "Aucun shortlist"],
    ["Vues totales", isDemo ? 128 : 0, Eye, isDemo ? "+12 cette semaine" : "— vs sem. préc."],
    ["Quota restant", remaining, FileText, quota > 0 ? `${jobCount}/${quota} utilisées` : "À configurer"]
  ] as const;

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Bonjour, {displayName}</h1>
          <p>
            {company?.name || "Entreprise JobMada"} — Plan {subscription?.plan ?? "Gratuit"}
          </p>
        </div>
      </div>

      <section className="onboarding-panel">
        <h2>
          <Zap aria-hidden="true" size={20} />
          Démarrez en 3 étapes
        </h2>
        <div className="onboarding-progress" aria-hidden="true">
          <span style={{ width: `${(completedSteps / onboardingSteps.length) * 100}%` }} />
        </div>
        <div className="onboarding-steps">
          {onboardingSteps.map((step) =>
            step.done ? (
              <div className="done" key={step.label}>
                <CheckCircle2 aria-hidden="true" size={20} />
                <span>{step.label}</span>
              </div>
            ) : (
              <Link href={step.label.includes("offre") ? "/recruteur/offres/nouvelle" : "/recruteur/entreprise"} key={step.label}>
                <Circle aria-hidden="true" size={20} />
                <span>{step.label}</span>
                {step.label.includes("offre") ? <strong>Publier une offre</strong> : null}
              </Link>
            )
          )}
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Indicateurs recruteur">
        {metrics.map(([label, value, Icon, hint]) => (
          <article className="metric-card" key={label}>
            <span className="icon-tile">
              <Icon aria-hidden="true" size={18} />
            </span>
            <strong>{value}</strong>
            <span>{label}</span>
            <small>{hint}</small>
          </article>
        ))}
      </section>

      <div className="recruiter-two">
        <section className="panel todo-panel">
          <h2>À faire</h2>
          <Link href="/recruteur/entreprise">
            <span className="icon-tile">
              <BriefcaseBusiness aria-hidden="true" size={18} />
            </span>
            <div>
              <strong>Compléter votre profil entreprise</strong>
              <p>
                {company
                  ? `${company.sector || "Secteur à préciser"} · ${company.city || "Ville à préciser"} · ${companyStatusLabels[company.status]}`
                  : "Un profil complet attire plus de candidatures"}
              </p>
            </div>
            <span aria-hidden="true">›</span>
          </Link>
          <Link href="/recruteur/offres/nouvelle">
            <span className="icon-tile">
              <Plus aria-hidden="true" size={18} />
            </span>
            <div>
              <strong>Publier une nouvelle offre</strong>
              <p>Trouvez votre prochain talent</p>
            </div>
            <span aria-hidden="true">›</span>
          </Link>
          {company && (company.status === "incomplete" || company.status === "rejected") ? (
            <form action={submitCompanyForReview.bind(null, company.id)}>
              <button className="btn btn-outline" type="submit">
                Envoyer l'entreprise en revue
              </button>
            </form>
          ) : null}
        </section>

        <section className="panel activity-panel">
          <h2>
            <TrendingUp aria-hidden="true" size={20} />
            Activité 7 jours
          </h2>
          <div className="chart-shell" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <i />
          </div>
          <div className="chart-labels">
            {["sam.", "dim.", "lun.", "mar.", "mer.", "jeu.", "ven."].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <p>
            <b>●</b> Vues <b>●</b> Candidatures
          </p>
        </section>
      </div>

      <section className="panel latest-empty">
        <h2>
          Dernières offres <Link href="/recruteur/offres">Voir tout →</Link>
        </h2>
        {ownedJobs.length > 0 ? (
          <div className="table-list">
            {ownedJobs.map((job) => (
              <div className="table-row" key={job.id}>
                <div>
                  <strong>{job.title}</strong>
                  <p>{statusLabels[job.status]}</p>
                </div>
                <span className="pill rose">{statusLabels[job.status]}</span>
                <Link className="btn btn-soft" href="/recruteur/offres">
                  Modifier
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText aria-hidden="true" size={24} />
            <p>Aucune offre pour le moment</p>
            <Link className="btn btn-primary" href="/recruteur/offres/nouvelle">
              <Plus aria-hidden="true" size={18} />
              Publier ma première offre
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
