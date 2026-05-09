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
};

export default async function CandidateDashboardPage() {
  const { user, profile, isDemo } = await requireRole(["candidate"]);
  let candidateProfile: CandidateProfileRow | null = isDemo
    ? {
        cv_path: "demo/cv.pdf",
        desired_role: "Designer UI/UX"
      }
    : null;
  let alertCount = isDemo ? 1 : 0;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const [{ data: candidateProfileData }, { count }] = await Promise.all([
      supabase
        .from("candidate_profiles")
        .select("cv_path, desired_role")
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

  const recentJobs = isDemo
    ? fallbackPublishedJobs.slice(0, 3)
    : (await getPublishedJobsOrEmpty({ query: "", contract: "", city: "", sector: "" })).slice(0, 3);
  const onboardingSteps = [
    { label: "Compte créé", done: true, href: "/candidat/dashboard" },
    { label: "Déposer votre CV", done: Boolean(candidateProfile?.cv_path), href: "/candidat/profil" },
    {
      label: "Indiquer le poste recherché",
      done: Boolean(candidateProfile?.desired_role),
      href: "/candidat/profil#infos"
    },
    { label: "Activer une alerte emploi", done: alertCount > 0, href: "/candidat/alertes" }
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
        <p>
          Bienvenue dans votre espace candidat JobMada. Finalisez votre profil pour postuler plus vite et recevoir
          les meilleures offres à Madagascar.
        </p>
      </section>

      <section className="candidateCard" aria-labelledby="onboarding-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Onboarding</p>
            <h2 id="onboarding-title">Vos premières étapes</h2>
          </div>
          <span>
            {completedSteps} étapes sur {onboardingSteps.length} complétées · {completion.percent}%
          </span>
        </div>

        <ol className="onboardingList">
          {onboardingSteps.map((step) => (
            <li key={step.label} className={step.done ? "isDone" : undefined}>
              <span aria-hidden="true">{step.done ? "OK" : ""}</span>
              {step.done ? step.label : <Link href={step.href}>{step.label}</Link>}
            </li>
          ))}
        </ol>
      </section>

      <section className="candidateCard" aria-labelledby="recent-jobs-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Offres récentes</p>
            <h2 id="recent-jobs-title">À consulter maintenant</h2>
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
