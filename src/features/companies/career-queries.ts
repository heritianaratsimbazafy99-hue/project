import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompanyStatus, JobListItem } from "@/types/database";

export type CompanyCareerSite = {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  sector: string | null;
  city: string | null;
  website: string | null;
  description: string | null;
  logo_path: string | null;
  cover_path: string | null;
  size_label: string | null;
  career_headline: string | null;
  career_intro: string | null;
  career_values: string[];
  career_benefits: string[];
  career_gallery_paths: string[];
  career_connect_enabled: boolean;
  career_connect_title: string | null;
  career_connect_description: string | null;
};

type CompanyCareerRow = Omit<
  CompanyCareerSite,
  "career_values" | "career_benefits" | "career_gallery_paths" | "career_connect_enabled"
> & {
  career_values: string[] | null;
  career_benefits: string[] | null;
  career_gallery_paths: string[] | null;
  career_connect_enabled: boolean | null;
};

type CompanyJobRow = {
  id: string;
  slug: string;
  title: string;
  contract: string | null;
  city: string | null;
  sector: string | null;
  summary: string | null;
  is_featured: boolean | null;
  is_urgent: boolean | null;
  published_at: string | null;
  companies?: {
    name: string | null;
    slug: string | null;
    logo_path: string | null;
  } | {
    name: string | null;
    slug: string | null;
    logo_path: string | null;
  }[] | null;
};

const companyCareerSelect = [
  "id",
  "name",
  "slug",
  "status",
  "sector",
  "city",
  "website",
  "description",
  "logo_path",
  "cover_path",
  "size_label",
  "career_headline",
  "career_intro",
  "career_values",
  "career_benefits",
  "career_gallery_paths",
  "career_connect_enabled",
  "career_connect_title",
  "career_connect_description"
].join(", ");

function normalizeTextList(value: string[] | null | undefined) {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}

function mapCompanyCareerSite(row: CompanyCareerRow): CompanyCareerSite {
  return {
    ...row,
    career_values: normalizeTextList(row.career_values),
    career_benefits: normalizeTextList(row.career_benefits),
    career_gallery_paths: normalizeTextList(row.career_gallery_paths),
    career_connect_enabled: row.career_connect_enabled ?? true
  };
}

function normalizeCompany(row: CompanyJobRow) {
  const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;

  return {
    name: company?.name ?? "Entreprise",
    slug: company?.slug ?? "",
    logo_path: company?.logo_path ?? null
  };
}

function mapCompanyJob(row: CompanyJobRow): JobListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    contract: row.contract ?? "",
    city: row.city ?? "",
    sector: row.sector ?? "",
    summary: row.summary ?? "",
    is_featured: Boolean(row.is_featured),
    is_urgent: Boolean(row.is_urgent),
    published_at: row.published_at,
    company: normalizeCompany(row)
  };
}

export async function getCompanyCareerSiteBySlug(slug: string): Promise<CompanyCareerSite | null> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("companies")
    .select(companyCareerSelect)
    .eq("slug", normalizedSlug)
    .maybeSingle<CompanyCareerRow>();

  if (error) {
    throw new Error(`Unable to load company career site: ${error.message}`);
  }

  return data ? mapCompanyCareerSite(data) : null;
}

export async function getCompanyCareerSiteBySlugOrNull(slug: string): Promise<CompanyCareerSite | null> {
  try {
    return await getCompanyCareerSiteBySlug(slug);
  } catch (error) {
    console.error("Unable to load company career site", error);
    return null;
  }
}

export async function getVerifiedCompanyConnectBySlug(slug: string): Promise<CompanyCareerSite | null> {
  const company = await getCompanyCareerSiteBySlugOrNull(slug);

  if (!company || company.status !== "verified" || !company.career_connect_enabled) {
    return null;
  }

  return company;
}

export async function getPublishedCompanyJobs(companyId: string): Promise<JobListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, slug, title, contract, city, sector, summary, is_featured, is_urgent, published_at, companies!inner(name, slug, logo_path)"
    )
    .eq("company_id", companyId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .returns<CompanyJobRow[]>();

  if (error) {
    throw new Error(`Unable to load company jobs: ${error.message}`);
  }

  return (data ?? []).map(mapCompanyJob);
}

export async function getPublishedCompanyJobsOrEmpty(companyId: string): Promise<JobListItem[]> {
  try {
    return await getPublishedCompanyJobs(companyId);
  } catch (error) {
    console.error("Unable to load company jobs", error);
    return [];
  }
}
