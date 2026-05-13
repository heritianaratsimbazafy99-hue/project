import { describe, expect, it, vi } from "vitest";

describe("candidate CV parser", () => {
  it("extracts structured matching signals from CV text when AI is unavailable", async () => {
    const { extractCandidateCvFallback } = await import("@/features/candidate/cv-parser");
    const parsed = extractCandidateCvFallback(`
      Hery Ranaivo
      Développeur React senior
      Antananarivo
      Informatique & Digital

      Compétences techniques: React, TypeScript, Next.js, SQL, React
      Soft skills: Rigueur, communication claire, autonomie
      Langues: Français, Anglais
    `);

    expect(parsed.source).toBe("fallback");
    expect(parsed.desiredRole).toBe("Développeur React senior");
    expect(parsed.city).toBe("Antananarivo");
    expect(parsed.sector).toBe("Informatique & Digital");
    expect(parsed.hardSkills).toEqual(["React", "TypeScript", "Next.js", "SQL"]);
    expect(parsed.softSkills).toEqual(["Rigueur", "communication claire", "autonomie"]);
    expect(parsed.languages).toEqual(["Français", "Anglais"]);
    expect(parsed.summary).toContain("Développeur React senior");
  });

  it("falls back locally when the OpenAI key is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    const { parseCandidateCvFile } = await import("@/features/candidate/cv-parser");
    const file = new File([
      "Poste recherché: Comptable senior\nVille: Antananarivo\nSecteur: Banque, Finance & Comptabilité\nCompétences: Excel, Audit"
    ], "cv-hery.txt", { type: "text/plain" });

    await expect(parseCandidateCvFile(file)).resolves.toEqual(
      expect.objectContaining({
        source: "fallback",
        desiredRole: "Comptable senior",
        city: "Antananarivo",
        sector: "Banque, Finance & Comptabilité",
        hardSkills: ["Excel", "Audit"]
      })
    );

    vi.unstubAllEnvs();
  });
});
