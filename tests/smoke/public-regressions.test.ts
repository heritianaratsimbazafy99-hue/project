import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { JobListItem } from "@/types/database";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("public regression guards", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps a full recruiting company strip even when Supabase returns a sparse live set", async () => {
    const module = (await import("@/features/public/demo-data")) as Record<string, unknown>;
    const getPublicCompanies = module.getPublicCompanies as
      | ((jobs: JobListItem[]) => JobListItem["company"][])
      | undefined;
    const fallbackPublishedJobs = module.fallbackPublishedJobs as JobListItem[];

    expect(typeof getPublicCompanies).toBe("function");

    const companies = getPublicCompanies?.([fallbackPublishedJobs[0]]) ?? [];
    const companyNames = companies.map((company) => company.name);

    expect(companyNames.length).toBeGreaterThanOrEqual(8);
    expect(new Set(companyNames).size).toBe(companyNames.length);
    expect(companyNames).toEqual(
      expect.arrayContaining(["Media Click", "DIGITALK", "LES HOTELS PALISSANDRE", "LINKEO MADA", "La compta", "MATERAUTO"])
    );
  });

  it("keeps the public homepage scale close to the Asako reference", () => {
    const styles = read("styles.css");

    expect(styles).toContain("width: min(1168px, calc(100% - 48px))");
    expect(styles).toContain("font-size: clamp(36px, 4vw, 52px)");
    expect(styles).toContain("padding: 48px 0");
    expect(styles).toContain("min-height: 70px");
    expect(styles).toContain(".how-it-works");
    expect(styles).toContain(".timeline::before");
    expect(styles).not.toContain("font-size: clamp(42px, 5vw, 68px)");
  });

  it("keeps signup pages close to the observed Asako recruiter and candidate account creation screens", () => {
    const signup = read("app/(public)/inscription/[type]/page.tsx");
    const styles = read("app/globals.css");

    expect(signup).toContain("signup-asako-shell");
    expect(signup).toContain("Créez votre espace recruteur");
    expect(signup).toContain("Nom de votre entreprise");
    expect(signup).toContain("Publier ma première offre");
    expect(signup).toContain("Créez votre espace candidat");
    expect(signup).toContain("Déposer mon CV");
    expect(signup).toContain("5 000+");
    expect(signup).toContain("40 000+");
    expect(styles).toContain(".signup-asako-shell");
    expect(styles).toContain(".signup-form-card");
  });

  it("highlights candidate candidature tabs from aria-current instead of source order", () => {
    const candidaturesPage = read("app/(candidate)/candidat/candidatures/page.tsx");
    const candidateStyles = read("app/globals.css");

    expect(candidaturesPage).toContain('aria-current={activeStatus === option.value ? "page" : undefined}');
    expect(candidateStyles).toContain('.candidateTabs a[aria-current="page"]');
    expect(candidateStyles).not.toContain(".candidateTabs a:first-child");
  });

  it("keeps focus-visible states for public and candidate controls touched by filtering flows", () => {
    const publicStyles = read("styles.css");
    const candidateStyles = read("app/globals.css");

    expect(publicStyles).toContain(".hamburger:focus-visible");
    expect(publicStyles).toContain(".filter-panel input:focus-visible");
    expect(publicStyles).toContain(".job-card:focus-visible");
    expect(candidateStyles).toContain(".candidateTabs a:focus-visible");
  });

  it("does not show local fallback jobs in production unless explicitly enabled", async () => {
    const { fallbackPublishedJobs, useFallbackJobs } = await import("@/features/public/demo-data");

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_PUBLIC_DEMO_FALLBACKS", undefined);

    expect(useFallbackJobs([])).toEqual([]);

    vi.stubEnv("ENABLE_PUBLIC_DEMO_FALLBACKS", "true");

    expect(useFallbackJobs([])).toEqual(fallbackPublishedJobs);
  });

  it("uses the real candidate application status labels on the dashboard", () => {
    const dashboardPage = read("app/(candidate)/candidat/dashboard/page.tsx");

    expect(dashboardPage).toContain("candidateApplicationStatusLabels[application.status]");
    expect(dashboardPage).not.toContain("<span>Envoyée</span>");
  });
});
