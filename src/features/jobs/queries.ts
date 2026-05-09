import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobListItem } from "@/types/database";

export type JobFilters = {
  query: string;
  contract: string;
  city: string;
  sector: string;
};

export type JobDetail = JobListItem & {
  description: string;
  missions: string;
  profile: string;
  company: JobListItem["company"] & {
    city: string;
    sector: string;
    description: string;
  };
};

type CompanyRow = {
  name: string | null;
  slug: string | null;
  logo_path: string | null;
  city?: string | null;
  sector?: string | null;
  description?: string | null;
};

type JobRow = {
  id: string;
  slug: string;
  title: string;
  contract: string | null;
  city: string | null;
  sector: string | null;
  summary: string | null;
  description?: string | null;
  missions?: string | null;
  profile?: string | null;
  is_featured: boolean | null;
  is_urgent: boolean | null;
  published_at: string | null;
  companies?: CompanyRow | CompanyRow[] | null;
};

const firstValue = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

const emptyCompany = {
  name: "Entreprise",
  slug: "",
  logo_path: null,
  city: "",
  sector: "",
  description: ""
};

export function buildJobFilters(
  input: Record<string, string | string[] | undefined>
): JobFilters {
  return {
    query: firstValue(input.q),
    contract: firstValue(input.contract),
    city: firstValue(input.city),
    sector: firstValue(input.sector)
  };
}

function normalizeCompany(row: JobRow) {
  const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;

  if (!company) {
    return emptyCompany;
  }

  return {
    name: company.name ?? emptyCompany.name,
    slug: company.slug ?? emptyCompany.slug,
    logo_path: company.logo_path,
    city: company.city ?? "",
    sector: company.sector ?? "",
    description: company.description ?? ""
  };
}

function mapJobListItem(row: JobRow): JobListItem {
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

function mapJobDetail(row: JobRow): JobDetail {
  return {
    ...mapJobListItem(row),
    description: row.description ?? "",
    missions: row.missions ?? "",
    profile: row.profile ?? "",
    company: normalizeCompany(row)
  };
}

function likeValue(value: string) {
  return `%${value.replace(/[%,]/g, " ")}%`;
}

export async function getPublishedJobs(filters: JobFilters): Promise<JobListItem[]> {
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("jobs")
    .select(
      "id, slug, title, contract, city, sector, summary, is_featured, is_urgent, published_at, companies!inner(name, slug, logo_path)"
    )
    .eq("status", "published")
    .eq("companies.status", "verified")
    .order("published_at", { ascending: false });

  if (filters.query) {
    const query = likeValue(filters.query);
    request = request.or(`title.ilike.${query},summary.ilike.${query}`);
  }

  if (filters.contract) {
    request = request.eq("contract", filters.contract);
  }

  if (filters.city) {
    request = request.eq("city", filters.city);
  }

  if (filters.sector) {
    request = request.eq("sector", filters.sector);
  }

  const { data, error } = await request;

  if (error) {
    throw new Error(`Unable to load published jobs: ${error.message}`);
  }

  return ((data ?? []) as JobRow[]).map(mapJobListItem);
}

export async function getPublishedJobsOrEmpty(filters: JobFilters): Promise<JobListItem[]> {
  try {
    return await getPublishedJobs(filters);
  } catch (error) {
    console.error("Unable to load public jobs", error);
    return [];
  }
}

export async function getPublishedJobBySlug(slug: string): Promise<JobDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, slug, title, contract, city, sector, summary, description, missions, profile, is_featured, is_urgent, published_at, companies!inner(name, slug, logo_path, city, sector, description)"
    )
    .eq("status", "published")
    .eq("companies.status", "verified")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load published job: ${error.message}`);
  }

  return data ? mapJobDetail(data as JobRow) : null;
}

export async function getPublishedJobBySlugOrNull(slug: string): Promise<JobDetail | null> {
  try {
    return await getPublishedJobBySlug(slug);
  } catch (error) {
    console.error("Unable to load public job", error);
    return null;
  }
}
