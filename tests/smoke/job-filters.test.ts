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
      sector: "Informatique & Digital",
      company: "",
      urgent: false,
      page: 1,
      pageSize: 12,
      sort: "recent"
    });
  });

  it("normalizes pagination, company, urgent and sort controls", () => {
    const filters = buildJobFilters({
      q: "  data ",
      company: "Media Click",
      urgent: "1",
      page: "3",
      pageSize: "24",
      sort: "company"
    });

    expect(filters).toEqual({
      query: "data",
      contract: "",
      city: "",
      sector: "",
      company: "Media Click",
      urgent: true,
      page: 3,
      pageSize: 24,
      sort: "company"
    });
  });
});
