import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { calculateCandidateJobMatch, sortCandidatesByJobMatch } from "@/features/recruiter/cv-matching";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const job = {
  id: "job-1",
  title: "Developpeur React senior",
  city: "Antananarivo",
  sector: "Informatique & Digital",
  contract: "CDI",
  summary: "Produit SaaS recrute un developpeur front-end React.",
  description: "Stack TypeScript, Next.js, Supabase et interfaces dashboard.",
  missions: "Construire des composants React, optimiser les parcours utilisateurs.",
  profile: "React, TypeScript, Next.js, autonomie et communication claire."
};

describe("recruiter CV matching", () => {
  it("scores a candidate highly when role, city, sector and skills match the job", () => {
    const candidate = {
      id: "candidate-1",
      city: "Antananarivo",
      sector: "Informatique & Digital",
      desired_role: "Developpeur React",
      candidate_skills: [
        { label: "React", kind: "hard" },
        { label: "TypeScript", kind: "hard" },
        { label: "Next.js", kind: "hard" }
      ]
    };

    const match = calculateCandidateJobMatch(candidate, job);

    expect(match.score).toBeGreaterThanOrEqual(80);
    expect(match.reasons).toContain("Poste cible proche de l'offre");
    expect(match.reasons).toContain("Ville alignée");
    expect(match.reasons).toContain("Secteur aligné");
    expect(match.reasons).toContain("3 compétences clés détectées");
  });

  it("keeps the score low when the candidate is outside the job target", () => {
    const candidate = {
      id: "candidate-2",
      city: "Toamasina",
      sector: "Commerce & Distribution",
      desired_role: "Commercial terrain",
      candidate_skills: [
        { label: "Prospection", kind: "hard" },
        { label: "Négociation", kind: "soft" }
      ]
    };

    const match = calculateCandidateJobMatch(candidate, job);

    expect(match.score).toBeLessThan(35);
    expect(match.reasons).toContain("Profil à qualifier manuellement");
  });

  it("sorts candidates by the best match for a selected job", () => {
    const candidates = [
      {
        id: "candidate-low",
        city: "Mahajanga",
        sector: "Finance & Comptabilité",
        desired_role: "Comptable",
        candidate_skills: [{ label: "Excel", kind: "hard" }]
      },
      {
        id: "candidate-high",
        city: "Antananarivo",
        sector: "Informatique & Digital",
        desired_role: "Developpeur frontend",
        candidate_skills: [
          { label: "React", kind: "hard" },
          { label: "TypeScript", kind: "hard" }
        ]
      }
    ];

    const [first] = sortCandidatesByJobMatch(candidates, job);

    expect(first.id).toBe("candidate-high");
    expect(first.match.score).toBeGreaterThan(70);
  });

  it("wires the recruiter CV library to job-based matching mode", () => {
    const page = read("app/(recruiter)/recruteur/cvtheque/page.tsx");

    expect(page).toContain("sortCandidatesByJobMatch");
    expect(page).toContain("Matcher par offre");
    expect(page).toContain('name="mode" value="match"');
    expect(page).toContain('name="job"');
    expect(page).toContain(".from(\"jobs\")");
    expect(page).toContain("Score matching");
  });

  it("does not render the candidate matching empty state when no recruiter job is available", () => {
    const page = read("app/(recruiter)/recruteur/cvtheque/page.tsx");

    expect(page).toContain('const shouldShowCandidateResults = mode !== "match" || Boolean(selectedJob);');
    expect(page).toContain("{shouldShowCandidateResults ? (");
  });
});
