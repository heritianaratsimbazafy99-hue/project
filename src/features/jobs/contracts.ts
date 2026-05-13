export const JOB_CONTRACT_OPTIONS = ["CDI", "CDD", "Stage", "Intérim", "Freelance"] as const;

export type JobContractOption = (typeof JOB_CONTRACT_OPTIONS)[number];

export const HOME_JOB_CONTRACT_TABS = ["Toutes", ...JOB_CONTRACT_OPTIONS] as const;

export function contractSearchHref(contract: string) {
  return `/emploi?contract=${encodeURIComponent(contract)}`;
}

export const PUBLIC_CONTRACT_NAV_LINKS = [
  { label: "Emploi CDD", href: contractSearchHref("CDD") },
  { label: "Intérim", href: contractSearchHref("Intérim") },
  { label: "Freelance", href: contractSearchHref("Freelance") },
  { label: "Offre de stage", href: contractSearchHref("Stage") }
] as const;
