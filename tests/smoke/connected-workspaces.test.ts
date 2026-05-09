import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("connected workspace visual regressions", () => {
  it("keeps the recruiter workspace anchored to the approved JobMada prototype shell", () => {
    const layout = read("app/(recruiter)/recruteur/layout.tsx");
    const sidebar = read("src/features/recruiter/components/recruiter-sidebar.tsx");
    const dashboard = read("app/(recruiter)/recruteur/dashboard/page.tsx");
    const offers = read("app/(recruiter)/recruteur/offres/page.tsx");

    expect(layout).toContain("recruiter-app");
    expect(layout).toContain("recruiter-shell");
    expect(sidebar).toContain("side-groups");
    expect(sidebar).toContain("side-link");
    expect(sidebar).toContain("plan-mini");
    expect(dashboard).toContain("dashboard-grid");
    expect(dashboard).toContain("metric-card");
    expect(dashboard).toContain("dashboard-welcome");
    expect(offers).toContain("offers-panel");
    expect(offers).toContain("status-tabs");
  });
});
