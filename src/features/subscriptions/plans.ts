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
