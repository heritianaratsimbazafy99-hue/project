import { describe, expect, it } from "vitest";

import { isRecruiterPathActive } from "@/features/recruiter/components/recruiter-sidebar";

describe("recruiter sidebar navigation", () => {
  it("does not crash when Next has not resolved the current pathname yet", () => {
    expect(isRecruiterPathActive(null, "/recruteur/entreprise")).toBe(false);
  });

  it("keeps nested recruiter routes active", () => {
    expect(isRecruiterPathActive("/recruteur/offres/123/modifier", "/recruteur/offres")).toBe(true);
  });
});
