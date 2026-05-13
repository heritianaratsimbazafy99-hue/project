import Link from "next/link";
import { cookies } from "next/headers";
import {
  Bell,
  Building2,
  BriefcaseBusiness,
  ChevronDown,
  Clock,
  FileText,
  Layers,
  LogIn,
  MapPin,
  Search,
  Send,
  Star,
  Target,
  UserRound,
  UserPlus,
  Users,
  Zap
} from "lucide-react";
import type { CSSProperties } from "react";

import { brand } from "@/config/brand";
import { PUBLIC_CONTRACT_NAV_LINKS } from "@/features/jobs/contracts";
import { resolveCompanyLogoPath } from "@/features/public/company-logo";
import { DEMO_SESSION_COOKIE, dashboardPathForRole, parseDemoSession } from "@/lib/auth/demo-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MobileMenuToggle } from "@/features/public/mobile-menu-toggle";
import type { UserRole } from "@/types/database";
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

function accountTargetForRole(role: UserRole | null) {
  if (role) {
    return {
      href: dashboardPathForRole(role),
      initials: role === "recruiter" ? "HR" : role === "admin" ? "AD" : "C",
      label: "Mon compte"
    };
  }

  return {
    href: "/connexion",
    initials: "IN",
    label: "Connexion"
  };
}

async function getPublicAccountTarget() {
  const cookieStore = await cookies();
  const demoAccount = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (demoAccount) {
    return accountTargetForRole(demoAccount.role);
  }

  const hasSupabaseSession = cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));

  if (!hasSupabaseSession) {
    return accountTargetForRole(null);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return accountTargetForRole(null);
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: UserRole }>();

  return accountTargetForRole(profile?.role ?? null);
}

export async function PublicHeader({ active = "/", variant = "default" }: { active?: string; variant?: "default" | "auth" }) {
  const nav = [
    { label: "Offres d'emploi", href: "/emploi" },
    { label: "Cooptation", href: "/cooptation" },
    ...PUBLIC_CONTRACT_NAV_LINKS,
    { label: "Offres urgentes", href: "/emploi?urgent=1" }
  ];

  if (variant === "auth") {
    return (
      <header className="site-header auth-site-header">
        <div className="container header-inner auth-header-inner">
          <BrandMark />
          <nav className="top-nav auth-top-nav" aria-label="Navigation principale">
            {nav.map(({ label, href }) => (
              <Link key={label} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="auth-header-actions">
            <Link className="auth-login-link" href="/connexion" aria-current="page">
              <LogIn size={18} aria-hidden="true" />
              Connexion
            </Link>
            <Link className="auth-profile-pill" href="/inscription/candidat">
              <UserPlus size={18} aria-hidden="true" />
              Créer mon profil
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const accountTarget = await getPublicAccountTarget();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <BrandMark />
        <nav className="top-nav" aria-label="Navigation principale">
          {nav.map(({ label, href }) => (
            <Link key={label} className={active === href ? "active" : undefined} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="account-pill" href={accountTarget.href}>
          <span>{accountTarget.initials}</span>
          <span>{accountTarget.label}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </Link>
        <MobileMenuToggle />
      </div>
      <nav id="public-mobile-drawer" className="mobile-drawer" aria-label="Navigation mobile" hidden>
        {nav.map(({ label, href }) => (
          <Link key={label} className="side-link" href={href}>
            {label}
          </Link>
        ))}
        <Link className="btn btn-primary" href={accountTarget.href}>
          {accountTarget.label}
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
            <Link href="/cooptation">Cooptation</Link>
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

export function CompanyLogo({ name, logoPath = null, large = false }: { name: string; logoPath?: string | null; large?: boolean }) {
  const [x, y] = logoPositions[logoIndex(name)];
  const resolvedLogoPath = resolveCompanyLogoPath(logoPath);

  if (resolvedLogoPath) {
    return (
      <span
        className="logo-mark real-logo"
        style={{
          width: large ? "112px" : undefined,
          height: large ? "112px" : undefined
        }}
        role="img"
        aria-label={`Logo ${name}`}
      >
        <img src={resolvedLogoPath} alt="" width={large ? 112 : 54} height={large ? 112 : 54} />
      </span>
    );
  }

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

export function MascotGuide({
  title,
  copy,
  ctaHref,
  ctaLabel,
  className = ""
}: {
  title: string;
  copy: string;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
}) {
  return (
    <aside className={`mascot-guide ${className}`.trim()} aria-label="Guide JobMada">
      <div className="mascot-guide-copy">
        <span className="mascot-guide-kicker">Guide JobMada</span>
        <strong>{title}</strong>
        <p>{copy}</p>
        {ctaHref && ctaLabel ? (
          <Link className="btn btn-navy" href={ctaHref}>
            {ctaLabel}
          </Link>
        ) : null}
      </div>
      <img src="/assets/mascot/jobmada-mascot-wave-cutout.png" alt="" loading="lazy" width="1086" height="1448" />
    </aside>
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
      <CompanyLogo name={job.company.name} logoPath={job.company.logo_path} />
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
      <CompanyLogo name={job.company.name} logoPath={job.company.logo_path} />
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
            <CompanyLogo name={job.company.name} logoPath={job.company.logo_path} />
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
  Building2,
  BriefcaseBusiness,
  Clock,
  FileText,
  Layers,
  LogIn,
  MapPin,
  Search,
  Send,
  Star,
  Target,
  UserRound,
  UserPlus,
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
