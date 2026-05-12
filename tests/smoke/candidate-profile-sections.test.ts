import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readWorkspaceFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("candidate profile pages", () => {
  it("renders persistent forms for profile journey, skills, CV and password sections", () => {
    const source = readWorkspaceFile("app/(candidate)/candidat/profil/page.tsx");

    expect(source).toContain("addCandidateExperienceAndRedirect");
    expect(source).toContain("addCandidateEducationAndRedirect");
    expect(source).toContain("saveCandidateSkillsAndRedirect");
    expect(source).toContain("deleteCandidateCvAndRedirect");
    expect(source).toContain("updateCandidatePasswordAndRedirect");
    expect(source).not.toContain('type="button">Ajouter une expérience');
    expect(source).not.toContain('type="button">Ajouter une formation');
    expect(source).not.toContain('type="button">Modifier le mot de passe');
  });

  it("renders operational alert controls for pause resume and delete", () => {
    const source = readWorkspaceFile("app/(candidate)/candidat/alertes/page.tsx");

    expect(source).toContain("updateCandidateJobAlertStatusAndRedirect");
    expect(source).toContain("deleteCandidateJobAlertAndRedirect");
    expect(source).toContain('name="alert_id"');
    expect(source).toContain('name="is_active"');
  });

  it("renders application status filters from search params", () => {
    const source = readWorkspaceFile("app/(candidate)/candidat/candidatures/page.tsx");

    expect(source).toContain("searchParams");
    expect(source).toContain("selectedStatus");
    expect(source).toContain("/candidat/candidatures?status=");
    expect(source).toContain("filteredApplications");
  });
});
