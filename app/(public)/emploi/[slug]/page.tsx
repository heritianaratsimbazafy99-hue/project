import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedJobBySlugOrNull } from "@/features/jobs/queries";
import {
  CompanyLogo,
  PublicFooter,
  PublicHeader,
  PublicIcons,
  PublicJobCard
} from "@/features/public/components";
import { fallbackPublishedJobs, findPublicJob } from "@/features/public/demo-data";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = (await getPublishedJobBySlugOrNull(slug)) ?? findPublicJob(slug);
  const { BriefcaseBusiness, Clock, FileText, Layers, MapPin, Send, Target, Users } = PublicIcons;

  if (!job) {
    notFound();
  }

  const similarJobs = fallbackPublishedJobs
    .filter((item) => item.sector === job.sector && item.slug !== job.slug)
    .slice(0, 4);

  return (
    <>
      <PublicHeader active="/emploi" />
      <main>
        <section className="job-detail-hero">
          <div className="container">
            <p className="breadcrumb">
              <Link href="/">Accueil</Link> / <Link href="/emploi">Emploi</Link> / {job.sector} / {job.title}
            </p>
            <div className="detail-title-row">
              <CompanyLogo name={job.company.name} large />
              <div>
                <h1>{job.title}</h1>
                <div className="job-meta">
                  <Link className="pill mauve" href={`/emploi?company=${encodeURIComponent(job.company.name)}`}>
                    {job.company.name}
                  </Link>
                  <span>
                    <MapPin size={16} aria-hidden="true" /> {job.city || "Madagascar"}
                  </span>
                  <span>
                    <Layers size={16} aria-hidden="true" /> {job.sector || "Secteur à préciser"}
                  </span>
                  <span>
                    <Clock size={16} aria-hidden="true" /> Publiée récemment
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container detail-layout">
            <div>
              <div className="job-intro">{job.summary || "Une entreprise vérifiée recrute sur JobMada."}</div>
              <section className="content-section">
                <h2>
                  <Target size={18} aria-hidden="true" /> Missions principales
                </h2>
                <ul>
                  <li>Prendre en charge les missions quotidiennes avec rigueur et autonomie.</li>
                  <li>Collaborer avec les équipes opérationnelles et assurer un reporting clair.</li>
                  <li>Suivre les indicateurs, remonter les alertes et améliorer les processus.</li>
                </ul>
              </section>
              <section className="content-section">
                <h2>
                  <Users size={18} aria-hidden="true" /> Profil recherché
                </h2>
                <ul>
                  <li>Bonne capacité d'analyse et communication professionnelle.</li>
                  <li>Expérience appréciée dans un environnement exigeant.</li>
                  <li>Autonomie, ponctualité et sens du service.</li>
                </ul>
              </section>
              <section className="apply-inline">
                <div>
                  <h3>Cette offre vous correspond ?</h3>
                  <p>
                    Connectez-vous ou créez votre profil candidat pour envoyer votre candidature à{" "}
                    <strong>{job.company.name}</strong>.
                  </p>
                </div>
                <Link className="btn btn-primary" href="/connexion">
                  <Send size={18} aria-hidden="true" /> Postuler
                </Link>
              </section>
            </div>

            <aside className="side-stack">
              <div className="side-card job-summary-card">
                <p>
                  <span>
                    <Layers size={18} aria-hidden="true" />
                  </span>
                  <strong>Métier</strong>
                  {job.title}
                </p>
                <p>
                  <span>
                    <FileText size={18} aria-hidden="true" />
                  </span>
                  <strong>Contrat</strong>
                  {job.contract || "À préciser"}
                </p>
                <p>
                  <span>
                    <Clock size={18} aria-hidden="true" />
                  </span>
                  <strong>Prise de poste</strong>
                  Dès que possible
                </p>
                <Link className="btn btn-primary" style={{ width: "100%" }} href="/connexion">
                  <Send size={18} aria-hidden="true" /> Postuler maintenant
                </Link>
                <small>Candidature gratuite et rapide via JobMada</small>
              </div>
              <div className="side-card">
                <h3>L'entreprise</h3>
                <div className="company-card-head">
                  <CompanyLogo name={job.company.name} />
                  <div>
                    <strong>{job.company.name}</strong>
                    <br />
                    <span>Entreprise vérifiée</span>
                  </div>
                </div>
                <p style={{ marginTop: 14 }}>
                  Consultez les opportunités publiées par cette entreprise et postulez directement sur JobMada.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="section alt">
          <div className="container">
            <h2 className="section-title">
              <span className="icon-tile">
                <BriefcaseBusiness size={18} aria-hidden="true" />
              </span>
              Offres <strong>similaires</strong>
            </h2>
            <div className="similar-grid">
              {similarJobs.map((item) => (
                <PublicJobCard key={item.id} job={item} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
