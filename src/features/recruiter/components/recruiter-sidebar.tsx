"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  CreditCard,
  ExternalLink,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Plus,
  Star,
  UserRound,
  UsersRound
} from "lucide-react";

import { signOut } from "@/features/auth/actions";
import { calculateJobQuotaUsage } from "@/features/recruiter/quota";

type RecruiterSidebarProps = {
  companyName?: string | null;
  displayName?: string | null;
  email: string | null;
  plan?: string | null;
  jobQuota?: number | null;
  jobCount?: number | null;
};

const navItems = [
  {
    title: "RECRUTEMENT",
    links: [
      { href: "/recruteur/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { href: "/recruteur/offres", label: "Mes offres", Icon: BriefcaseBusiness },
      { href: "/recruteur/candidatures", label: "Candidatures", Icon: UsersRound }
    ]
  },
  {
    title: "SOURCING",
    links: [
      { href: "/recruteur/cvtheque", label: "CVthèque", Icon: FileSearch },
      { href: "/recruteur/selection", label: "Ma sélection", Icon: Star }
    ]
  },
  {
    title: "ENTREPRISE",
    links: [
      { href: "/recruteur/entreprise", label: "Mon entreprise", Icon: Building2 },
      { href: "/recruteur/abonnement", label: "Mon abonnement", Icon: CreditCard }
    ]
  },
  {
    title: "MON COMPTE",
    links: [
      { href: "/recruteur/profil", label: "Mon profil", Icon: UserRound }
    ]
  }
];

export function RecruiterSidebar({
  companyName,
  displayName,
  email,
  plan,
  jobQuota,
  jobCount
}: RecruiterSidebarProps) {
  const pathname = usePathname();
  const initial = (companyName || displayName || email || "R").trim().charAt(0).toUpperCase();
  const quotaUsage = calculateJobQuotaUsage({ quota: jobQuota, used: jobCount });

  return (
    <aside className="recruiter-sidebar" aria-label="Espace recruteur">
      <div className="recruiter-account">
        <div className="avatar" aria-hidden="true">
          <span>
            {initial}
          </span>
        </div>
        <div>
          <strong>{companyName || displayName || "Entreprise JobMada"}</strong>
          <span>{email || "Email non renseigné"}</span>
        </div>
        <Link className="btn btn-soft" href="/emploi" aria-label="Voir le site public">
          <ExternalLink aria-hidden="true" size={16} />
        </Link>
      </div>

      <div className="side-groups">
        {navItems.map((group) => (
          <div className="side-group" key={group.title}>
            <p className="side-group-title">{group.title}</p>
            {group.links.map(({ href, label, Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link key={href} className={`side-link${isActive ? " active" : ""}`} href={href}>
                  <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
                  <span>{label}</span>
                </Link>
              );
            })}
            {group.title === "MON COMPTE" ? (
              <form action={signOut} className="side-link-form">
                <button className="side-link" type="submit">
                  <LogOut aria-hidden="true" size={18} strokeWidth={2.2} />
                  <span>Déconnexion</span>
                </button>
              </form>
            ) : null}
          </div>
        ))}
      </div>

      <div className="side-cta">
        <Link className="btn btn-primary" href="/recruteur/offres/nouvelle">
          <Plus aria-hidden="true" size={18} />
          Publier une offre
        </Link>
      </div>

      <section className="plan-mini" aria-labelledby="recruiter-quota-title">
        <strong>
          Plan {plan ?? "Gratuit"} <span className="pill">{plan === "Gratuit" || !plan ? "0 Ar" : "Actif"}</span>
        </strong>
        <div className="quota-bar" aria-hidden="true">
          <span style={{ width: `${quotaUsage.percent}%` }} />
        </div>
        <p>{quotaUsage.label}</p>
        <Link className="btn btn-outline" href="/recruteur/abonnement" id="recruiter-quota-title">
          Changer de plan
        </Link>
      </section>
    </aside>
  );
}
