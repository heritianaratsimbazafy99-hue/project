import type { JobStatus } from "@/types/database";

export const QUOTA_EXCLUDED_JOB_STATUS = "archived" satisfies JobStatus;
const DEFAULT_JOB_QUOTA = 2;
const UNLIMITED_JOB_QUOTA = 999;

export type JobQuotaUsage = {
  quota: number;
  used: number;
  remaining: number | null;
  percent: number;
  label: string;
  remainingLabel: string;
};

export function isJobCountedTowardQuota(status: JobStatus) {
  return status !== QUOTA_EXCLUDED_JOB_STATUS;
}

export function normalizeJobQuota(quota: number | null | undefined, fallback = DEFAULT_JOB_QUOTA) {
  return typeof quota === "number" && Number.isFinite(quota) && quota > 0 ? quota : fallback;
}

export function isUnlimitedJobQuota(quota: number | null | undefined) {
  return normalizeJobQuota(quota) >= UNLIMITED_JOB_QUOTA;
}

export function calculateJobQuotaUsage({
  quota,
  used
}: {
  quota: number | null | undefined;
  used: number | null | undefined;
}): JobQuotaUsage {
  const normalizedQuota = normalizeJobQuota(quota);
  const normalizedUsed = Math.max(used ?? 0, 0);

  if (isUnlimitedJobQuota(normalizedQuota)) {
    return {
      quota: normalizedQuota,
      used: normalizedUsed,
      remaining: null,
      percent: 100,
      label: `${normalizedUsed}/illimité`,
      remainingLabel: "illimitées"
    };
  }

  const remaining = Math.max(normalizedQuota - normalizedUsed, 0);

  return {
    quota: normalizedQuota,
    used: normalizedUsed,
    remaining,
    percent: Math.min((normalizedUsed / normalizedQuota) * 100, 100),
    label: `${normalizedUsed}/${normalizedQuota} offres utilisées`,
    remainingLabel: String(remaining)
  };
}
