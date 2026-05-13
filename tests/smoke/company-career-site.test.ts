import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("company career site V1", () => {
  it("adds a public company career route with jobs and Connect CTA", () => {
    const page = read("app/(public)/entreprises/[slug]/page.tsx");

    expect(page).toContain("getCompanyCareerSiteBySlug");
    expect(page).toContain("getPublishedCompanyJobs");
    expect(page).toContain("career-gallery");
    expect(page).toContain("PublicJobCard");
    expect(page).toContain("/entreprises/${company.slug}/connect");
  });

  it("adds a dedicated Connect form with CV and consent", () => {
    const page = read("app/(public)/entreprises/[slug]/connect/page.tsx");

    expect(page).toContain("submitCompanyConnectAndRedirect");
    expect(page).toContain('name="cv"');
    expect(page).toContain('name="consent_accepted"');
    expect(page).toContain("company-connect-form");
  });

  it("points recruiters to the real company career page and exposes Connect leads", () => {
    const companyPage = read("app/(recruiter)/recruteur/entreprise/page.tsx");
    const sidebar = read("src/features/recruiter/components/recruiter-sidebar.tsx");

    expect(companyPage).toContain("/entreprises/${company.slug}");
    expect(companyPage).toContain('name="career_headline"');
    expect(companyPage).toContain('name="career_benefits"');
    expect(companyPage).toContain('name="career_connect_enabled"');
    expect(sidebar).toContain("/recruteur/vivier");
    expect(read("app/(recruiter)/recruteur/vivier/page.tsx")).toContain("company_connect_profiles");
  });
});
