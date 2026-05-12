"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BriefcaseBusiness, CheckCircle2, Circle, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { signOut } from "@/features/auth/actions";
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
  alertCount?: number;
};

const navItems: Array<{ href: string; label: string; Icon: LucideIcon }> = [
  { href: "/candidat/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/candidat/profil", label: "Mon profil", Icon: UserRound },
  { href: "/candidat/candidatures", label: "Mes candidatures", Icon: BriefcaseBusiness },
  { href: "/candidat/alertes", label: "Mes alertes", Icon: Bell }
];

export function CandidateSidebar({ email, displayName, completion, readiness, alertCount = 0 }: CandidateSidebarProps) {
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

        <p className="candidateWorkspaceLabel">Mon Asako</p>
        <nav className="candidateNav" aria-label="Navigation candidat">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            const count = href === "/candidat/alertes" ? alertCount : 0;

            return (
              <Link key={href} className={isActive ? "isActive" : undefined} href={href}>
                <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
                <span>{label}</span>
                {count > 0 ? <b className="candidateNavBadge">{count}</b> : null}
              </Link>
            );
          })}
          <form action={signOut} className="candidateLogoutForm">
            <button type="submit">
              <LogOut aria-hidden="true" size={18} strokeWidth={2.2} />
              <span>Déconnexion</span>
            </button>
          </form>
        </nav>
      </section>

      <section className="completionCard" aria-labelledby="completion-title">
        <div className="candidateProgressRing" style={{ background: `conic-gradient(#2f7b65 ${completion.percent * 3.6}deg, rgba(61, 57, 104, 0.12) 0deg)` }}>
          <strong>{completion.percent}%</strong>
        </div>
        <div className="completionHeader">
          <h2 id="completion-title">{completion.percent === 100 ? "Profil complet !" : "Profil à compléter"}</h2>
        </div>
        <p>
          {completion.percent === 100
            ? "Complétez votre profil pour être visible"
            : `${completion.completedSteps} étapes sur ${completion.totalSteps} complétées`}
        </p>
        {completion.percent === 100 ? null : <div className="completionTrack" aria-hidden="true">
          <span style={{ width: `${completion.percent}%` }} />
        </div>}
        {completion.percent === 100 ? null : (
          <>
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
            <Link className="candidatePrimaryLink" href={nextMissing?.href ?? "/candidat/profil"}>
              Compléter mon profil
            </Link>
          </>
        )}
      </section>
    </aside>
  );
}
