import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const readPngMetadata = (path: string) => {
  const bytes = readFileSync(resolve(process.cwd(), path));

  return {
    colorType: bytes[25],
    height: bytes.readUInt32BE(20),
    signature: bytes.subarray(0, 8).toString("hex"),
    width: bytes.readUInt32BE(16),
  };
};

describe("public Next UI routes", () => {
  it("keeps the original prototype visual system mounted in Next", () => {
    expect(read("app/layout.tsx")).toContain('import "../styles.css"');
    expect(read("app/page.tsx")).toContain("hero-band");
    expect(read("app/page.tsx")).toContain("how-it-works-title");
    expect(read("app/page.tsx")).toContain("Uploadez votre CV");
    expect(read("app/page.tsx")).toContain("On matche, vous postulez");
    expect(read("app/page.tsx")).toContain("Suivez vos candidatures");
    expect(read("src/features/public/components.tsx")).toContain("deadline-card");
    expect(read("src/features/public/components.tsx")).toContain("data-sticky-pro");
    expect(read("app/(public)/emploi/page.tsx")).toContain("jobs-listing-layout");
    expect(read("app/(public)/emploi/page.tsx")).toContain("filter-panel");
  });

  it("defines public routes used by visible links", () => {
    expect(existsSync(resolve(process.cwd(), "app/(public)/connexion/page.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "app/(public)/inscription/[type]/page.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "app/(public)/tarifs/page.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "app/(public)/cooptation/page.tsx"))).toBe(true);
  });

  it("mounts a public cooptation page with reward messaging and CV submission", () => {
    const page = read("app/(public)/cooptation/page.tsx");
    const publicComponents = read("src/features/public/components.tsx");

    expect(publicComponents).toContain("/cooptation");
    expect(publicComponents).toContain("Cooptation");
    expect(page).toContain("<PublicHeader active=\"/cooptation\"");
    expect(page).toContain("Cooptez un talent");
    expect(page).toContain("récompense");
    expect(page).toContain("reçu en entretien");
    expect(page).toContain('name="candidate_cv"');
    expect(page).toContain('accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"');
    expect(page).toContain("submitCooptationReferralAndRedirect");
  });

  it("routes the public account button to the authenticated role dashboard", () => {
    const publicComponents = read("src/features/public/components.tsx");

    expect(publicComponents).toContain("getPublicAccountTarget");
    expect(publicComponents).toContain("href={accountTarget.href}");
    expect(publicComponents).toContain("/candidat/dashboard");
    expect(publicComponents).not.toContain('className="account-pill" href="/recruteur/dashboard"');
  });

  it("keeps the public mobile drawer operable from the hamburger button", () => {
    const publicComponents = read("src/features/public/components.tsx");
    const toggle = read("src/features/public/mobile-menu-toggle.tsx");

    expect(publicComponents).toContain("MobileMenuToggle");
    expect(publicComponents).toContain('id="public-mobile-drawer"');
    expect(toggle).toContain('"use client"');
    expect(toggle).toContain('aria-controls="public-mobile-drawer"');
    expect(toggle).toContain('document.body.classList.toggle("menu-open"');
    expect(toggle).toContain("aria-expanded");
    expect(toggle).toContain("drawer.hidden");
    expect(toggle).toContain("drawer.inert");
  });

  it("uses real company logos when public job cards have a logo path", () => {
    const publicComponents = read("src/features/public/components.tsx");
    const logoHelper = read("src/features/public/company-logo.ts");

    expect(publicComponents).toContain("resolveCompanyLogoPath");
    expect(publicComponents).toContain("logoPath={job.company.logo_path}");
    expect(publicComponents).toContain('src={resolvedLogoPath}');
    expect(logoHelper).toContain("company-logos");
  });

  it("integrates the JobMada mascot as a contextual public guide", () => {
    const publicComponents = read("src/features/public/components.tsx");
    const homePage = read("app/page.tsx");
    const careerPage = read("app/(public)/entreprises/[slug]/page.tsx");
    const connectPage = read("app/(public)/entreprises/[slug]/connect/page.tsx");
    const styles = read("styles.css");
    const mascot = readPngMetadata("public/assets/mascot/jobmada-mascot-wave-cutout.png");

    expect(existsSync(resolve(process.cwd(), "public/assets/mascot/jobmada-mascot-wave-cutout.png"))).toBe(true);
    expect(mascot).toMatchObject({
      colorType: 6,
      height: 1448,
      signature: "89504e470d0a1a0a",
      width: 1086,
    });
    expect(publicComponents).toContain("export function MascotGuide");
    expect(publicComponents).toContain("/assets/mascot/jobmada-mascot-wave-cutout.png");
    expect(publicComponents).toContain('width="1086" height="1448"');
    expect(homePage).toContain("<MascotGuide");
    expect(careerPage).toContain("<MascotGuide");
    expect(connectPage).toContain("<MascotGuide");
    expect(styles).toContain(".mascot-guide");
  });

  it("resolves Supabase company logo paths on candidate surfaces too", () => {
    const dashboard = read("app/(candidate)/candidat/dashboard/page.tsx");
    const candidatures = read("app/(candidate)/candidat/candidatures/page.tsx");

    expect(dashboard).toContain("resolveCompanyLogoPath");
    expect(dashboard).toContain("candidateCompanyMark(job.company.name, job.title, job.company.logo_path)");
    expect(candidatures).toContain("resolveCompanyLogoPath");
    expect(candidatures).toContain("applicationCompanyMark(");
  });

  it("keeps the connexion page close to the observed Asako login structure", () => {
    const connexion = read("app/(public)/connexion/page.tsx");

    expect(connexion).toContain('PublicHeader variant="auth"');
    expect(connexion).toContain("Content de");
    expect(connexion).toContain("Mot de passe oublié ?");
    expect(connexion).toContain('htmlFor="login-password"');
    expect(connexion).toContain('id="login-password"');
    expect(connexion).not.toContain('<label className="login-field">\\n                  <span className="login-label-row">');
    expect(connexion).toContain("Pas encore de compte ?");
    expect(connexion).toContain("Je cherche un emploi");
    expect(connexion).toContain("Je recrute");
    expect(read("app/globals.css")).toContain(".login-card-shell");
    expect(read("app/globals.css")).toContain(".auth-profile-pill");
  });
});
