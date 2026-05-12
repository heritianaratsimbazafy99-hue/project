import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readWorkspaceFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("admin UI smoke checks", () => {
  it("links the Utilisateurs admin navigation item to a real page", () => {
    const layout = readWorkspaceFile("app/(admin)/admin/layout.tsx");
    const usersPage = readWorkspaceFile("app/(admin)/admin/utilisateurs/page.tsx");
    const subscriptionsPage = readWorkspaceFile("app/(admin)/admin/abonnements/page.tsx");

    expect(layout).toContain('href: "/admin/utilisateurs"');
    expect(layout).toContain('href: "/admin/abonnements"');
    expect(usersPage).toContain("Utilisateurs");
    expect(subscriptionsPage).toContain("Demandes de changement de plan");
  });

  it("asks for rejection notes on admin moderation forms", () => {
    const offersPage = readWorkspaceFile("app/(admin)/admin/offres/page.tsx");
    const companiesPage = readWorkspaceFile("app/(admin)/admin/entreprises/page.tsx");

    expect(offersPage).toContain('name="note"');
    expect(offersPage).toContain("required");
    expect(companiesPage).toContain('name="note"');
    expect(companiesPage).toContain("required");
  });
});
