import type { ReactNode } from "react";
import Link from "next/link";

import { brand } from "@/config/brand";
import { calculateCandidateCompletion } from "@/features/candidate/completion";
import { CandidateSidebar } from "@/features/candidate/components/candidate-sidebar";
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
  const { user, profile } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();

  const [{ data: candidateProfile }, { count: alertCount }] = await Promise.all([
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

  const completion = calculateCandidateCompletion({
    accountCreated: true,
    hasCv: Boolean(candidateProfile?.cv_path),
    hasDesiredRole: Boolean(candidateProfile?.desired_role),
    hasAlert: Boolean(alertCount && alertCount > 0)
  });

  return (
    <main className="siteShell candidateArea">
      <header className="siteHeader publicHeader" aria-label="Navigation candidat">
        <Link className="brand" href="/candidat/dashboard" aria-label="JobMada candidat">
          <img src={brand.logoPath} alt="" width="56" height="56" />
          <span>{brand.name}</span>
        </Link>
        <Link className="headerLink" href="/emploi">
          Voir les offres
        </Link>
      </header>

      <div className="dashboardShell">
        <CandidateSidebar
          email={profile.email || user.email || null}
          displayName={profile.display_name}
          completion={completion}
        />
        <div className="candidateContent">{children}</div>
      </div>
    </main>
  );
}
