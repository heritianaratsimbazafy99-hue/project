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

type RecruiterCvLibraryAccessOptions = {
  companyStatus?: string | null;
};

function isActiveSubscription(subscription: RecruiterSubscriptionAccess | null | undefined) {
  return subscription?.status === "active";
}

function hasVerifiedCompanyAccess(options: RecruiterCvLibraryAccessOptions | undefined) {
  if (!options || !Object.hasOwn(options, "companyStatus")) {
    return true;
  }

  return options.companyStatus === "verified";
}

export function hasRecruiterCvLibraryAccess(
  subscription: RecruiterSubscriptionAccess | null | undefined,
  options?: RecruiterCvLibraryAccessOptions
) {
  if (!subscription || !isActiveSubscription(subscription)) {
    return false;
  }

  if (!hasVerifiedCompanyAccess(options)) {
    return false;
  }

  if (subscription.cv_access_enabled) {
    return true;
  }

  const plan = subscription.plan ?? "";

  return (isSubscriptionPlan(plan) && planEntitlements[plan].cvAccessEnabled) || (subscription.job_quota ?? 0) >= 999;
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
