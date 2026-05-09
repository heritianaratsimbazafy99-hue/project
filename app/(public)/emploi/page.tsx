import Link from "next/link";

import { brand } from "@/config/brand";
import { JobCard } from "@/features/jobs/components/job-card";
import { buildJobFilters, getPublishedJobs } from "@/features/jobs/queries";

export const dynamic = "force-dynamic";

type EmploymentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmploymentPage({ searchParams }: EmploymentPageProps) {
  const filters = buildJobFilters(await searchParams);
  const jobs = await getPublishedJobs(filters);
  const urgentJobs = jobs.filter((job) => job.is_urgent).slice(0, 4);

  return (
    <main className="siteShell">
      <header className="siteHeader publicHeader" aria-label="Navigation publique">
        <Link className="brand" href="/" aria-label="JobMada accueil">
          <img src={brand.logoPath} alt="" width="56" height="56" />
          <span>{brand.name}</span>
        </Link>
        <Link className="headerLink" href="/connexion">
          Connexion
        </Link>
      </header>

      <section className="jobBoardShell" aria-labelledby="jobs-title">
        <div className="jobBoardIntro">
          <p>{brand.tagline}</p>
          <h1 id="jobs-title">Offres d'emploi à Madagascar</h1>
        </div>

        <form className="jobFilters" action="/emploi">
          <label>
            Recherche
            <input name="q" type="search" defaultValue={filters.query} placeholder="Métier, mot-clé" />
          </label>
          <label>
            Contrat
            <input name="contract" defaultValue={filters.contract} placeholder="CDI, CDD, Stage" />
          </label>
          <label>
            Ville
            <input name="city" defaultValue={filters.city} placeholder="Antananarivo" />
          </label>
          <label>
            Secteur
            <input name="sector" defaultValue={filters.sector} placeholder="Informatique & Digital" />
          </label>
          <button type="submit">Rechercher</button>
        </form>

        <div className="jobResultsHeader">
          <p>
            {jobs.length} {jobs.length > 1 ? "offres trouvées" : "offre trouvée"}
          </p>
        </div>

        <div className="jobBoardLayout">
          <div>
            {jobs.length > 0 ? (
              <div className="jobList" aria-label="Liste des offres d'emploi">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="emptyState" role="status">
                <h2>Aucune offre publiée ne correspond à ces filtres.</h2>
                <p>Essayez une recherche plus large ou revenez bientôt.</p>
              </div>
            )}
          </div>

          <aside className="stickyRail" aria-label="Sélection JobMada">
            <section className="railPanel" aria-labelledby="urgent-title">
              <h2 id="urgent-title">Derniers jours pour postuler</h2>
              {urgentJobs.length > 0 ? (
                <div className="railJobList">
                  {urgentJobs.map((job) => (
                    <Link key={job.id} href={`/emploi/${job.slug}`}>
                      <strong>{job.title}</strong>
                      <span>{job.company.name}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p>Les offres urgentes apparaîtront ici dès leur publication.</p>
              )}
            </section>

            <section className="railPanel proPanel" aria-labelledby="pro-title">
              <h2 id="pro-title">JobMada Pro</h2>
              <p>Publiez vos offres, suivez les candidatures et gardez votre recrutement sous contrôle.</p>
              <Link className="primaryAction" href="/tarifs">
                Découvrir Pro
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
