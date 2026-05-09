import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function CandidateApplicationsPage() {
  await requireRole(["candidate"]);

  return (
    <div className="candidateStack">
      <section className="candidateHero" aria-labelledby="applications-title">
        <p className="candidateEyebrow">Mes candidatures</p>
        <h1 id="applications-title">Suivi des candidatures</h1>
        <p>Retrouvez ici les offres auxquelles vous avez postulé et leur avancement.</p>
      </section>

      <section className="candidateCard" aria-labelledby="applications-empty-title">
        <div className="candidateEmptyState isLarge">
          <h2 id="applications-empty-title">Vous n’avez pas encore postulé</h2>
          <p>
            Explorez les offres disponibles sur JobMada, préparez votre CV, puis postulez aux opportunités qui
            correspondent à votre profil.
          </p>
          <Link className="primaryAction" href="/emploi">
            Voir les offres
          </Link>
        </div>
      </section>
    </div>
  );
}
