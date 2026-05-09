import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/database";

export type CandidateApplication = {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  message: string | null;
  cv_path: string;
  job: {
    id: string;
    slug: string;
    title: string;
    contract: string;
    city: string;
    sector: string;
    company: {
      name: string;
      slug: string;
      logo_path: string | null;
    };
  };
};

type CompanyRow = {
  name: string | null;
  slug: string | null;
  logo_path: string | null;
};

type JobRow = {
  id: string;
  slug: string;
  title: string;
  contract: string | null;
  city: string | null;
  sector: string | null;
  companies?: CompanyRow | CompanyRow[] | null;
};

type ApplicationRow = {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  message: string | null;
  cv_path: string;
  jobs?: JobRow | JobRow[] | null;
};

const emptyCompany = {
  name: "Entreprise",
  slug: "",
  logo_path: null
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapCandidateApplication(row: ApplicationRow): CandidateApplication {
  const job = firstRelation(row.jobs);
  const company = firstRelation(job?.companies);

  return {
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    message: row.message,
    cv_path: row.cv_path,
    job: {
      id: job?.id ?? "",
      slug: job?.slug ?? "",
      title: job?.title ?? "Offre supprimée",
      contract: job?.contract ?? "",
      city: job?.city ?? "",
      sector: job?.sector ?? "",
      company: {
        name: company?.name ?? emptyCompany.name,
        slug: company?.slug ?? emptyCompany.slug,
        logo_path: company?.logo_path ?? emptyCompany.logo_path
      }
    }
  };
}

export async function getCandidateApplications(candidateId: string): Promise<CandidateApplication[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, created_at, message, cv_path, jobs!inner(id, slug, title, contract, city, sector, companies!inner(name, slug, logo_path))"
    )
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load candidate applications: ${error.message}`);
  }

  return ((data ?? []) as ApplicationRow[]).map(mapCandidateApplication);
}

export async function getCandidateApplicationsOrEmpty(candidateId: string): Promise<CandidateApplication[]> {
  try {
    return await getCandidateApplications(candidateId);
  } catch (error) {
    console.error("Unable to load candidate applications", error);
    return [];
  }
}
