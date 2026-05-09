import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { applyToJob } from "@/features/applications/actions";
import {
  getCandidateApplyState,
  type CandidateApplyState
} from "@/features/applications/apply-state";
import { getPublishedJobBySlugOrNull } from "@/features/jobs/queries";
import {
  CompanyLogo,
  PublicFooter,
  PublicHeader,
  PublicIcons,
  PublicJobCard
} from "@/features/public/components";
import { fallbackPublishedJobs, findPublicJob } from "@/features/public/demo-data";
import { DEMO_SESSION_COOKIE, parseDemoSession } from "@/lib/auth/demo-session";
import type { UserRole } from "@/types/database";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ApplyState = CandidateApplyState | { state: "demo_candidate" };

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveApplyState(jobId: string): Promise<ApplyState> {
  const cookieStore = await cookies();
  const demoAccount = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (demoAccount?.role === "candidate") {
    return { state: "demo_candidate" };
  }

  if (demoAccount?.role) {
    return { state: "wrong_role", role: demoAccount.role };
  }

  return getCandidateApplyState(jobId);
}

async function applyFromJobDetail(jobId: string, slug: string, cvPath: string) {
  "use server";

  const result = await applyToJob(jobId, cvPath);
  const param = result.ok ? "applied" : "applyError";

  redirect(`/emploi/${slug}?${param}=${encodeURIComponent(result.message)}`);
}

function ApplyCallToAction({
  applyState,
  jobId,
  slug,
  full = false
}: {
  applyState: ApplyState;
  jobId: string;
  slug: string;
  full?: boolean;
}) {
  const { Send } = PublicIcons;
  const style = full ? { width: "100%" } : undefined;

  if (applyState.state === "ready") {
    return (
      <form className="apply-form" action={applyFromJobDetail.bind(null, jobId, slug, applyState.cvPath)}>
        <button className="btn btn-primary" style={style} type="submit">
          <Send size={18} aria-hidden="true" /> Postuler
        </button>
      </form>
    );
  }

  if (applyState.state === "missing_cv") {
    return (
      <Link className="btn btn-primary" style={style} href="/candidat/profil">
        <Send size={18} aria-hidden="true" /> Ajouter mon CV
      </Link>
    );
  }

  if (applyState.state === "already_applied") {
    return (
      <Link className="btn btn-primary" style={style} href="/candidat/candidatures">
        <Send size={18} aria-hidden="true" /> Voir ma candidature
      </Link>
    );
  }

  if (applyState.state === "demo_candidate") {
    return (
      <Link className="btn btn-primary" style={style} href="/candidat/candidatures">
        <Send size={18} aria-hidden="true" /> Voir le suivi démo
      </Link>
    );
  }

  const href = applyState.state === "wrong_role" ? "/connexion" : "/connexion";
  const label = applyState.state === "wrong_role" ? "Changer de compte" : "Postuler";

  return (
    <Link className="btn btn-primary" style={style} href={href}>
      <Send size={18} aria-hidden="true" /> {label}
    </Link>
  );
}

function roleLabel(role: UserRole | null) {
  if (role === "recruiter") {
    return "un compte candidat est nécessaire pour postuler.";
  }

  if (role === "admin") {
    return "un compte candidat est nécessaire pour envoyer une candidature.";
  }

  return "connectez-vous avec un compte candidat.";
}

export default async function JobDetailPage({ params, searchParams }: JobDetailPageProps) {
  const { slug } = await params;
  const job = (await getPublishedJobBySlugOrNull(slug)) ?? findPublicJob(slug);
  const { BriefcaseBusiness, Clock, FileText, Layers, MapPin, Target, Users } = PublicIcons;

  if (!job) {
    notFound();
  }

  const similarJobs = fallbackPublishedJobs
    .filter((item) => item.sector === job.sector && item.slug !== job.slug)
    .slice(0, 4);
  const applyState = await resolveApplyState(job.id);
  const query = await searchParams;
  const appliedMessage = firstQueryValue(query.applied);
  const applyErrorMessage = firstQueryValue(query.applyError);

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
                  {appliedMessage ? <p className="apply-feedback success">{appliedMessage}</p> : null}
                  {applyErrorMessage ? <p className="apply-feedback error">{applyErrorMessage}</p> : null}
                  <p>
                    {applyState.state === "ready"
                      ? `Votre CV sera transmis à ${job.company.name}.`
                      : applyState.state === "wrong_role"
                        ? roleLabel(applyState.role)
                        : `Connectez-vous ou créez votre profil candidat pour envoyer votre candidature à ${job.company.name}.`}
                  </p>
                </div>
                <ApplyCallToAction applyState={applyState} jobId={job.id} slug={job.slug} />
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
                <ApplyCallToAction applyState={applyState} jobId={job.id} slug={job.slug} full />
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
