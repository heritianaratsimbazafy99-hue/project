import Link from "next/link";

import type { JobListItem } from "@/types/database";

type JobCardProps = {
  job: JobListItem;
};

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="jobCard">
      <Link className="jobCardLink" href={`/emploi/${job.slug}`}>
        <div className="jobCardHeader">
          <div>
            <p className="jobCompany">{job.company.name}</p>
            <h2>{job.title}</h2>
          </div>
          <div className="jobBadges" aria-label="Statuts de l'offre">
            {job.is_featured ? <span>À la une</span> : null}
            {job.is_urgent ? <span>Urgent</span> : null}
          </div>
        </div>

        {job.summary ? <p className="jobSummary">{job.summary}</p> : null}

        <dl className="jobMeta">
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
      </Link>
    </article>
  );
}
