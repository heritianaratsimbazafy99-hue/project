import Link from "next/link";

import { calculateCandidateCompletion } from "@/features/candidate/completion";
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
  label: string;
  helper: string;
  done: boolean;
  href: string;
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
    .slice(0, 4);
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
    : (await getPublishedJobsOrEmpty({ query: "", contract: "", city: "", sector: "" })).slice(0, 8);
  const recentJobs = recommendedJobs(jobs, candidateProfile);
  const onboardingSteps: OnboardingStep[] = [
    { label: "Compte créé", helper: "Votre espace candidat est prêt.", done: true, href: "/candidat/dashboard" },
    {
      label: "Déposer votre CV",
      helper: "Postulez plus vite avec un dossier complet.",
      done: Boolean(candidateProfile?.cv_path),
      href: "/candidat/profil"
    },
    {
      label: "Indiquer le poste recherché",
      helper: "Aidez JobMada à prioriser les offres utiles.",
      done: Boolean(candidateProfile?.desired_role),
      href: "/candidat/profil#infos"
    },
    {
      label: "Activer une alerte emploi",
      helper: "Recevez les nouvelles opportunités ciblées.",
      done: alertCount > 0,
      href: "/candidat/alertes"
    }
  ];
  const completion = calculateCandidateCompletion({
    accountCreated: true,
    hasCv: Boolean(candidateProfile?.cv_path),
    hasDesiredRole: Boolean(candidateProfile?.desired_role),
    hasAlert: alertCount > 0
  });
  const completedSteps = onboardingSteps.filter((step) => step.done).length;

  return (
    <div className="candidateStack">
      <section className="candidateHero" aria-labelledby="candidate-dashboard-title">
        <p className="candidateEyebrow">Dashboard</p>
        <h1 id="candidate-dashboard-title">Bonjour{profile.display_name ? `, ${profile.display_name}` : ""}</h1>
        <p>Bienvenue sur JobMada, votre prochain emploi commence ici.</p>
      </section>

      <section className="candidateCard" aria-labelledby="onboarding-title">
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
          {onboardingSteps.map((step, index) => (
            <li key={step.label} className={step.done ? "isDone" : undefined}>
              <span aria-hidden="true">{step.done ? "OK" : String(index + 1).padStart(2, "0")}</span>
              <strong>{step.label}</strong>
              <small>{step.helper}</small>
              {step.done ? null : <Link href={step.href}>Compléter →</Link>}
            </li>
          ))}
        </ol>
        <div className="onboardingProgress" aria-label={`${completion.percent}% du profil complété`}>
          {onboardingSteps.map((step) => (
            <span key={step.label} className={step.done ? "isDone" : undefined} />
          ))}
        </div>
      </section>

      <section className="candidateCard" aria-labelledby="recent-jobs-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Recommandations</p>
            <h2 id="recent-jobs-title">
              {candidateProfile?.desired_role ? "Offres proches de votre profil" : "Pour commencer, découvrez les offres récentes"}
            </h2>
          </div>
          <Link href="/emploi">Toutes les offres</Link>
        </div>

        {recentJobs.length > 0 ? (
          <div className="candidateJobList">
            {recentJobs.map((job) => (
              <Link key={job.id} href={`/emploi/${job.slug}`}>
                <strong>{job.title}</strong>
                <span>
                  {job.company.name} · {job.city || "Madagascar"} · {job.contract || "Contrat à préciser"}
                </span>
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
    </div>
  );
}
