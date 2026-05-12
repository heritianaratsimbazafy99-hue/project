import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  calculateJobQuotaUsage,
  isJobCountedTowardQuota,
  QUOTA_EXCLUDED_JOB_STATUS
} from "@/features/recruiter/quota";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("recruiter job quota usage", () => {
  it("counts every non-archived job toward the recruiter quota", () => {
    expect(QUOTA_EXCLUDED_JOB_STATUS).toBe("archived");
    expect(isJobCountedTowardQuota("draft")).toBe(true);
    expect(isJobCountedTowardQuota("pending_review")).toBe(true);
    expect(isJobCountedTowardQuota("published")).toBe(true);
    expect(isJobCountedTowardQuota("rejected")).toBe(true);
    expect(isJobCountedTowardQuota("expired")).toBe(true);
    expect(isJobCountedTowardQuota("archived")).toBe(false);
  });

  it("normalizes quota usage labels for finite and unlimited plans", () => {
    expect(calculateJobQuotaUsage({ quota: 2, used: 3 })).toEqual({
      quota: 2,
      used: 3,
      remaining: 0,
      percent: 100,
      label: "3/2 offres utilisées",
      remainingLabel: "0"
    });

    expect(calculateJobQuotaUsage({ quota: 999, used: 42 })).toEqual({
      quota: 999,
      used: 42,
      remaining: null,
      percent: 100,
      label: "42/illimité",
      remainingLabel: "illimitées"
    });
  });

  it("uses the shared quota semantics across recruiter actions and pages", () => {
    expect(read("src/features/jobs/actions.ts")).toContain("QUOTA_EXCLUDED_JOB_STATUS");
    expect(read("app/(recruiter)/recruteur/dashboard/page.tsx")).toContain("calculateJobQuotaUsage");
    expect(read("app/(recruiter)/recruteur/abonnement/page.tsx")).toContain("calculateJobQuotaUsage");
    expect(read("app/(recruiter)/recruteur/layout.tsx")).toContain("QUOTA_EXCLUDED_JOB_STATUS");
    expect(read("app/(recruiter)/recruteur/offres/nouvelle/page.tsx")).toContain("calculateJobQuotaUsage");
  });
});
