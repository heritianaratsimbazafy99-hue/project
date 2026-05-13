import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, BriefcaseBusiness, Gift, HeartHandshake, Images, MapPin, Sparkles, Users } from "lucide-react";

import {
  getCompanyCareerSiteBySlugOrNull,
  getPublishedCompanyJobsOrEmpty
} from "@/features/companies/career-queries";
import { CompanyLogo, PublicFooter, PublicHeader, PublicJobCard } from "@/features/public/components";
import { resolveCompanyCoverPath } from "@/features/public/company-logo";

export const dynamic = "force-dynamic";

type CompanyCareerPageProps = {
  params: Promise<{ slug: string }>;
};

function defaultHeadline(companyName: string) {
  return `Construisez la suite de votre parcours chez ${companyName}`;
}

export default async function CompanyCareerPage({ params }: CompanyCareerPageProps) {
  const { slug } = await params;
  const company = await getCompanyCareerSiteBySlugOrNull(slug);

  if (!company) {
    notFound();
  }

  const jobs = await getPublishedCompanyJobsOrEmpty(company.id);
  const coverUrl = resolveCompanyCoverPath(company.cover_path);
  const gallery = company.career_gallery_paths.map(resolveCompanyCoverPath).filter((path): path is string => Boolean(path));
  const headline = company.career_headline || defaultHeadline(company.name);
  const intro = company.career_intro || company.description || "Cette entreprise vérifiée recrute sur JobMada.";
  const connectTitle = company.career_connect_title || "Connectez-vous à cette entreprise";
  const connectDescription =
    company.career_connect_description ||
    "Envoyez votre CV pour rejoindre son vivier et être contacté lors des prochaines opportunités.";
  const isPreview = company.status !== "verified";

  return (
    <>
      <PublicHeader active="/emploi" />
      <main className="company-career-page">
        <section
          className="company-career-hero"
          style={coverUrl ? { backgroundImage: `linear-gradient(90deg, rgba(4,22,54,0.86), rgba(4,22,54,0.36)), url("${coverUrl}")` } : undefined}
        >
          <div className="container company-career-hero-inner">
            <div className="company-career-identity">
              <CompanyLogo name={company.name} logoPath={company.logo_path} large />
              <div>
                <span className="eyebrow">
                  <BadgeCheck size={16} aria-hidden="true" />
                  {isPreview ? "Prévisualisation recruteur" : "Entreprise vérifiée"}
                </span>
                <h1>{company.name}</h1>
                <p>{headline}</p>
                <div className="company-career-meta">
                  {company.city ? (
                    <span>
                      <MapPin size={16} aria-hidden="true" />
                      {company.city}
                    </span>
                  ) : null}
                  {company.sector ? (
                    <span>
                      <BriefcaseBusiness size={16} aria-hidden="true" />
                      {company.sector}
                    </span>
                  ) : null}
                  {company.size_label ? (
                    <span>
                      <Users size={16} aria-hidden="true" />
                      {company.size_label}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="company-career-actions">
              <a className="btn btn-primary" href="#company-jobs">
                Voir les offres
              </a>
              {company.career_connect_enabled ? (
                <Link className="btn btn-outline light" href={`/entreprises/${company.slug}/connect`}>
                  Nous rejoindre
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container company-career-layout">
            <div className="company-career-main">
              <section className="company-career-panel">
                <div className="section-head">
                  <h2 className="section-title">
                    <span className="icon-tile">
                      <HeartHandshake size={18} aria-hidden="true" />
                    </span>
                    Travailler chez <strong>{company.name}</strong>
                  </h2>
                </div>
                <p>{intro}</p>
                {company.career_values.length > 0 ? (
                  <div className="career-chip-grid" aria-label="Valeurs">
                    {company.career_values.map((value) => (
                      <span key={value}>{value}</span>
                    ))}
                  </div>
                ) : null}
              </section>

              {company.career_benefits.length > 0 ? (
                <section className="company-career-panel">
                  <div className="section-head">
                    <h2 className="section-title">
                      <span className="icon-tile">
                        <Gift size={18} aria-hidden="true" />
                      </span>
                      Avantages
                    </h2>
                  </div>
                  <div className="career-benefit-grid">
                    {company.career_benefits.map((benefit) => (
                      <article key={benefit}>
                        <Sparkles size={18} aria-hidden="true" />
                        <strong>{benefit}</strong>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {gallery.length > 0 ? (
                <section className="company-career-panel">
                  <div className="section-head">
                    <h2 className="section-title">
                      <span className="icon-tile">
                        <Images size={18} aria-hidden="true" />
                      </span>
                      En images
                    </h2>
                  </div>
                  <div className="career-gallery">
                    {gallery.map((imageUrl) => (
                      <img key={imageUrl} src={imageUrl} alt="" />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="company-career-panel" id="company-jobs">
                <div className="section-head">
                  <h2 className="section-title">
                    <span className="icon-tile">
                      <BriefcaseBusiness size={18} aria-hidden="true" />
                    </span>
                    Offres publiées
                  </h2>
                  <span>{jobs.length} {jobs.length > 1 ? "offres" : "offre"}</span>
                </div>
                {jobs.length > 0 ? (
                  <div className="job-list">
                    {jobs.map((job) => (
                      <PublicJobCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>Aucune offre publiée pour le moment</h3>
                    <p>Revenez bientôt ou envoyez votre CV via Connect si l'entreprise accepte les profils spontanés.</p>
                  </div>
                )}
              </section>
            </div>

            <aside className="side-stack company-career-side">
              <div className="side-card">
                <h3>{connectTitle}</h3>
                <p>{connectDescription}</p>
                {company.career_connect_enabled ? (
                  <Link className="btn btn-primary" href={`/entreprises/${company.slug}/connect`}>
                    Envoyer mon CV
                  </Link>
                ) : (
                  <Link className="btn btn-outline" href="#company-jobs">
                    Voir les offres
                  </Link>
                )}
              </div>
              {company.website ? (
                <div className="side-card">
                  <h3>Site web</h3>
                  <a className="company-website-link" href={company.website} rel="noreferrer" target="_blank">
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              ) : null}
            </aside>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
