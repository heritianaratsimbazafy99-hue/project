import Link from "next/link";
import { notFound } from "next/navigation";

import { brand } from "@/config/brand";
import { getPublishedJobBySlug } from "@/features/jobs/queries";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = await getPublishedJobBySlug(slug);

  if (!job) {
    notFound();
  }

  return (
    <main className="siteShell">
      <header className="siteHeader publicHeader" aria-label="Navigation publique">
        <Link className="brand" href="/" aria-label="JobMada accueil">
          <img src={brand.logoPath} alt="" width="56" height="56" />
          <span>{brand.name}</span>
        </Link>
        <Link className="headerLink" href="/emploi">
          Offres
        </Link>
      </header>

      <article className="jobDetailShell">
        <nav className="breadcrumb" aria-label="Fil d'Ariane">
          <Link href="/emploi">← Retour aux offres</Link>
        </nav>

        <div className="jobDetailLayout">
          <div className="jobDetailMain">
            <p className="jobCompany">{job.company.name}</p>
            <h1>{job.title}</h1>

            <dl className="jobMeta detailMeta">
              {job.city ? (
                <div>
                  <dt>Ville</dt>
                  <dd>{job.city}</dd>
                </div>
              ) : null}
              {job.contract ? (
                <div>
                  <dt>Contrat</dt>
                  <dd>{job.contract}</dd>
                </div>
              ) : null}
              {job.sector ? (
                <div>
                  <dt>Secteur</dt>
                  <dd>{job.sector}</dd>
                </div>
              ) : null}
            </dl>

            <section className="jobSection" aria-labelledby="summary-title">
              <h2 id="summary-title">Résumé</h2>
              <p>{job.summary || "Cette entreprise recrute actuellement pour ce poste."}</p>
            </section>

            <section className="jobSection" aria-labelledby="description-title">
              <h2 id="description-title">Description</h2>
              <p>{job.description || "Les détails de l'offre seront partagés avec les candidats retenus."}</p>
            </section>

            <section className="jobSection" aria-labelledby="missions-title">
              <h2 id="missions-title">Missions</h2>
              <p>{job.missions || "Les missions principales seront précisées pendant le processus de recrutement."}</p>
            </section>

            <section className="jobSection" aria-labelledby="profile-title">
              <h2 id="profile-title">Profil recherché</h2>
              <p>{job.profile || "Les candidatures motivées et adaptées au poste sont encouragées."}</p>
            </section>

            <section className="companySummary" aria-labelledby="company-title">
              {job.company.logo_path ? (
                <img src={job.company.logo_path} alt="" width="56" height="56" />
              ) : null}
              <div>
                <h2 id="company-title">{job.company.name}</h2>
                <p>
                  {[job.company.city, job.company.sector].filter(Boolean).join(" · ") ||
                    "Entreprise vérifiée sur JobMada"}
                </p>
                {job.company.description ? <p>{job.company.description}</p> : null}
              </div>
            </section>
          </div>

          <aside className="applyPanel" aria-label="Candidature">
            <h2>Intéressé par cette offre ?</h2>
            <p>Connectez-vous pour préparer votre candidature sur JobMada.</p>
            <Link className="primaryAction" href="/connexion">
              Postuler maintenant
            </Link>
          </aside>
        </div>
      </article>
    </main>
  );
}
