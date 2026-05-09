"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  CreditCard,
  FileSearch,
  LayoutDashboard,
  UserRound,
  UsersRound
} from "lucide-react";

type RecruiterSidebarProps = {
  companyName?: string | null;
  displayName?: string | null;
  email: string | null;
  plan?: string | null;
  jobQuota?: number | null;
  jobCount?: number | null;
};

const navItems = [
  { href: "/recruteur/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { label: "Entreprise", Icon: Building2 },
  { href: "/recruteur/offres", label: "Offres", Icon: BriefcaseBusiness },
  { label: "Candidatures", Icon: UsersRound },
  { label: "CVthèque", Icon: FileSearch },
  { label: "Abonnement", Icon: CreditCard },
  { label: "Profil", Icon: UserRound }
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
  const quotaLabel =
    typeof jobQuota === "number" ? `${jobCount ?? 0}/${jobQuota} offres utilisées` : "Quota en attente";

  return (
    <aside className="recruiterSidebar" aria-label="Espace recruteur">
      <section className="recruiterSidebarCard" aria-label="Compte recruteur">
        <div className="recruiterIdentity">
          <div className="recruiterAvatar" aria-hidden="true">
            {initial}
          </div>
          <div>
            <p>Recruteur</p>
            <strong>{companyName || displayName || "Entreprise JobMada"}</strong>
            <span>{email || "Email non renseigné"}</span>
          </div>
        </div>

        <nav className="recruiterNav" aria-label="Navigation recruteur">
          {navItems.map(({ href, label, Icon }) => {
            if (!href) {
              return (
                <span key={label} className="isDisabled" aria-disabled="true">
                  <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
                  <span>{label}</span>
                </span>
              );
            }

            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link key={href} className={isActive ? "isActive" : undefined} href={href}>
                <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </section>

      <section className="recruiterQuotaCard" aria-labelledby="recruiter-quota-title">
        <p>{plan ? `Plan ${plan}` : "Plan à configurer"}</p>
        <h2 id="recruiter-quota-title">Quota offres</h2>
        <strong>{quotaLabel}</strong>
        <Link href="/recruteur/dashboard">Gérer l'abonnement</Link>
      </section>
    </aside>
  );
}
