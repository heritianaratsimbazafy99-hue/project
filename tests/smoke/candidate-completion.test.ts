import { describe, expect, it } from "vitest";

import { calculateCandidateCompletion } from "@/features/candidate/completion";

describe("calculateCandidateCompletion", () => {
  it("matches the audited onboarding steps", () => {
    expect(
      calculateCandidateCompletion({
        accountCreated: true,
        hasCv: false,
        hasDesiredRole: false,
        hasAlert: false
      })
    ).toEqual({ percent: 25, completedSteps: 1, totalSteps: 4 });
  });
});
