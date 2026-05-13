import Link from "next/link";

import { contractSearchHref, HOME_JOB_CONTRACT_TABS } from "@/features/jobs/contracts";
import { buildJobFilters, getPublishedJobsPageOrEmpty } from "@/features/jobs/queries";
import {
  BrandMark,
  CompanyLogo,
  MascotGuide,
  MiniJob,
  PublicFooter,
  PublicHeader,
  PublicIcons,
  PublicJobCard,
  StickyJobsRail
} from "@/features/public/components";
import { getPublicCompanies, publicSectors, useFallbackJobs } from "@/features/public/demo-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const livePage = await getPublishedJobsPageOrEmpty({ ...buildJobFilters({}), pageSize: 12 });
  const liveJobs = livePage.jobs;
  const jobs = useFallbackJobs(liveJobs);
  const usingFallbackJobs = liveJobs.length === 0 && jobs.length > 0;
  const activeJobCount = usingFallbackJobs ? jobs.length : livePage.total;
  const featuredJobs = jobs.filter((job) => job.is_featured).slice(0, 3);
  const latestJobs = jobs.slice(0, 6);
  const companies = getPublicCompanies(liveJobs);
  const { Bell, BriefcaseBusiness, FileText, Layers, Search, Send, Star, UserRound, Users, Zap } = PublicIcons;

  return (
    <>
      <PublicHeader active="/" />
      <main>
        <section className="hero-band">
          <div className="container hero-grid">
            <div className="hero-card">
              <span className="eyebrow">Emploi à Madagascar</span>
              <h1 className="hero-title">
                L'emploi qui vous <span className="underline">correspond</span>
              </h1>
              <p className="hero-copy">Le jobboard moderne qui comprend Madagascar.</p>
              <form className="search-shell" action="/emploi">
                <span>
                  <Search size={18} aria-hidden="true" />
                </span>
                <input name="q" placeholder="Poste, métier, entreprise..." />
                <button className="btn btn-primary" type="submit">
                  Rechercher
                </button>
              </form>
              <div className="trends">
                Tendances : <Link href="/emploi?q=comptable">Comptable</Link> ·{" "}
                <Link href="/emploi?q=commercial">Commercial</Link> ·{" "}
                <Link href="/emploi?q=téléprospecteur">Téléprospecteur</Link>
              </div>
              <MascotGuide
                className="hero-mascot-guide"
                title="Votre copilote emploi"
                copy="Repérez les offres utiles, gardez votre CV prêt et laissez JobMada vous guider sans bruit."
                ctaHref="/inscription/candidat"
                ctaLabel="Créer mon profil"
              />
            </div>

            <aside className="hero-side">
              <div className="stat-grid">
                <div className="stat-card">
                  <BriefcaseBusiness size={18} aria-hidden="true" />
                  <strong>{activeJobCount}</strong>
                  <span>{activeJobCount === 1 ? "offre active vérifiée" : "offres actives vérifiées"}</span>
                </div>
                <div className="stat-card rose">
                  <Users size={18} aria-hidden="true" />
                  <strong>Recruteurs</strong>
                  <span>entreprises validées par JobMada</span>
                </div>
              </div>
              <div className="featured-card">
                <h2>
                  <Star size={18} aria-hidden="true" /> Offres à la une
                </h2>
                {(featuredJobs.length > 0 ? featuredJobs : latestJobs.slice(0, 3)).map((job) => (
                  <MiniJob key={job.id} job={job} />
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2 className="section-title" style={{ justifyContent: "center" }}>
              <span className="icon-tile">
                <BriefcaseBusiness size={18} aria-hidden="true" />
              </span>
              Entreprises qui <strong>recrutent</strong>
            </h2>
            <div className="companies-row" style={{ marginTop: 28 }}>
              {companies.map((company) => (
                <Link
                  key={company.slug || company.name}
                  className="company-logo-card"
                  href={`/emploi?company=${encodeURIComponent(company.name)}`}
                  aria-label={company.name}
                >
                  <CompanyLogo name={company.name} logoPath={company.logo_path} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section alt" style={{ padding: "28px 0" }}>
          <div className="container">
            <div className="pro-banner">
              <p>
                <span className="pill">SPONSORISÉ</span> Recrutez plus vite avec <em>JobMada Pro</em> — CVthèque,
                boost vedette, matching IA
              </p>
              <Link className="btn btn-primary" href="/tarifs">
                Découvrir →
              </Link>
            </div>
          </div>
        </section>

        <section className="section how-it-works" aria-labelledby="how-it-works-title">
          <div className="container">
            <h2 id="how-it-works-title" className="section-title" style={{ justifyContent: "center" }}>
              <span className="icon-tile">
                <Zap size={18} aria-hidden="true" />
              </span>
              Comment <strong>ça marche ?</strong>
            </h2>
            <div className="timeline" style={{ marginTop: 34 }}>
              <div className="how-step">
                <span className="step-number">01</span>
                <span className="icon-tile how-icon">
                  <FileText size={22} aria-hidden="true" />
                </span>
                <h3>Uploadez votre CV</h3>
                <p>Inscription gratuite, CV prêt dans votre profil et candidature plus rapide.</p>
              </div>
              <div className="how-step">
                <span className="step-number">02</span>
                <span className="icon-tile how-icon mauve">
                  <Send size={22} aria-hidden="true" />
                </span>
                <h3>On matche, vous postulez</h3>
                <p>JobMada met en avant les offres qui correspondent. Postulez en quelques clics.</p>
              </div>
              <div className="how-step">
                <span className="step-number">03</span>
                <span className="icon-tile how-icon cyan">
                  <Bell size={22} aria-hidden="true" />
                </span>
                <h3>Suivez vos candidatures</h3>
                <p>Gardez un suivi clair de chaque candidature depuis votre espace candidat.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container jobs-layout">
            <div>
              <div className="section-head">
                <h2 className="section-title">
                  <span className="icon-tile">
                    <BriefcaseBusiness size={18} aria-hidden="true" />
                  </span>
                  Les dernières <strong>offres d'emploi</strong> à Madagascar
                </h2>
              </div>
              <div className="tabs">
                {HOME_JOB_CONTRACT_TABS.map((tab) => {
                  const isAllTab = tab === "Toutes";

                  return (
                    <Link key={tab} className={`tab-btn ${isAllTab ? "active" : ""}`} href={isAllTab ? "/emploi" : contractSearchHref(tab)}>
                      {tab}
                    </Link>
                  );
                })}
              </div>
              <div className="job-list" id="homeJobs">
                {latestJobs.map((job) => (
                  <PublicJobCard key={job.id} job={job} />
                ))}
              </div>
              <p style={{ textAlign: "center", marginTop: 28 }}>
                <Link href="/emploi">Voir toutes les offres →</Link>
              </p>
            </div>
            <StickyJobsRail jobs={jobs} />
          </div>
        </section>

        <section className="section alt">
          <div className="container">
            <h2 className="section-title" style={{ justifyContent: "center" }}>
              <span className="icon-tile">
                <Layers size={18} aria-hidden="true" />
              </span>
              On a classé <strong>tous nos jobs !</strong>
            </h2>
            <div className="category-grid" style={{ marginTop: 28 }}>
              {publicSectors.map((name) => (
                <Link key={name} className="category-card" href={`/emploi?sector=${encodeURIComponent(name)}`}>
                  <span className="icon-tile">
                    <Layers size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{name}</strong>
                    <span>Explorer</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2 className="section-title" style={{ justifyContent: "center" }}>
              <span className="icon-tile" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
                <UserRound size={18} aria-hidden="true" />
              </span>
              Préparez-vous à <strong>décrocher votre job !</strong>
            </h2>
            <div className="prepare-grid" style={{ marginTop: 28 }}>
              <div className="prepare-card">
                <strong>CVthèque</strong>
                <p>
                  Profils candidats,
                  <br />
                  accessibles selon votre plan.
                </p>
              </div>
              <div className="prepare-card">
                <h3>Soyez visible auprès des recruteurs</h3>
                <p>
                  <Link className="btn btn-navy" href="/inscription/candidat">
                    Déposer mon CV
                  </Link>
                </p>
              </div>
              <div className="prepare-card">
                <strong>{activeJobCount}</strong>
                <p>
                  offres vérifiées,
                  <br />
                  on vous envoie celles qui collent ?
                </p>
              </div>
              <div className="prepare-card">
                <h3>Soyez alerté rapidement</h3>
                <p>
                  <Link className="btn btn-navy" href="/emploi">
                    Créer mon alerte
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container cta-grid">
            <div className="cta-panel">
              <span className="eyebrow">Candidats</span>
              <h2>Votre prochain emploi commence ici</h2>
              <p>Créez votre profil gratuitement, uploadez votre CV et postulez aux offres qui vous correspondent.</p>
              <Link className="btn btn-primary" href="/inscription/candidat">
                Créer mon profil gratuitement →
              </Link>
            </div>
            <div className="cta-panel dark">
              <span className="pill">Recruteurs</span>
              <h2>
                Trouvez votre perle rare avec <span style={{ color: "var(--rose)" }}>JobMada</span>
              </h2>
              <p>Publiez vos offres et accédez à la CVthèque qualifiée selon votre plan.</p>
              <Link className="btn btn-primary" href="/recruteur/offres/nouvelle">
                Publier une offre →
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container about-grid">
            <div className="logo-orbit">
              <BrandMark />
              <span className="badge one">
                CVs
                <br />
                <small>qualifiés selon plan</small>
              </span>
              <span className="badge two">
                {activeJobCount}
                <br />
                <small>offres vérifiées</small>
              </span>
            </div>
            <div>
              <h2 className="section-title">
                <span className="icon-tile">
                  <Zap size={18} aria-hidden="true" />
                </span>
                L'emploi à Madagascar, <strong>simplement</strong>
              </h2>
              <p>
                JobMada connecte candidats et recruteurs dans tous les secteurs, avec une expérience pensée pour
                Madagascar: offres fraîches, candidature rapide et suivi clair.
              </p>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
