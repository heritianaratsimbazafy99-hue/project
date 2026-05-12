import Link from "next/link";
import { ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, FileText, Folder, MapPin, Sparkles, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { calculateCandidateCompletion } from "@/features/candidate/completion";
import { demoCandidateApplications } from "@/features/demo/workspace";
import { getCandidateApplicationsOrEmpty } from "@/features/applications/queries";
import { resolveCompanyLogoPath } from "@/features/public/company-logo";
import { fallbackPublishedJobs } from "@/features/public/demo-data";
import { getPublishedJobsOrEmpty } from "@/features/jobs/queries";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CandidateProfileRow = {
  cv_path: string | null;
  desired_role: string | null;
  city: string | null;
  sector: string | null;
};

type OnboardingStep = {
  cta: string;
  label: string;
  helper: string;
  done: boolean;
  href: string;
  Icon: LucideIcon;
};

function scoreRecommendedJob(job: (typeof fallbackPublishedJobs)[number], profile: CandidateProfileRow | null) {
  let score = 0;
  const desiredRole = profile?.desired_role?.toLowerCase() ?? "";

  if (desiredRole && job.title.toLowerCase().includes(desiredRole)) {
    score += 4;
  }

  if (profile?.sector && job.sector === profile.sector) {
    score += 3;
  }

  if (profile?.city && job.city === profile.city) {
    score += 2;
  }

  if (job.is_featured || job.is_urgent) {
    score += 1;
  }

  return score;
}

function recommendedJobs(jobs: typeof fallbackPublishedJobs, profile: CandidateProfileRow | null) {
  return [...jobs]
    .sort((a, b) => scoreRecommendedJob(b, profile) - scoreRecommendedJob(a, profile))
    .slice(0, 6);
}

function firstName(value: string | null | undefined) {
  return value?.trim().split(/\s+/)[0] || "candidat";
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function candidateCompanyMark(name: string, fallbackText: string, logoPath: string | null) {
  const resolvedLogoPath = resolveCompanyLogoPath(logoPath);

  return resolvedLogoPath ? (
    <img src={resolvedLogoPath} alt="" width="44" height="44" />
  ) : (
    initials(name || fallbackText)
  );
}

function matchLabel(index: number) {
  return index < 2 ? "Forte correspondance" : "Bon potentiel";
}

function formatApplicationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

export default async function CandidateDashboardPage() {
  const { user, profile, isDemo } = await requireRole(["candidate"]);
  let candidateProfile: CandidateProfileRow | null = isDemo
    ? {
        cv_path: "demo/cv.pdf",
        desired_role: "Designer UI/UX",
        city: "Antananarivo",
        sector: "Informatique & Digital"
      }
    : null;
  let alertCount = isDemo ? 1 : 0;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const [{ data: candidateProfileData }, { count }] = await Promise.all([
      supabase
        .from("candidate_profiles")
        .select("cv_path, desired_role, city, sector")
        .eq("user_id", user.id)
        .maybeSingle<CandidateProfileRow>(),
      supabase
        .from("job_alerts")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", user.id)
    ]);

    candidateProfile = candidateProfileData;
    alertCount = count ?? 0;
  }

  const jobs = isDemo
    ? fallbackPublishedJobs.slice(0, 4)
    : (await getPublishedJobsOrEmpty({ query: "", contract: [], city: [], sector: "" })).slice(0, 8);
  const recentJobs = recommendedJobs(jobs, candidateProfile);
  const applications = isDemo ? demoCandidateApplications.slice(0, 3) : (await getCandidateApplicationsOrEmpty(user.id)).slice(0, 3);
  const onboardingSteps: OnboardingStep[] = [
    {
      label: "Compte créé",
      helper: "Votre espace candidat est prêt.",
      cta: "Ouvert",
      done: true,
      href: "/candidat/dashboard",
      Icon: CheckCircle2
    },
    {
      label: "Déposer votre CV",
      helper: "Postulez plus vite avec un dossier complet.",
      cta: "Ajouter mon CV",
      done: Boolean(candidateProfile?.cv_path),
      href: "/candidat/profil",
      Icon: FileText
    },
    {
      label: "Indiquer le poste recherché",
      helper: "Aidez JobMada à prioriser les offres utiles.",
      cta: "Renseigner",
      done: Boolean(candidateProfile?.desired_role),
      href: "/candidat/profil#infos",
      Icon: Target
    },
    {
      label: "Activer une alerte emploi",
      helper: "Recevez les nouvelles opportunités ciblées.",
      cta: "Créer l'alerte",
      done: alertCount > 0,
      href: "/candidat/alertes",
      Icon: Bell
    }
  ];
  const completion = calculateCandidateCompletion({
    accountCreated: true,
    hasCv: Boolean(candidateProfile?.cv_path),
    hasDesiredRole: Boolean(candidateProfile?.desired_role),
    hasAlert: alertCount > 0
  });
  const completedSteps = onboardingSteps.filter((step) => step.done).length;
  const nextStep = onboardingSteps.find((step) => !step.done);
  const profileSummary = [
    candidateProfile?.desired_role || "Poste à préciser",
    candidateProfile?.city || "Ville à préciser",
    candidateProfile?.sector || "Secteur à préciser"
  ];

  return (
    <div className="candidateStack">
      <section className="candidateHero" aria-labelledby="candidate-dashboard-title">
        <h1 id="candidate-dashboard-title">Bienvenue, {firstName(profile.display_name)}</h1>
        <p>Voici vos opportunités du jour</p>
      </section>

      <section className="candidateOpportunityPanel" aria-labelledby="opportunity-title">
        <div className="candidateSectionHeader compact">
          <div>
            <span className="candidatePanelIcon" aria-hidden="true">
              <Sparkles size={22} />
            </span>
            <div>
              <h2 id="opportunity-title">Vos prochaines <strong>pistes</strong></h2>
              <p>{recentJobs.length} opportunité{recentJobs.length > 1 ? "s" : ""} sélectionnée{recentJobs.length > 1 ? "s" : ""} pour vous</p>
            </div>
          </div>
          <Link href="/emploi">Toutes les offres</Link>
        </div>

        {recentJobs.length > 0 ? (
          <div className="candidateOpportunityGrid">
            {recentJobs.map((job, index) => (
              <Link key={job.id} className="candidateOpportunityCard" href={`/emploi/${job.slug}`}>
                <span className="candidateCompanyMark" aria-hidden="true">
                  {candidateCompanyMark(job.company.name, job.title, job.company.logo_path)}
                </span>
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company.name}</p>
                  <div className="candidateOpportunityMeta">
                    {job.city ? (
                      <span>
                        <MapPin size={14} aria-hidden="true" />
                        {job.city}
                      </span>
                    ) : null}
                    {job.sector ? (
                      <span>
                        <Folder size={14} aria-hidden="true" />
                        {job.sector}
                      </span>
                    ) : null}
                  </div>
                  <div className="candidateOpportunityBadges">
                    <span>
                      <BriefcaseBusiness size={13} aria-hidden="true" />
                      {job.contract || "Contrat"}
                    </span>
                    <span>{matchLabel(index)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="candidateEmptyState">
            <h3>Aucune offre récente pour le moment</h3>
            <p>Les nouvelles opportunités publiées sur JobMada apparaîtront ici.</p>
          </div>
        )}
      </section>

      <section className="candidateMiniApplications" aria-labelledby="candidate-recent-applications">
        <div className="candidateSectionHeader flush">
          <h2 id="candidate-recent-applications">Dernières <strong>candidatures</strong></h2>
          <Link href="/candidat/candidatures">Voir tout</Link>
        </div>
        <div className="candidateMiniApplicationTable">
          <div aria-hidden="true">
            <span>Poste</span>
            <span>Contrat</span>
            <span>Date</span>
            <span>Statut</span>
          </div>
          {applications.length > 0 ? (
            applications.map((application) => (
              <Link key={application.id} href={`/emploi/${application.job.slug}`}>
                <strong>{application.job.title}</strong>
                <span>{application.job.contract || "Contrat"}</span>
                <span>{formatApplicationDate(application.created_at)}</span>
                <span>Envoyée</span>
              </Link>
            ))
          ) : (
            <p>Aucune candidature récente.</p>
          )}
        </div>
      </section>

      <div className="candidateDashboardGrid">
        <section className="candidateCard candidateOnboardingCard" aria-labelledby="onboarding-title">
          <div className="candidateSectionHeader">
            <div>
              <p className="candidateEyebrow">Bienvenue sur JobMada</p>
              <h2 id="onboarding-title">Voici comment démarrer en 4 étapes</h2>
            </div>
            <span>
              {completedSteps} étape{completedSteps > 1 ? "s" : ""} sur {onboardingSteps.length} complétée
              {completedSteps > 1 ? "s" : ""}
            </span>
          </div>

          <ol className="onboardingList">
            {onboardingSteps.map((step, index) => {
              const Icon = step.Icon;

              return (
                <li key={step.label} className={step.done ? "isDone" : undefined}>
                  <span aria-hidden="true">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <strong>{step.label}</strong>
                  <small>{step.helper}</small>
                  {step.done ? <em>{step.cta}</em> : <Link href={step.href}>{step.cta} →</Link>}
                  <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                </li>
              );
            })}
          </ol>
          <div className="onboardingProgress" aria-label={`${completion.percent}% du profil complété`}>
            {onboardingSteps.map((step) => (
              <span key={step.label} className={step.done ? "isDone" : undefined} />
            ))}
          </div>
        </section>

        <aside className="candidateNextStepCard" aria-labelledby="candidate-next-step-title">
          <div className="candidateNextStepIcon" aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <p className="candidateEyebrow">Action prioritaire</p>
          <h2 id="candidate-next-step-title">{nextStep ? nextStep.label : "Votre profil est prêt"}</h2>
          <p>{nextStep ? nextStep.helper : "Vous pouvez maintenant explorer les offres et postuler avec un dossier complet."}</p>
          <div className="candidateProfileChips" aria-label="Profil recherché">
            {profileSummary.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <Link className="candidatePrimaryLink" href={nextStep?.href ?? "/emploi"}>
            {nextStep ? nextStep.cta : "Voir les offres"}
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
