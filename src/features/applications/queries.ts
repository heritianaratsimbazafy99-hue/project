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

export type RecruiterApplication = {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  message: string | null;
  cv_path: string;
  candidate: {
    id: string;
    displayName: string;
    city: string;
    sector: string;
    desiredRole: string;
  };
  job: {
    id: string;
    slug: string;
    title: string;
    contract: string;
    city: string;
    sector: string;
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
  candidate_id?: string;
  status: ApplicationStatus;
  created_at: string;
  message: string | null;
  cv_path: string;
  jobs?: JobRow | JobRow[] | null;
};

type CandidateProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  sector: string | null;
  desired_role: string | null;
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

function candidateDisplayName(profile: CandidateProfileRow | undefined) {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return name || "Candidat";
}

function mapRecruiterApplication(
  row: ApplicationRow,
  candidateProfiles: Map<string, CandidateProfileRow>
): RecruiterApplication {
  const job = firstRelation(row.jobs);
  const candidateId = row.candidate_id ?? "";
  const candidate = candidateProfiles.get(candidateId);

  return {
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    message: row.message,
    cv_path: row.cv_path,
    candidate: {
      id: candidateId,
      displayName: candidateDisplayName(candidate),
      city: candidate?.city ?? "",
      sector: candidate?.sector ?? "",
      desiredRole: candidate?.desired_role ?? ""
    },
    job: {
      id: job?.id ?? "",
      slug: job?.slug ?? "",
      title: job?.title ?? "Offre supprimée",
      contract: job?.contract ?? "",
      city: job?.city ?? "",
      sector: job?.sector ?? ""
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

export async function getRecruiterApplications(companyId: string): Promise<RecruiterApplication[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, candidate_id, status, created_at, message, cv_path, jobs!inner(id, slug, title, contract, city, sector, company_id)"
    )
    .eq("jobs.company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load recruiter applications: ${error.message}`);
  }

  const applicationRows = (data ?? []) as ApplicationRow[];
  const candidateIds = [...new Set(applicationRows.map((row) => row.candidate_id).filter(Boolean))] as string[];

  if (candidateIds.length === 0) {
    return applicationRows.map((row) => mapRecruiterApplication(row, new Map()));
  }

  const { data: candidateProfiles, error: candidateProfilesError } = await supabase
    .from("candidate_profiles")
    .select("user_id, first_name, last_name, city, sector, desired_role")
    .in("user_id", candidateIds);

  if (candidateProfilesError) {
    throw new Error(`Unable to load recruiter candidate profiles: ${candidateProfilesError.message}`);
  }

  const profileMap = new Map(
    ((candidateProfiles ?? []) as CandidateProfileRow[]).map((profile) => [profile.user_id, profile])
  );

  return applicationRows.map((row) => mapRecruiterApplication(row, profileMap));
}

export async function getRecruiterApplicationsOrEmpty(companyId: string): Promise<RecruiterApplication[]> {
  try {
    return await getRecruiterApplications(companyId);
  } catch (error) {
    console.error("Unable to load recruiter applications", error);
    return [];
  }
}
