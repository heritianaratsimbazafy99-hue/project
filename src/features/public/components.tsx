import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Clock,
  FileText,
  Layers,
  MapPin,
  Search,
  Send,
  Star,
  Target,
  UserRound,
  Users,
  Zap
} from "lucide-react";
import type { CSSProperties } from "react";

import { brand } from "@/config/brand";
import type { JobListItem } from "@/types/database";

const logoPositions = [
  ["0%", "0%"],
  ["33.333%", "0%"],
  ["66.667%", "0%"],
  ["100%", "0%"],
  ["0%", "33.333%"],
  ["33.333%", "33.333%"],
  ["66.667%", "33.333%"],
  ["100%", "33.333%"],
  ["0%", "66.667%"],
  ["33.333%", "66.667%"],
  ["66.667%", "66.667%"],
  ["100%", "66.667%"],
  ["0%", "100%"],
  ["33.333%", "100%"],
  ["66.667%", "100%"],
  ["100%", "100%"]
];

function logoIndex(name: string) {
  return [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % logoPositions.length;
}

export function PublicHeader({ active = "/" }: { active?: string }) {
  const nav = [
    ["Offres d'emploi", "/emploi"],
    ["Emploi CDD", "/emploi?contract=CDD"],
    ["Freelance", "/emploi?contract=Freelance"],
    ["Offre de stage", "/emploi?contract=Stage"],
    ["Offres urgentes", "/emploi?urgent=1"]
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <BrandMark />
        <nav className="top-nav" aria-label="Navigation principale">
          {nav.map(([label, href]) => (
            <Link key={label} className={active === href ? "active" : undefined} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="account-pill" href="/recruteur/dashboard">
          <span>HR</span>
          <span>Mon compte</span>
          <ChevronDown size={16} aria-hidden="true" />
        </Link>
        <button className="hamburger" aria-label="Ouvrir le menu">
          <span />
          <span />
          <span />
        </button>
      </div>
      <nav className="mobile-drawer" aria-label="Navigation mobile">
        {nav.map(([label, href]) => (
          <Link key={label} className="side-link" href={href}>
            {label}
          </Link>
        ))}
        <Link className="btn btn-primary" href="/recruteur/dashboard">
          Mon compte
        </Link>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <BrandMark />
            <p>
              <em>Mon travail, mon avenir.</em>
            </p>
          </div>
          <div>
            <h3>Candidats</h3>
            <Link href="/emploi">Offres d'emploi</Link>
            <Link href="/inscription/candidat">Créer mon profil</Link>
            <Link href="/candidat/dashboard">Mon JobMada</Link>
          </div>
          <div>
            <h3>Recruteurs</h3>
            <Link href="/recruteur/offres/nouvelle">Publier une offre</Link>
            <Link href="/inscription/recruteur">JobMada Recruteur</Link>
            <Link href="/tarifs">Tarifs</Link>
          </div>
          <div>
            <h3>Ressources</h3>
            <Link href="/emploi">Explorer les offres</Link>
            <Link href="/connexion">Connexion</Link>
          </div>
        </div>
        <div className="footer-bottom">© 2026 JobMada — Le premier site d'emploi de Madagascar</div>
      </div>
    </footer>
  );
}

export function BrandMark() {
  return (
    <Link className="brand" href="/" aria-label="JobMada accueil">
      <img className="brand-logo" src={brand.logoPath} alt="JobMada" width="42" height="42" />
      <span className="brand-name">{brand.name}</span>
    </Link>
  );
}

export function CompanyLogo({ name, large = false }: { name: string; large?: boolean }) {
  const [x, y] = logoPositions[logoIndex(name)];
  return (
    <span
      className="logo-mark mock-logo"
      style={{
        "--logo-x": x,
        "--logo-y": y,
        width: large ? "112px" : undefined,
        height: large ? "112px" : undefined
      } as CSSProperties}
      role="img"
      aria-label={`Logo ${name}`}
    />
  );
}

export function PublicJobCard({ job }: { job: JobListItem }) {
  return (
    <Link
      className="job-card"
      href={`/emploi/${job.slug}`}
      data-job-card
      data-title={job.title}
      data-company={job.company.name}
      data-contract={job.contract}
      data-city={job.city}
      data-sector={job.sector}
    >
      <CompanyLogo name={job.company.name} />
      <div className="job-main">
        <strong>{job.title}</strong>
        <span>{job.company.name}</span>
        <div className="job-meta">
          <span>
            <MapPin size={16} aria-hidden="true" /> {job.city || "Madagascar"}
          </span>
          <span>
            <Layers size={16} aria-hidden="true" /> {job.sector || "Secteur à préciser"}
          </span>
          <span className="pill mauve">{job.contract || "Contrat"}</span>
          {job.is_featured ? <span className="pill rose">SPONSORISÉ</span> : null}
        </div>
      </div>
      <div className="job-time">{formatPublishedAt(job.published_at)}</div>
    </Link>
  );
}

export function MiniJob({ job }: { job: JobListItem }) {
  return (
    <Link className="mini-job" href={`/emploi/${job.slug}`}>
      <CompanyLogo name={job.company.name} />
      <div>
        <strong>{job.title}</strong>
        <span>{job.company.name}</span>
      </div>
      <span className="pill">{job.contract || "CDI"}</span>
    </Link>
  );
}

export function StickyJobsRail({ jobs }: { jobs: JobListItem[] }) {
  const urgentJobs = jobs.filter((job) => job.is_urgent).slice(0, 4);

  return (
    <aside className="side-stack deadline-rail" data-sticky-rail>
      <div className="side-card deadline-card" data-sticky-deadlines>
        <h3>
          <Clock size={18} aria-hidden="true" /> Derniers jours pour postuler
        </h3>
        {urgentJobs.map((job) => (
          <Link key={job.id} className="urgent-card" href={`/emploi/${job.slug}`}>
            <CompanyLogo name={job.company.name} />
            <div>
              <strong>{job.title}</strong>
              <span>{job.company.name}</span>
              <br />
              <span className="pill rose">Dernière ligne droite</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="side-card dark" data-sticky-pro>
        <h3>
          <Zap size={18} aria-hidden="true" /> JobMada Pro
        </h3>
        <p>Offres illimitées, CVthèque complète et matching IA. Trouvez votre perle rare, simplement.</p>
        <Link className="btn btn-primary" style={{ width: "100%" }} href="/tarifs">
          Découvrir →
        </Link>
      </div>
    </aside>
  );
}

export function SearchShell({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form className="search-shell page-search" action="/emploi">
      <span>
        <Search size={18} aria-hidden="true" />
      </span>
      <input name="q" defaultValue={defaultValue} placeholder="Poste, métier, entreprise..." />
      <button className="btn btn-primary" type="submit">
        Rechercher
      </button>
    </form>
  );
}

export const PublicIcons = {
  Bell,
  BriefcaseBusiness,
  Clock,
  FileText,
  Layers,
  MapPin,
  Search,
  Send,
  Star,
  Target,
  UserRound,
  Users,
  Zap
};

function formatPublishedAt(value: string | null) {
  if (!value) {
    return "recent";
  }

  const diff = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.round(diff / 86_400_000));
  if (days <= 1) {
    return "aujourd'hui";
  }
  return `il y a ${days}j`;
}
