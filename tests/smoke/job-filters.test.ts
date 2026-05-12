import { describe, expect, it } from "vitest";

import { buildJobFilters, buildJobPageHref } from "@/features/jobs/queries";

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
      contract: ["CDI"],
      city: ["Antananarivo"],
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
      contract: [],
      city: [],
      sector: "",
      company: "Media Click",
      urgent: true,
      page: 3,
      pageSize: 24,
      sort: "company"
    });
  });

  it("keeps all selected contracts and cities from repeated checkbox params", () => {
    const filters = buildJobFilters({
      contract: ["CDI", "CDD", " "],
      city: ["Antananarivo", "Télétravail"],
      urgent: "true"
    });

    expect(filters.contract).toEqual(["CDI", "CDD"]);
    expect(filters.city).toEqual(["Antananarivo", "Télétravail"]);
    expect(filters.urgent).toBe(true);
  });

  it("preserves multiple selected filters in pagination hrefs", () => {
    const href = buildJobPageHref(
      {
        query: "design",
        contract: ["CDI", "CDD"],
        city: ["Antananarivo", "Télétravail"],
        sector: "",
        company: "",
        urgent: true,
        page: 1,
        pageSize: 12,
        sort: "recent"
      },
      2
    );

    const url = new URL(href, "https://jobmada.test");

    expect(url.pathname).toBe("/emploi");
    expect(url.searchParams.getAll("contract")).toEqual(["CDI", "CDD"]);
    expect(url.searchParams.getAll("city")).toEqual(["Antananarivo", "Télétravail"]);
    expect(url.searchParams.get("urgent")).toBe("1");
    expect(url.searchParams.get("page")).toBe("2");
  });
});
