import Link from "next/link";

import { buildJobFilters, getPublishedJobsOrEmpty, type JobFilters } from "@/features/jobs/queries";
import {
  PublicFooter,
  PublicHeader,
  PublicIcons,
  PublicJobCard,
  SearchShell
} from "@/features/public/components";
import { fallbackPublishedJobs, publicSectors, useFallbackJobs } from "@/features/public/demo-data";

export const dynamic = "force-dynamic";

type EmploymentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmploymentPage({ searchParams }: EmploymentPageProps) {
  const rawParams = await searchParams;
  const filters = buildJobFilters(rawParams);
  const liveJobs = await getPublishedJobsOrEmpty(filters);
  const jobs = liveJobs.length > 0 ? liveJobs : filterFallbackJobs(fallbackPublishedJobs, filters, rawParams);
  const { Bell, Layers } = PublicIcons;

  return (
    <>
      <PublicHeader active="/emploi" />
      <main>
        <section className="page-hero">
          <div className="container">
            <h1>Offres d'emploi à Madagascar</h1>
            <p>
              <strong>{jobs.length || 169}</strong> offres disponibles
            </p>
            <SearchShell defaultValue={filters.query} />
          </div>
        </section>

        <section className="section">
          <div className="container jobs-layout jobs-listing-layout">
            <div>
              {jobs.length > 0 ? (
                <div className="job-list" id="jobsList">
                  {jobs.map((job) => (
                    <PublicJobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="empty-state" id="jobEmpty">
                  <h3>Aucune offre trouvée</h3>
                  <p>Essayez une autre recherche ou retirez un filtre.</p>
                </div>
              )}

              <div className="load-more-block">
                <p>
                  Vous voyez <strong id="jobCount">{jobs.length}</strong> offres sur 169
                </p>
                <span className="progress-line">
                  <span style={{ width: `${Math.min(100, Math.round((jobs.length / 169) * 100))}%` }} />
                </span>
                <Link className="btn btn-outline" href="/emploi">
                  Charger plus d'offres
                </Link>
              </div>
            </div>

            <aside className="filter-panel">
              <h3>
                <Layers size={18} aria-hidden="true" /> Filtres
              </h3>
              <div>
                <h4>Type de contrat</h4>
                <div className="check-list">
                  {["CDI", "CDD", "Stage", "Freelance"].map((contract) => (
                    <label key={contract} className="check-row">
                      <input
                        type="checkbox"
                        name="contract"
                        value={contract}
                        defaultChecked={filters.contract === contract}
                      />{" "}
                      <span>{contract}</span>
                      <em>{fallbackPublishedJobs.filter((job) => job.contract === contract).length}</em>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4>Ville</h4>
                <div className="check-list">
                  {["Antananarivo", "Fianarantsoa", "Toamasina", "Télétravail"].map((city) => (
                    <label key={city} className="check-row">
                      <input type="checkbox" name="city" value={city} defaultChecked={filters.city === city} />{" "}
                      <span>{city}</span>
                      <em>{fallbackPublishedJobs.filter((job) => job.city === city).length}</em>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4>Secteur</h4>
                <select className="select" name="sector" defaultValue={filters.sector}>
                  <option value="">Tous les secteurs</option>
                  {publicSectors.map(([name]) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <Link className="btn btn-soft" href="/emploi">
                Réinitialiser
              </Link>
              <div className="side-card dark alert-card">
                <Bell size={18} aria-hidden="true" />
                <h3>Ne ratez plus rien</h3>
                <p>Recevez les nouvelles offres correspondant à votre recherche.</p>
                <Link className="btn btn-primary" href="/inscription/candidat">
                  Créer mon alerte
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function filterFallbackJobs(
  jobs: typeof fallbackPublishedJobs,
  filters: JobFilters,
  rawParams: Record<string, string | string[] | undefined>
) {
  const urgent = rawParams.urgent === "1";
  return useFallbackJobs(jobs).filter((job) => {
    const text = `${job.title} ${job.company.name} ${job.summary} ${job.city} ${job.sector}`.toLowerCase();
    if (filters.query && !text.includes(filters.query.toLowerCase())) {
      return false;
    }
    if (filters.contract && job.contract !== filters.contract) {
      return false;
    }
    if (filters.city && job.city !== filters.city) {
      return false;
    }
    if (filters.sector && job.sector !== filters.sector) {
      return false;
    }
    if (urgent && !job.is_urgent) {
      return false;
    }
    return true;
  });
}
