import { describe, expect, it } from "vitest";

import { buildJobFilters } from "@/features/jobs/queries";

describe("buildJobFilters", () => {
  it("normalizes public job filters from URL search params", () => {
    const filters = buildJobFilters({
      q: "  designer ",
      contract: "CDI",
      city: "Antananarivo",
      sector: "Informatique & Digital"
    });

    expect(filters).toEqual({
      query: "designer",
      contract: "CDI",
      city: "Antananarivo",
      sector: "Informatique & Digital"
    });
  });
});
