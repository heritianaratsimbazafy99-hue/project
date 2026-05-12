"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BriefcaseBusiness, CheckCircle2, Circle, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CandidateCompletion } from "@/features/candidate/completion";

type CandidateReadinessItem = {
  done: boolean;
  href: string;
  label: string;
};

type CandidateSidebarProps = {
  email: string | null;
  displayName?: string | null;
  completion: CandidateCompletion;
  readiness: CandidateReadinessItem[];
};

const navItems: Array<{ href: string; label: string; Icon: LucideIcon }> = [
  { href: "/candidat/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/candidat/profil", label: "Mon profil", Icon: UserRound },
  { href: "/candidat/candidatures", label: "Mes candidatures", Icon: BriefcaseBusiness },
  { href: "/candidat/alertes", label: "Mes alertes", Icon: Bell }
];

export function CandidateSidebar({ email, displayName, completion, readiness }: CandidateSidebarProps) {
  const pathname = usePathname();
  const initial = (displayName || email || "C").trim().charAt(0).toUpperCase();
  const nextMissing = readiness.find((item) => !item.done);

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
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href;

            return (
              <Link key={href} className={isActive ? "isActive" : undefined} href={href}>
                <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
                <span>{label}</span>
              </Link>
            );
          })}
          <Link href="/connexion">
            <LogOut aria-hidden="true" size={18} strokeWidth={2.2} />
            <span>Déconnexion</span>
          </Link>
        </nav>
      </section>

      <section className="completionCard" aria-labelledby="completion-title">
        <div className="completionHeader">
          <h2 id="completion-title">{completion.percent === 100 ? "Profil prêt" : "Complétez votre profil"}</h2>
          <strong>{completion.percent}%</strong>
        </div>
        <div className="completionTrack" aria-hidden="true">
          <span style={{ width: `${completion.percent}%` }} />
        </div>
        <p>
          {completion.completedSteps} étapes sur {completion.totalSteps} complétées
        </p>
        <div className="candidateReadinessList" aria-label="État du profil candidat">
          {readiness.map((item) => (
            <Link key={item.label} href={item.href} className={item.done ? "isDone" : undefined}>
              {item.done ? (
                <CheckCircle2 aria-hidden="true" size={16} />
              ) : (
                <Circle aria-hidden="true" size={16} />
              )}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <Link className="candidatePrimaryLink" href={completion.percent === 100 ? "/emploi" : nextMissing?.href ?? "/candidat/profil"}>
          {completion.percent === 100 ? "Voir les offres" : "Compléter mon profil"}
        </Link>
      </section>
    </aside>
  );
}
