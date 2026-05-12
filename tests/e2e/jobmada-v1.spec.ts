export const jobMadaV1SmokeMatrix = [
  {
    role: "public",
    viewport: "desktop",
    routes: ["/", "/emploi", "/emploi/designer-ui-ux-media-click"],
    checks: ["job filters", "pagination", "real job detail fields", "candidate CTA"]
  },
  {
    role: "candidate",
    viewport: "mobile",
    routes: ["/candidat/profil", "/candidat/alertes", "/candidat/candidatures"],
    checks: ["profile sections persist", "CV upload/delete", "alerts pause/resume/delete", "application status filter"]
  },
  {
    role: "recruiter",
    viewport: "desktop",
    routes: [
      "/recruteur/offres",
      "/recruteur/offres/nouvelle",
      "/recruteur/candidatures",
      "/recruteur/selection",
      "/recruteur/abonnement"
    ],
    checks: ["draft/publish/edit/archive/restore", "authorized CV link", "shortlist persistence", "plan request"]
  },
  {
    role: "admin",
    viewport: "desktop",
    routes: ["/admin", "/admin/offres", "/admin/entreprises", "/admin/abonnements", "/admin/utilisateurs"],
    checks: ["moderation note required", "review history visible", "plan approval updates subscription"]
  }
] as const;

export type JobMadaV1SmokeMatrix = typeof jobMadaV1SmokeMatrix;
