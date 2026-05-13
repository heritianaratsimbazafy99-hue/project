import Link from "next/link";

import { JOB_CONTRACT_OPTIONS } from "@/features/jobs/contracts";
import {
  buildJobFilters,
  buildJobPageHref,
  getPublishedJobsPageOrEmpty,
  type JobFilters
} from "@/features/jobs/queries";
import {
  PublicFooter,
  PublicHeader,
  PublicIcons,
  PublicJobCard,
  SearchShell
} from "@/features/public/components";
import { canUsePublicFallbackJobs, fallbackPublishedJobs, publicSectors, useFallbackJobs } from "@/features/public/demo-data";

export const dynamic = "force-dynamic";

type EmploymentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmploymentPage({ searchParams }: EmploymentPageProps) {
  const rawParams = await searchParams;
  const filters = buildJobFilters(rawParams);
  const livePage = await getPublishedJobsPageOrEmpty(filters);
  const fallbackEnabled = canUsePublicFallbackJobs();
  const fallbackMatches = fallbackEnabled ? filterFallbackJobs(fallbackPublishedJobs, filters) : [];
  const fallbackStart = ((filters.page ?? 1) - 1) * (filters.pageSize ?? 12);
  const fallbackJobs = fallbackMatches.slice(fallbackStart, fallbackStart + (filters.pageSize ?? 12));
  const usingFallbackJobs = livePage.jobs.length === 0 && fallbackJobs.length > 0;
  const jobs = usingFallbackJobs ? fallbackJobs : livePage.jobs;
  const totalJobs = usingFallbackJobs ? fallbackMatches.length : livePage.total;
  const hasMore = (filters.page ?? 1) * (filters.pageSize ?? 12) < totalJobs;
  const hasPrevious = (filters.page ?? 1) > 1;
  const { Bell, Layers } = PublicIcons;

  return (
    <>
      <PublicHeader active="/emploi" />
      <main>
        <section className="page-hero">
          <div className="container">
            <h1>Offres d'emploi à Madagascar</h1>
            <p>
              <strong>{totalJobs}</strong> {totalJobs === 1 ? "offre disponible" : "offres disponibles"}
            </p>
            <SearchShell defaultValue={filters.query} />
          </div>
        </section>

        <section className="section">
          <div className="container jobs-layout jobs-listing-layout">
            <div>
              {usingFallbackJobs ? (
                <div className="notice-line" role="status">
                  Aucune offre publiée n'a été trouvée dans Supabase pour ces filtres. Les cartes affichées ci-dessous sont des exemples locaux pour prévisualiser le parcours.
                </div>
              ) : null}
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
                  Vous voyez <strong id="jobCount">{jobs.length}</strong> offres sur {totalJobs}
                </p>
                <span className="progress-line">
                  <span style={{ width: `${Math.min(100, Math.round((jobs.length / Math.max(totalJobs, 1)) * 100))}%` }} />
                </span>
                <div className="pagination-actions">
                  {hasPrevious ? (
                    <Link className="btn btn-outline" href={buildJobPageHref(filters, (filters.page ?? 1) - 1)}>
                      Page précédente
                    </Link>
                  ) : null}
                  {hasMore ? (
                    <Link className="btn btn-outline" href={buildJobPageHref(filters, (filters.page ?? 1) + 1)}>
                      Page suivante
                    </Link>
                  ) : (
                    <span className="btn btn-outline" aria-disabled="true">
                      Toutes les offres sont affichées
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form className="filter-panel" action="/emploi">
              {filters.query ? <input type="hidden" name="q" value={filters.query} /> : null}
              {filters.company ? <input type="hidden" name="company" value={filters.company} /> : null}
              <h3>
                <Layers size={18} aria-hidden="true" /> Filtres
              </h3>
              <div>
                <h4>Type de contrat</h4>
                <div className="check-list">
                  {JOB_CONTRACT_OPTIONS.map((contract) => (
                    <label key={contract} className="check-row">
                      <input
                        type="checkbox"
                        name="contract"
                        value={contract}
                        defaultChecked={filters.contract.includes(contract)}
                      />{" "}
                      <span>{contract}</span>
                      <em>{fallbackEnabled ? fallbackPublishedJobs.filter((job) => job.contract === contract).length : 0}</em>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4>Ville</h4>
                <div className="check-list">
                  {["Antananarivo", "Fianarantsoa", "Toamasina", "Télétravail"].map((city) => (
                    <label key={city} className="check-row">
                      <input type="checkbox" name="city" value={city} defaultChecked={filters.city.includes(city)} />{" "}
                      <span>{city}</span>
                      <em>{fallbackEnabled ? fallbackPublishedJobs.filter((job) => job.city === city).length : 0}</em>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4>Secteur</h4>
                <select className="select" name="sector" defaultValue={filters.sector}>
                  <option value="">Tous les secteurs</option>
                  {publicSectors.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="check-row">
                <input type="checkbox" name="urgent" value="1" defaultChecked={filters.urgent} />{" "}
                <span>Offres urgentes</span>
                <em>{fallbackEnabled ? fallbackPublishedJobs.filter((job) => job.is_urgent).length : 0}</em>
              </label>
              <div>
                <h4>Tri</h4>
                <select className="select" name="sort" defaultValue={filters.sort ?? "recent"}>
                  <option value="recent">Plus récentes</option>
                  <option value="title">Titre A-Z</option>
                  <option value="company">Entreprise A-Z</option>
                </select>
              </div>
              <button className="btn btn-primary" type="submit">
                Appliquer les filtres
              </button>
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
            </form>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function filterFallbackJobs(
  jobs: typeof fallbackPublishedJobs,
  filters: JobFilters
) {
  const filteredJobs = useFallbackJobs(jobs).filter((job) => {
    const text = `${job.title} ${job.company.name} ${job.summary} ${job.city} ${job.sector}`.toLowerCase();
    if (filters.query && !text.includes(filters.query.toLowerCase())) {
      return false;
    }
    if (filters.contract.length > 0 && !filters.contract.includes(job.contract)) {
      return false;
    }
    if (filters.city.length > 0 && !filters.city.includes(job.city)) {
      return false;
    }
    if (filters.sector && job.sector !== filters.sector) {
      return false;
    }
    if (filters.company && job.company.name !== filters.company) {
      return false;
    }
    if (filters.urgent && !job.is_urgent) {
      return false;
    }
    return true;
  });

  if (filters.sort === "title") {
    return filteredJobs.sort((left, right) => left.title.localeCompare(right.title, "fr"));
  }

  if (filters.sort === "company") {
    return filteredJobs.sort((left, right) => left.company.name.localeCompare(right.company.name, "fr"));
  }

  return filteredJobs;
}
