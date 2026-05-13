import type { SubscriptionPlan } from "@/types/database";

export const planEntitlements: Record<
  SubscriptionPlan,
  {
    label: string;
    jobQuota: number;
    cvAccessEnabled: boolean;
  }
> = {
  free: {
    label: "Gratuit",
    jobQuota: 2,
    cvAccessEnabled: false
  },
  starter: {
    label: "Starter",
    jobQuota: 10,
    cvAccessEnabled: false
  },
  booster: {
    label: "Booster",
    jobQuota: 999,
    cvAccessEnabled: true
  },
  agency: {
    label: "Agence",
    jobQuota: 999,
    cvAccessEnabled: true
  }
};

export function isSubscriptionPlan(plan: string): plan is SubscriptionPlan {
  return Object.hasOwn(planEntitlements, plan);
}

type RecruiterSubscriptionAccess = {
  plan?: SubscriptionPlan | string | null;
  status?: string | null;
  job_quota?: number | null;
  cv_access_enabled?: boolean | null;
};

function isActiveSubscription(subscription: RecruiterSubscriptionAccess | null | undefined) {
  return subscription?.status == null || subscription.status === "active";
}

export function hasRecruiterCvLibraryAccess(subscription: RecruiterSubscriptionAccess | null | undefined) {
  if (!subscription || !isActiveSubscription(subscription)) {
    return false;
  }

  if (subscription.cv_access_enabled) {
    return true;
  }

  const plan = subscription.plan ?? "";

  return isSubscriptionPlan(plan) && planEntitlements[plan].cvAccessEnabled;
}

export function hasAdvancedRecruiterTools(subscription: RecruiterSubscriptionAccess | null | undefined) {
  if (!subscription || !isActiveSubscription(subscription)) {
    return false;
  }

  if (hasRecruiterCvLibraryAccess(subscription)) {
    return true;
  }

  return (subscription.job_quota ?? 0) >= 999;
}
