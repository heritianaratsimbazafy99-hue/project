import Link from "next/link";
import { BriefcaseBusiness, Circle, Layers, Star, TrendingUp, UsersRound, Zap } from "lucide-react";

import { calculateJobQuotaUsage, QUOTA_EXCLUDED_JOB_STATUS } from "@/features/recruiter/quota";
import { cancelSubscriptionPlanRequest, chooseSubscriptionPlan } from "@/features/subscriptions/actions";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RecruiterSubscriptionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const plans = [
  ["free", "Gratuit", "0 Ar/mois", "2 offres/mois, visibles 7 jours"],
  ["starter", "Starter", "80 000 Ar/mois", "10 offres/mois et statistiques"],
  ["booster", "Booster", "350 000 Ar/mois", "Offres illimitées et CVthèque"],
  ["agency", "Agence", "950 000 Ar/mois", "Sourcing avancé et support dédié"]
] as const;

type CompanyRow = {
  id: string;
};

type SubscriptionRow = {
  plan: string | null;
  job_quota: number | null;
  cv_access_enabled: boolean | null;
  status: string | null;
};

type PlanRequestRow = {
  id: string;
  requested_plan: string;
  status: string;
  requested_at: string;
  review_note: string | null;
};

const planLabels = new Map(plans.map(([id, label]) => [id, label]));

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function cancelPlanRequestAndRefresh(requestId: string) {
  "use server";

  await cancelSubscriptionPlanRequest(requestId);
}

export default async function RecruiterSubscriptionPage({ searchParams }: RecruiterSubscriptionPageProps) {
  const { user, isDemo } = await requireRole(["recruiter"]);
  const query = await searchParams;
  let subscription: SubscriptionRow | null = isDemo
    ? { plan: "free", job_quota: 2, cv_access_enabled: false, status: "active" }
    : null;
  let jobCount = isDemo ? 1 : 0;
  let planRequests: PlanRequestRow[] = [];

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<CompanyRow>();

    if (company) {
      const [{ data: subscriptionData }, { count }, { data: requestData }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("plan, job_quota, cv_access_enabled, status")
          .eq("company_id", company.id)
          .maybeSingle<SubscriptionRow>(),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .neq("status", QUOTA_EXCLUDED_JOB_STATUS),
        supabase
          .from("plan_change_requests")
          .select("id, requested_plan, status, requested_at, review_note")
          .eq("company_id", company.id)
          .order("requested_at", { ascending: false })
          .limit(5)
      ]);

      subscription = subscriptionData;
      jobCount = count ?? 0;
      planRequests = (requestData ?? []) as PlanRequestRow[];
    }
  }

  const activePlan = subscription?.plan ?? "free";
  const activePlanLabel = planLabels.get(activePlan as (typeof plans)[number][0]) ?? "Gratuit";
  const quotaUsage = calculateJobQuotaUsage({ quota: subscription?.job_quota, used: jobCount });
  const jobQuota = quotaUsage.quota;
  const usedPercent = quotaUsage.percent;

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Mon abonnement</h1>
          <p>Gérez votre plan et suivez vos quotas.</p>
        </div>
      </div>

      <section className="panel plan-current">
        <div className="plan-current-head">
          <span className="icon-tile">
            <Circle aria-hidden="true" size={18} />
          </span>
          <div>
            <h2>
              Plan {activePlanLabel} <span className="status-badge ok">{subscription?.status ?? "active"}</span>
            </h2>
            <p>
              {jobQuota >= 999 ? "Offres illimitées" : `${jobQuota} offres/mois`} ·{" "}
              {subscription?.cv_access_enabled ? "CVthèque incluse" : "CVthèque non incluse"}
            </p>
          </div>
        </div>
        <div className="panel-footer">
          <span>Passez à un plan supérieur pour débloquer plus de fonctionnalités.</span>
          <Link className="btn btn-primary" href="#plans-recruteur">
            Voir les plans →
          </Link>
        </div>
      </section>

      {firstQueryValue(query.requested) ? (
        <div className="notice-line" role="status">
          {firstQueryValue(query.requested)}
        </div>
      ) : null}
      {firstQueryValue(query.error) ? (
        <div className="notice-line is-error" role="alert">
          {firstQueryValue(query.error)}
        </div>
      ) : null}

      <section className="panel quota-panel">
        <h2>
          <TrendingUp aria-hidden="true" size={20} />
          Quotas restants
        </h2>
        <div className="quota-grid">
          {([
            ["Offres", quotaUsage.label.replace(" offres utilisées", ""), usedPercent, BriefcaseBusiness],
            ["Vedette", "—", 0, Star],
            ["Urgent", "—", 0, Zap],
            ["Remontée", "—", 0, TrendingUp],
            ["CVthèque", subscription?.cv_access_enabled ? "Incluse" : "—", subscription?.cv_access_enabled ? 100 : 0, UsersRound],
            ["Campagnes", "Bientôt", 0, Layers]
          ] as const).map(([label, value, width, Icon]) => (
            <div key={String(label)}>
              <span>
                <Icon aria-hidden="true" size={16} /> {label}
              </span>
              <strong>{value}</strong>
              <div className="quota-bar">
                <span style={{ width: `${width}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel" id="plans-recruteur">
        <div className="panel-title-row">
          <h2>
            <Layers aria-hidden="true" size={20} />
            Changer de plan
          </h2>
          <div className="billing-toggle">
            <span className="active">
              Mensuel
            </span>
            <span>Trimestriel -15%</span>
          </div>
        </div>
        <div className="pricing-grid">
          {plans.map(([id, name, price, feature]) => (
            <article className="price-card" key={id}>
              <h3>{name}</h3>
              <strong>{price}</strong>
              <p>{feature}</p>
              <form action={chooseSubscriptionPlan.bind(null, id)}>
                <button className={id === activePlan ? "btn btn-outline" : "btn btn-primary"} type="submit" disabled={id === activePlan}>
                  {id === activePlan ? "Plan actuel" : "Choisir"}
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="panel latest-empty">
        <h2>Demandes de plan</h2>
        {planRequests.length > 0 ? (
          <div className="table-list">
            {planRequests.map((request) => (
              <div className="table-row" key={request.id}>
                <div>
                  <strong>{planLabels.get(request.requested_plan as (typeof plans)[number][0]) ?? request.requested_plan}</strong>
                  <p>Statut : {request.status}</p>
                  {request.review_note ? <small>{request.review_note}</small> : null}
                </div>
                {request.status === "pending" ? (
                  <form action={cancelPlanRequestAndRefresh.bind(null, request.id)}>
                    <button className="btn btn-outline" type="submit">Annuler</button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Aucune demande de changement de plan pour le moment</div>
        )}
      </section>
    </>
  );
}
