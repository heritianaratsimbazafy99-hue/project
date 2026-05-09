import type { ReactNode } from "react";
import Link from "next/link";

import { brand } from "@/config/brand";
import { RecruiterSidebar } from "@/features/recruiter/components/recruiter-sidebar";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RecruiterLayoutProps = {
  children: ReactNode;
};

type CompanyRow = {
  id: string;
  name: string;
};

type SubscriptionRow = {
  plan: string | null;
  job_quota: number | null;
};

export default async function RecruiterLayout({ children }: RecruiterLayoutProps) {
  const { user, profile } = await requireRole(["recruiter"]);
  const supabase = await createSupabaseServerClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<CompanyRow>();

  const [{ data: subscription }, { count: jobCount }] = company
    ? await Promise.all([
        supabase
          .from("subscriptions")
          .select("plan, job_quota")
          .eq("company_id", company.id)
          .maybeSingle<SubscriptionRow>(),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("company_id", company.id)
      ])
    : [{ data: null }, { count: 0 }];

  return (
    <main className="siteShell recruiterArea">
      <header className="siteHeader publicHeader" aria-label="Navigation recruteur">
        <Link className="brand" href="/recruteur/dashboard" aria-label="JobMada recruteur">
          <img src={brand.logoPath} alt="" width="56" height="56" />
          <span>{brand.name}</span>
        </Link>
        <Link className="headerLink" href="/emploi">
          Voir le site public
        </Link>
      </header>

      <div className="dashboardShell recruiterShell">
        <RecruiterSidebar
          companyName={company?.name}
          displayName={profile.display_name}
          email={profile.email || user.email || null}
          plan={subscription?.plan}
          jobQuota={subscription?.job_quota}
          jobCount={jobCount ?? 0}
        />
        <div className="recruiterContent">{children}</div>
      </div>
    </main>
  );
}
