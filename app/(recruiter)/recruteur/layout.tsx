import type { ReactNode } from "react";

import { demoRecruiterCompany, demoRecruiterSubscription } from "@/features/demo/workspace";
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
  const { user, profile, isDemo } = await requireRole(["recruiter"]);
  let company: CompanyRow | null = isDemo ? demoRecruiterCompany : null;
  let subscription: SubscriptionRow | null = isDemo ? demoRecruiterSubscription : null;
  let jobCount = isDemo ? 1 : 0;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();

    const { data: companyData } = await supabase
      .from("companies")
      .select("id, name")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<CompanyRow>();

    company = companyData;

    if (company) {
      const [{ data: subscriptionData }, { count }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("plan, job_quota")
          .eq("company_id", company.id)
          .maybeSingle<SubscriptionRow>(),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("company_id", company.id)
      ]);

      subscription = subscriptionData;
      jobCount = count ?? 0;
    }
  }

  return (
    <main className="recruiter-app compact-ui">
      <div className="recruiter-shell">
        <RecruiterSidebar
          companyName={company?.name}
          displayName={profile.display_name}
          email={profile.email || user.email || null}
          plan={subscription?.plan}
          jobQuota={subscription?.job_quota}
          jobCount={jobCount ?? 0}
        />
        <div className="recruiter-main">{children}</div>
      </div>
    </main>
  );
}
