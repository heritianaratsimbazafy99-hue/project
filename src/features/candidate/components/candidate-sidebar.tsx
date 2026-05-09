"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { CandidateCompletion } from "@/features/candidate/completion";

type CandidateSidebarProps = {
  email: string | null;
  displayName?: string | null;
  completion: CandidateCompletion;
};

const navItems = [
  { href: "/candidat/dashboard", label: "Dashboard" },
  { href: "/candidat/profil", label: "Mon profil" },
  { href: "/candidat/candidatures", label: "Mes candidatures" },
  { href: "/candidat/alertes", label: "Mes alertes" }
];

export function CandidateSidebar({ email, displayName, completion }: CandidateSidebarProps) {
  const pathname = usePathname();
  const initial = (displayName || email || "C").trim().charAt(0).toUpperCase();

  return (
    <aside className="candidateSidebar" aria-label="Espace candidat">
      <section className="candidateSidebarCard" aria-label="Compte candidat">
        <div className="candidateIdentity">
          <div className="candidateAvatar" aria-hidden="true">
            {initial}
          </div>
          <div>
            <p>Candidat</p>
            <strong>{displayName || "Profil JobMada"}</strong>
            <span>{email || "Email non renseigné"}</span>
          </div>
        </div>

        <nav className="candidateNav" aria-label="Navigation candidat">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} className={isActive ? "isActive" : undefined} href={item.href}>
                {item.label}
              </Link>
            );
          })}
          <Link href="/connexion">Déconnexion</Link>
        </nav>
      </section>

      <section className="completionCard" aria-labelledby="completion-title">
        <div className="completionHeader">
          <h2 id="completion-title">Profil complété</h2>
          <strong>{completion.percent}%</strong>
        </div>
        <div className="completionTrack" aria-hidden="true">
          <span style={{ width: `${completion.percent}%` }} />
        </div>
        <p>
          {completion.completedSteps} étapes sur {completion.totalSteps} complétées
        </p>
        <Link href="/candidat/profil">Compléter mon profil</Link>
      </section>
    </aside>
  );
}
