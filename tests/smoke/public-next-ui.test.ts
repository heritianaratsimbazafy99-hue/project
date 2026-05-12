import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

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
    expect(connexion).toContain("Pas encore de compte ?");
    expect(connexion).toContain("Je cherche un emploi");
    expect(connexion).toContain("Je recrute");
    expect(read("app/globals.css")).toContain(".login-card-shell");
    expect(read("app/globals.css")).toContain(".auth-profile-pill");
  });
});
