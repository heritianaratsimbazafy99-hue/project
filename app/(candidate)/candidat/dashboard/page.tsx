import Link from "next/link";

import { getPublishedJobs } from "@/features/jobs/queries";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

const onboardingSteps = [
  { label: "Compte créé", done: true },
  { label: "Déposer votre CV", done: false },
  { label: "Indiquer le poste recherché", done: false },
  { label: "Activer une alerte emploi", done: false }
];

export default async function CandidateDashboardPage() {
  const { profile } = await requireRole(["candidate"]);
  const recentJobs = (await getPublishedJobs({ query: "", contract: "", city: "", sector: "" })).slice(0, 3);
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
            {completedSteps} étapes sur {onboardingSteps.length} complétées
          </span>
        </div>

        <ol className="onboardingList">
          {onboardingSteps.map((step) => (
            <li key={step.label} className={step.done ? "isDone" : undefined}>
              <span aria-hidden="true">{step.done ? "OK" : ""}</span>
              {step.label}
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
