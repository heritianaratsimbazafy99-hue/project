import Link from "next/link";

import { brand } from "@/config/brand";
import { JobCard } from "@/features/jobs/components/job-card";
import { buildJobFilters, getPublishedJobsOrEmpty } from "@/features/jobs/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const jobs = await getPublishedJobsOrEmpty(buildJobFilters({}));
  const featuredJobs = jobs.filter((job) => job.is_featured).slice(0, 3);
  const latestJobs = jobs.slice(0, 4);
  const companies = Array.from(
    new Map(jobs.map((job) => [job.company.slug || job.company.name, job.company])).values()
  ).slice(0, 6);

  return (
    <main className="siteShell">
      <header className="siteHeader" aria-label="Accueil JobMada">
        <Link className="brand" href="/" aria-label="JobMada accueil">
          <img src={brand.logoPath} alt="" width="56" height="56" />
          <span>{brand.name}</span>
        </Link>
      </header>

      <section className="hero" aria-labelledby="home-title">
        <h1 id="home-title">L'emploi qui vous correspond</h1>
        <p>La nouvelle marketplace emploi JobMada arrive en full-stack.</p>
        <div className="heroActions">
          <Link className="primaryAction" href="/emploi">
            Voir les offres
          </Link>
        </div>
      </section>

      <section className="homeDynamic" aria-labelledby="home-jobs-title">
        <div className="sectionHeading">
          <h2 id="home-jobs-title">Offres mises en avant</h2>
          <Link href="/emploi">Toutes les offres</Link>
        </div>

        <div className="homeJobGrid">
          {(featuredJobs.length > 0 ? featuredJobs : latestJobs).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {companies.length > 0 ? (
          <div className="companyStrip" aria-label="Entreprises qui recrutent">
            {companies.map((company) => (
              <div key={company.slug || company.name} className="companyChip">
                {company.logo_path ? (
                  <img src={company.logo_path} alt="" width="36" height="36" />
                ) : null}
                <span>{company.name}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
