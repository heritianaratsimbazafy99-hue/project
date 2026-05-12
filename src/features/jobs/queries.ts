import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobListItem } from "@/types/database";

export type JobFilters = {
  query: string;
  contract: string;
  city: string;
  sector: string;
  company?: string;
  urgent?: boolean;
  page?: number;
  pageSize?: number;
  sort?: JobSort;
};

export type JobSort = "recent" | "title" | "company";

export type PublishedJobsPage = {
  jobs: JobListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type JobDetail = JobListItem & {
  description: string;
  missions: string;
  profile: string;
  salary_range: string | null;
  location_detail: string | null;
  expires_at: string | null;
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
  salary_range?: string | null;
  location_detail?: string | null;
  expires_at?: string | null;
  is_featured: boolean | null;
  is_urgent: boolean | null;
  published_at: string | null;
  companies?: CompanyRow | CompanyRow[] | null;
};

const firstValue = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

function positiveInteger(value: string, fallback: number, max?: number) {
  const parsed = Number.parseInt(value, 10);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;

  return max ? Math.min(normalized, max) : normalized;
}

function normalizeSort(value: string): JobSort {
  if (value === "title" || value === "company") {
    return value;
  }

  return "recent";
}

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
    sector: firstValue(input.sector),
    company: firstValue(input.company),
    urgent: firstValue(input.urgent) === "1",
    page: positiveInteger(firstValue(input.page), 1),
    pageSize: positiveInteger(firstValue(input.pageSize), 12, 48),
    sort: normalizeSort(firstValue(input.sort))
  };
}

export function buildJobPageHref(filters: JobFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.contract) params.set("contract", filters.contract);
  if (filters.city) params.set("city", filters.city);
  if (filters.sector) params.set("sector", filters.sector);
  if (filters.company) params.set("company", filters.company);
  if (filters.urgent) params.set("urgent", "1");
  if (filters.sort && filters.sort !== "recent") params.set("sort", filters.sort);
  if (filters.pageSize && filters.pageSize !== 12) params.set("pageSize", String(filters.pageSize));
  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/emploi?${query}` : "/emploi";
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
    salary_range: row.salary_range ?? null,
    location_detail: row.location_detail ?? null,
    expires_at: row.expires_at ?? null,
    company: normalizeCompany(row)
  };
}

function likeValue(value: string) {
  return `%${value.replace(/[%,]/g, " ")}%`;
}

export async function getPublishedJobs(filters: JobFilters): Promise<JobListItem[]> {
  const page = await getPublishedJobsPage({
    ...filters,
    page: 1,
    pageSize: 100
  });

  return page.jobs;
}

export async function getPublishedJobsPage(filters: JobFilters): Promise<PublishedJobsPage> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("jobs")
    .select(
      "id, slug, title, contract, city, sector, summary, is_featured, is_urgent, published_at, companies!inner(name, slug, logo_path)",
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("companies.status", "verified");

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

  if (filters.company) {
    request = request.eq("companies.name", filters.company);
  }

  if (filters.urgent) {
    request = request.eq("is_urgent", true);
  }

  if (filters.sort === "title") {
    request = request.order("title", { ascending: true });
  } else if (filters.sort === "company") {
    request = request.order("name", { referencedTable: "companies", ascending: true });
  } else {
    request = request.order("published_at", { ascending: false });
  }

  const { data, error, count } = await request.range(from, to);

  if (error) {
    throw new Error(`Unable to load published jobs: ${error.message}`);
  }

  const jobs = ((data ?? []) as JobRow[]).map(mapJobListItem);

  if (filters.sort === "company") {
    jobs.sort((left, right) => left.company.name.localeCompare(right.company.name, "fr"));
  }

  return {
    jobs,
    total: count ?? jobs.length,
    page,
    pageSize
  };
}

export async function getPublishedJobsOrEmpty(filters: JobFilters): Promise<JobListItem[]> {
  try {
    return await getPublishedJobs(filters);
  } catch (error) {
    console.error("Unable to load public jobs", error);
    return [];
  }
}

export async function getPublishedJobsPageOrEmpty(filters: JobFilters): Promise<PublishedJobsPage> {
  try {
    return await getPublishedJobsPage(filters);
  } catch (error) {
    console.error("Unable to load public jobs", error);
    return {
      jobs: [],
      total: 0,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 12
    };
  }
}

export async function getPublishedJobBySlug(slug: string): Promise<JobDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, slug, title, contract, city, sector, summary, description, missions, profile, salary_range, location_detail, expires_at, is_featured, is_urgent, published_at, companies!inner(name, slug, logo_path, city, sector, description)"
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
