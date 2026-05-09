import type { ReactNode } from "react";
import Link from "next/link";

import { brand } from "@/config/brand";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

type AdminLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { label: "Vue d'ensemble", href: "/admin" },
  { label: "Offres", href: "/admin/offres" },
  { label: "Entreprises", href: "/admin/entreprises" }
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { profile, user } = await requireRole(["admin"]);

  return (
    <main className="siteShell adminArea">
      <header className="siteHeader publicHeader" aria-label="Navigation admin">
        <Link className="brand" href="/admin" aria-label="JobMada admin">
          <img src={brand.logoPath} alt="" width="56" height="56" />
          <span>{brand.name}</span>
        </Link>
        <Link className="headerLink" href="/emploi">
          Voir le site public
        </Link>
      </header>

      <div className="adminShell">
        <aside className="adminSidebar" aria-label="Menu admin">
          <div className="adminIdentity">
            <span>Admin JobMada</span>
            <strong>{profile.display_name || profile.email || user.email || "Modération"}</strong>
          </div>
          <nav className="adminNav">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <span aria-disabled="true">Utilisateurs</span>
          </nav>
        </aside>
        <div className="adminContent">{children}</div>
      </div>
    </main>
  );
}
