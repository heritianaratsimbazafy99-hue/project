import type { JobListItem } from "@/types/database";

export const fallbackPublishedJobs: JobListItem[] = [
  {
    id: "demo-designer-uiux",
    slug: "designer-uiux-973g-d570373e",
    title: "Designer UI/UX",
    contract: "CDI",
    city: "Antananarivo",
    sector: "Informatique & Digital",
    summary: "Concevez des interfaces web modernes pour une équipe produit en croissance.",
    is_featured: true,
    is_urgent: true,
    published_at: "2026-05-09T06:00:00.000Z",
    company: { name: "Media Click", slug: "media-click", logo_path: null }
  },
  {
    id: "demo-chat-agent",
    slug: "agent-de-chat-44c3cb07",
    title: "Agent de chat bilingue",
    contract: "CDD",
    city: "Antananarivo",
    sector: "BPO & Relation client",
    summary: "Accompagnez des clients internationaux avec une communication claire et rapide.",
    is_featured: true,
    is_urgent: false,
    published_at: "2026-05-08T09:00:00.000Z",
    company: { name: "DIGITALK", slug: "digitalk", logo_path: null }
  },
  {
    id: "demo-chef-salle",
    slug: "chef-de-salle-patisserie-9760",
    title: "Chef de salle pâtisserie",
    contract: "CDI",
    city: "Antananarivo",
    sector: "Hotellerie & Restauration",
    summary: "Pilotez l'accueil, le service et l'expérience client d'une adresse premium.",
    is_featured: true,
    is_urgent: true,
    published_at: "2026-05-07T08:00:00.000Z",
    company: { name: "LES HOTELS PALISSANDRE", slug: "les-hotels-palissandre", logo_path: null }
  },
  {
    id: "demo-dev-web",
    slug: "developpeur-web-full-stack",
    title: "Developpeur web full-stack",
    contract: "Freelance",
    city: "Télétravail",
    sector: "Informatique & Digital",
    summary: "Construisez des applications web robustes avec une équipe agile.",
    is_featured: false,
    is_urgent: false,
    published_at: "2026-05-06T08:00:00.000Z",
    company: { name: "LINKEO MADA", slug: "linkeo-mada", logo_path: null }
  },
  {
    id: "demo-comptable",
    slug: "comptable-confirme",
    title: "Comptable confirmé",
    contract: "CDI",
    city: "Antananarivo",
    sector: "Finance & Comptabilité",
    summary: "Prenez en main la comptabilité générale et le reporting mensuel.",
    is_featured: false,
    is_urgent: true,
    published_at: "2026-05-05T08:00:00.000Z",
    company: { name: "La compta", slug: "la-compta", logo_path: null }
  },
  {
    id: "demo-commercial",
    slug: "commercial-terrain",
    title: "Commercial terrain",
    contract: "CDI",
    city: "Toamasina",
    sector: "Commerce & Distribution",
    summary: "Développez un portefeuille clients et suivez les opportunités terrain.",
    is_featured: false,
    is_urgent: false,
    published_at: "2026-05-04T08:00:00.000Z",
    company: { name: "MATERAUTO", slug: "materauto", logo_path: null }
  },
  {
    id: "demo-rh",
    slug: "charge-recrutement",
    title: "Chargé de recrutement",
    contract: "CDD",
    city: "Antananarivo",
    sector: "Ressources humaines",
    summary: "Soutenez le sourcing, les entretiens et l'intégration des nouveaux talents.",
    is_featured: false,
    is_urgent: false,
    published_at: "2026-05-03T08:00:00.000Z",
    company: { name: "Talentis Mada", slug: "talentis-mada", logo_path: null }
  },
  {
    id: "demo-projet-ong",
    slug: "coordinateur-projet-ong",
    title: "Coordinateur projet ONG",
    contract: "CDI",
    city: "Fianarantsoa",
    sector: "ONG & Projet",
    summary: "Coordonnez les activités terrain et le reporting d'un programme social.",
    is_featured: false,
    is_urgent: true,
    published_at: "2026-05-02T08:00:00.000Z",
    company: { name: "Impact Madagascar", slug: "impact-madagascar", logo_path: null }
  }
];

export const publicSectors = [
  ["Informatique & Digital", 42],
  ["BPO & Relation client", 38],
  ["Commerce & Distribution", 31],
  ["Finance & Comptabilité", 24],
  ["Hôtellerie & Restauration", 18],
  ["Ressources humaines", 16],
  ["ONG & Projet", 13],
  ["Industrie", 11]
] as const;

export function canUsePublicFallbackJobs() {
  if (process.env.ENABLE_PUBLIC_DEMO_FALLBACKS === "true") {
    return true;
  }

  if (process.env.ENABLE_PUBLIC_DEMO_FALLBACKS === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

export function useFallbackJobs(jobs: JobListItem[]) {
  if (jobs.length > 0) {
    return jobs;
  }

  return canUsePublicFallbackJobs() ? fallbackPublishedJobs : [];
}

export function getPublicCompanies(jobs: JobListItem[]) {
  const companies = new Map<string, JobListItem["company"]>();

  for (const job of [...jobs, ...fallbackPublishedJobs]) {
    const key = job.company.slug || job.company.name;

    if (key && !companies.has(key)) {
      companies.set(key, job.company);
    }
  }

  return [...companies.values()].slice(0, 8);
}

export function findPublicJob(slug: string, jobs: JobListItem[] = fallbackPublishedJobs) {
  return jobs.find((job) => job.slug === slug) ?? null;
}
