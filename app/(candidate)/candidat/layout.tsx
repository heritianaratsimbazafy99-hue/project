import type { ReactNode } from "react";
import Link from "next/link";

import { brand } from "@/config/brand";
import { calculateCandidateCompletion } from "@/features/candidate/completion";
import { CandidateSidebar } from "@/features/candidate/components/candidate-sidebar";
import { demoCandidateAlertCount, demoCandidateProfile } from "@/features/demo/workspace";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CandidateLayoutProps = {
  children: ReactNode;
};

type CandidateProfileRow = {
  cv_path: string | null;
  desired_role: string | null;
};

export default async function CandidateLayout({ children }: CandidateLayoutProps) {
  const { user, profile, isDemo } = await requireRole(["candidate"]);
  let candidateProfile: CandidateProfileRow | null = isDemo ? demoCandidateProfile : null;
  let alertCount = isDemo ? demoCandidateAlertCount : 0;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();

    const [{ data: candidateProfileData }, { count }] = await Promise.all([
      supabase
        .from("candidate_profiles")
        .select("cv_path, desired_role")
        .eq("user_id", user.id)
        .maybeSingle<CandidateProfileRow>(),
      supabase
        .from("job_alerts")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", user.id)
    ]);

    candidateProfile = candidateProfileData;
    alertCount = count ?? 0;
  }

  const completion = calculateCandidateCompletion({
    accountCreated: true,
    hasCv: Boolean(candidateProfile?.cv_path),
    hasDesiredRole: Boolean(candidateProfile?.desired_role),
    hasAlert: Boolean(alertCount && alertCount > 0)
  });
  const readiness = [
    { label: "CV", done: Boolean(candidateProfile?.cv_path), href: "/candidat/profil" },
    { label: "Poste recherché", done: Boolean(candidateProfile?.desired_role), href: "/candidat/profil#infos" },
    { label: "Alerte emploi", done: Boolean(alertCount && alertCount > 0), href: "/candidat/alertes" }
  ];
  const accountInitial = (profile.display_name || profile.email || user.email || "C").trim().charAt(0).toUpperCase();

  return (
    <main className="siteShell candidateArea">
      <header className="candidateTopbar" aria-label="Navigation candidat">
        <Link className="candidateTopbarBrand" href="/candidat/dashboard" aria-label="JobMada candidat">
          <img src={brand.logoPath} alt="" width="44" height="44" />
          <span>{brand.name}</span>
        </Link>
        <nav className="candidateTopbarNav" aria-label="Navigation emploi">
          <Link href="/emploi">Offres d'emploi</Link>
          <Link href="/emploi?contract=CDD">Emploi CDD</Link>
          <Link href="/emploi?contract=Freelance">Freelance</Link>
          <Link href="/emploi?contract=Stage">Offre de stage</Link>
          <Link href="/emploi?urgent=true">Offres urgentes</Link>
        </nav>
        <Link className="candidateAccountButton" href="/candidat/profil">
          <span aria-hidden="true">{accountInitial}</span>
          Mon compte
        </Link>
      </header>

      <div className="dashboardShell">
        <CandidateSidebar
          email={profile.email || user.email || null}
          displayName={profile.display_name}
          completion={completion}
          readiness={readiness}
          alertCount={alertCount}
        />
        <div className="candidateContent">{children}</div>
      </div>
    </main>
  );
}
