import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { JobListItem } from "@/types/database";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("public regression guards", () => {
  it("keeps a full recruiting company strip even when Supabase returns a sparse live set", async () => {
    const module = (await import("@/features/public/demo-data")) as Record<string, unknown>;
    const getPublicCompanies = module.getPublicCompanies as
      | ((jobs: JobListItem[]) => JobListItem["company"][])
      | undefined;
    const fallbackPublishedJobs = module.fallbackPublishedJobs as JobListItem[];

    expect(typeof getPublicCompanies).toBe("function");

    const companies = getPublicCompanies?.([fallbackPublishedJobs[0]]) ?? [];
    const companyNames = companies.map((company) => company.name);

    expect(companyNames.length).toBeGreaterThanOrEqual(6);
    expect(new Set(companyNames).size).toBe(companyNames.length);
    expect(companyNames).toEqual(
      expect.arrayContaining(["Media Click", "DIGITALK", "LES HOTELS PALISSANDRE", "LINKEO MADA", "La compta", "MATERAUTO"])
    );
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
});
