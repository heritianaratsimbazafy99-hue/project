import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { hasAdvancedRecruiterTools, hasRecruiterCvLibraryAccess } from "@/features/subscriptions/plans";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("recruiter premium entitlements", () => {
  it("unlocks CV library and advanced tools for active agency subscriptions", () => {
    const agencySubscription = {
      plan: "agency",
      status: "active",
      job_quota: 999,
      cv_access_enabled: false
    };

    expect(hasRecruiterCvLibraryAccess(agencySubscription)).toBe(true);
    expect(hasAdvancedRecruiterTools(agencySubscription)).toBe(true);
  });

  it("keeps free subscriptions away from CV library and AI tools", () => {
    const freeSubscription = {
      plan: "free",
      status: "active",
      job_quota: 2,
      cv_access_enabled: false
    };

    expect(hasRecruiterCvLibraryAccess(freeSubscription)).toBe(false);
    expect(hasAdvancedRecruiterTools(freeSubscription)).toBe(false);
  });

  it("aligns CV library access with verified company RLS requirements", () => {
    const agencySubscription = {
      plan: "agency",
      status: "active",
      job_quota: 999,
      cv_access_enabled: false
    };

    expect(hasRecruiterCvLibraryAccess(agencySubscription, { companyStatus: "verified" })).toBe(true);
    expect(hasRecruiterCvLibraryAccess(agencySubscription, { companyStatus: "pending_review" })).toBe(false);
    expect(hasRecruiterCvLibraryAccess({ ...agencySubscription, status: null }, { companyStatus: "verified" })).toBe(false);
  });

  it("uses the entitlement helpers in recruiter CV library and new offer pages", () => {
    const cvLibraryPage = read("app/(recruiter)/recruteur/cvtheque/page.tsx");
    const cvLibraryActions = read("src/features/recruiter/cv-library-actions.ts");
    const newOfferPage = read("app/(recruiter)/recruteur/offres/nouvelle/page.tsx");

    expect(cvLibraryPage).toContain("hasRecruiterCvLibraryAccess");
    expect(cvLibraryPage).toContain("id, status, subscriptions(plan, status, job_quota, cv_access_enabled)");
    expect(cvLibraryPage).toContain("hasRecruiterCvLibraryAccess(subscription, { companyStatus: company?.status })");
    expect(cvLibraryPage).toContain("candidate_profiles");
    expect(cvLibraryPage).toContain("openRecruiterLibraryCvAndRedirect");
    expect(cvLibraryPage).toContain("Recherche libre activée");

    expect(cvLibraryActions).toContain("id, status, subscriptions(plan, status, job_quota, cv_access_enabled)");
    expect(cvLibraryActions).toContain("hasRecruiterCvLibraryAccess(firstRelation(company.subscriptions), { companyStatus: company.status })");

    expect(newOfferPage).toContain("hasAdvancedRecruiterTools");
    expect(newOfferPage).toContain("JobDescriptionAssistant");
    expect(newOfferPage).toContain("Options incluses dans votre plan");
  });
});
