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

  it("renders the candidate layout with richer sidebar readiness signals", () => {
    const layoutSource = readWorkspaceFile("app/(candidate)/candidat/layout.tsx");
    const sidebarSource = readWorkspaceFile("src/features/candidate/components/candidate-sidebar.tsx");

    expect(layoutSource).toContain("readiness");
    expect(layoutSource).toContain("CandidateSidebar");
    expect(sidebarSource).toContain("candidateReadinessList");
    expect(sidebarSource).toContain("candidatePrimaryLink");
    expect(sidebarSource).toContain("LayoutDashboard");
    expect(sidebarSource).toContain("LogOut");
    expect(sidebarSource).toContain("signOut");
    expect(sidebarSource).not.toContain('href="/connexion"');
  });

  it("uses guided profile selectors inspired by the Asako candidate flow", () => {
    const source = readWorkspaceFile("app/(candidate)/candidat/profil/page.tsx");

    expect(source).toContain("candidateCities");
    expect(source).toContain("candidateSectors");
    expect(source).toContain("salaryRanges");
    expect(source).toContain("Sélectionner une ville");
    expect(source).toContain("Sélectionner un secteur");
    expect(source).toContain("Sélectionner une fourchette");
    expect(source).toContain("candidateProfileGuide");
    expect(source.indexOf("id=\"competences\"")).toBeLessThan(source.indexOf("candidateSecurityCard"));
  });

  it("renders the Asako-style onboarding checklist on the candidate dashboard", () => {
    const source = readWorkspaceFile("app/(candidate)/candidat/dashboard/page.tsx");
    const demoWorkspace = readWorkspaceFile("src/features/demo/workspace.ts");

    expect(source).toContain("Voici comment démarrer en 4 étapes");
    expect(source).toContain("Compte créé");
    expect(source).toContain("Déposer votre CV");
    expect(source).toContain("Indiquer le poste recherché");
    expect(source).toContain("Activer une alerte emploi");
    expect(source).toContain("onboardingProgress");
    expect(source).toContain("recommendedJobs");
    expect(source).toContain("candidateHeroSummary");
    expect(source).toContain("candidateNextStepCard");
    expect(source).toContain("Action prioritaire");
    expect(demoWorkspace).toContain('cv_path: "demo/cv.pdf"');
  });

  it("renders operational alert controls for pause resume and delete", () => {
    const source = readWorkspaceFile("app/(candidate)/candidat/alertes/page.tsx");

    expect(source).toContain("updateCandidateJobAlertStatusAndRedirect");
    expect(source).toContain("deleteCandidateJobAlertAndRedirect");
    expect(source).toContain('name="alert_id"');
    expect(source).toContain('name="is_active"');
  });

  it("uses guided alert selectors and exposes the active alert counter", () => {
    const source = readWorkspaceFile("app/(candidate)/candidat/alertes/page.tsx");

    expect(source).toContain("alertSectors");
    expect(source).toContain("alertCities");
    expect(source).toContain("alertContracts");
    expect(source).toContain("Toutes les villes");
    expect(source).toContain("Tous les secteurs");
    expect(source).toContain("activeAlerts");
    expect(source).toContain("candidateAlertGuide");
    expect(source).toContain("candidateAlertTableHead");
    expect(source).toContain("Créer ma première alerte");
  });

  it("renders application status filters from search params", () => {
    const source = readWorkspaceFile("app/(candidate)/candidat/candidatures/page.tsx");

    expect(source).toContain("searchParams");
    expect(source).toContain("selectedStatus");
    expect(source).toContain("/candidat/candidatures?status=");
    expect(source).toContain("filteredApplications");
  });

  it("renders candidature metrics for the candidate tracking view", () => {
    const source = readWorkspaceFile("app/(candidate)/candidat/candidatures/page.tsx");

    expect(source).toContain("candidateMetricGrid");
    expect(source).toContain("Actives");
    expect(source).toContain("Consultées");
    expect(source).toContain("Shortlist");
    expect(source).toContain("candidateStatusGuide");
    expect(source).toContain("candidateTimeline");
    expect(source).toContain("statusHints");
  });

  it("keeps candidate UI polish classes available in global styles", () => {
    const source = readWorkspaceFile("app/globals.css");

    expect(source).toContain(".candidateDashboardGrid");
    expect(source).toContain(".candidateNextStepCard");
    expect(source).toContain(".candidateProfileGuide");
    expect(source).toContain(".candidateReadinessList");
    expect(source).toContain(".cvTrustList");
    expect(source).toContain(".candidateTimeline");
    expect(source).toContain(".completionCard .candidatePrimaryLink");
  });
});
