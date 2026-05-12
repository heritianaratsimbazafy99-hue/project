"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { nextJobStatusAfterSubmit } from "@/features/jobs/status";
import { planEntitlements } from "@/features/subscriptions/plans";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobStatus, SubscriptionPlan } from "@/types/database";

export type CreateJobResult = {
  ok: boolean;
  message: string;
};

type OwnedCompanyRow = {
  id: string;
  name: string;
};

type SubscriptionRow = {
  plan: SubscriptionPlan | string | null;
  job_quota: number | null;
};

type EditableJobRow = {
  id: string;
  title: string;
  slug: string;
  contract: string;
  city: string;
  sector: string;
  salary_range: string | null;
  location_detail: string | null;
  internal_reference: string | null;
  summary: string;
  description: string;
  missions: string;
  profile: string;
  status: JobStatus;
  is_featured: boolean | null;
  is_urgent: boolean | null;
};

const requiredFields = ["title", "contract", "city", "sector"] as const;

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "offre"
  );
}

function randomSuffix() {
  return crypto.randomUUID().slice(0, 8);
}

function readJobValues(formData: FormData) {
  return {
    title: formValue(formData, "title"),
    contract: formValue(formData, "contract"),
    city: formValue(formData, "city"),
    location_detail: formValue(formData, "location_detail"),
    salary_range: formValue(formData, "salary_range"),
    internal_reference: formValue(formData, "internal_reference"),
    sector: formValue(formData, "sector"),
    summary: formValue(formData, "summary"),
    description: formValue(formData, "description"),
    missions: formValue(formData, "missions"),
    profile: formValue(formData, "profile")
  };
}

function validateJobValues(values: ReturnType<typeof readJobValues>, mode: "draft" | "submit") {
  if (mode === "draft") {
    return values.title ? null : "Ajoutez au moins un titre pour sauvegarder le brouillon.";
  }

  const missingField = requiredFields.find((field) => !values[field]);

  return missingField
    ? "Renseignez le titre, le contrat, la ville et le secteur avant d'envoyer l'offre."
    : null;
}

async function getRecruiterCompany(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<OwnedCompanyRow>();

  if (companyError || !company) {
    return null;
  }

  return company;
}

async function getCompanyQuota(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string
) {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, job_quota")
    .eq("company_id", companyId)
    .maybeSingle<SubscriptionRow>();

  if (subscription?.job_quota != null) {
    return subscription.job_quota;
  }

  return planEntitlements.free.jobQuota;
}

async function canCreateMoreJobs(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
  excludingJobId?: string
) {
  const quota = await getCompanyQuota(supabase, companyId);

  if (quota >= 999) {
    return true;
  }

  let request = supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .neq("status", "archived");

  if (excludingJobId) {
    request = request.neq("id", excludingJobId);
  }

  const { count, error } = await request;

  if (error) {
    return false;
  }

  return (count ?? 0) < quota;
}

function jobPayload(values: ReturnType<typeof readJobValues>, status: JobStatus) {
  return {
    title: values.title,
    contract: values.contract || "À préciser",
    city: values.city || "À préciser",
    sector: values.sector || "À préciser",
    salary_range: values.salary_range || null,
    location_detail: values.location_detail || null,
    internal_reference: values.internal_reference || null,
    summary: values.summary,
    description: values.description,
    missions: values.missions,
    profile: values.profile,
    status,
    is_featured: false,
    is_urgent: false
  };
}

function nextJobStatusAfterEdit(current: JobStatus, mode: "draft" | "submit"): JobStatus {
  if (current === "published") {
    return "pending_review";
  }

  if (mode === "submit") {
    return nextJobStatusAfterSubmit(current);
  }

  return current === "archived" ? "draft" : current;
}

async function createRecruiterJob(formData: FormData, mode: "draft" | "submit"): Promise<CreateJobResult> {
  const { user } = await requireRole(["recruiter"]);
  const values = readJobValues(formData);
  const validationMessage = validateJobValues(values, mode);

  if (validationMessage) {
    return {
      ok: false,
      message: validationMessage
    };
  }

  const supabase = await createSupabaseServerClient();
  const company = await getRecruiterCompany(supabase, user.id);

  if (!company) {
    return {
      ok: false,
      message: "Créez ou complétez votre entreprise avant de publier une offre."
    };
  }

  if (!(await canCreateMoreJobs(supabase, company.id))) {
    return {
      ok: false,
      message: "Votre quota d'offres est atteint. Demandez un plan supérieur pour continuer."
    };
  }

  const status = mode === "draft" ? "draft" : nextJobStatusAfterSubmit("draft");
  const slug = `${slugify(values.title)}-${randomSuffix()}`;
  const { error } = await supabase.from("jobs").insert({
    company_id: company.id,
    slug,
    ...jobPayload(values, status)
  });

  if (error) {
    return {
      ok: false,
      message: mode === "draft" ? "Brouillon non enregistré." : "Offre non envoyée. Vérifiez les champs puis réessayez."
    };
  }

  revalidatePath("/recruteur/offres");
  revalidatePath("/recruteur/dashboard");

  return {
    ok: true,
    message: mode === "draft" ? "Brouillon enregistré." : "L'offre est envoyée à l'équipe JobMada pour revue."
  };
}

export async function createJob(formData: FormData): Promise<CreateJobResult> {
  return createRecruiterJob(formData, "submit");
}

export async function saveDraftJob(formData: FormData): Promise<CreateJobResult> {
  return createRecruiterJob(formData, "draft");
}

export async function updateRecruiterJob(
  jobId: string,
  formData: FormData,
  mode: "draft" | "submit" = "draft"
): Promise<CreateJobResult> {
  const normalizedJobId = jobId.trim();

  if (!normalizedJobId) {
    return {
      ok: false,
      message: "Offre introuvable."
    };
  }

  const { user, isDemo } = await requireRole(["recruiter"]);

  if (isDemo) {
    return {
      ok: false,
      message: "Les offres démo ne peuvent pas être modifiées."
    };
  }

  const values = readJobValues(formData);
  const validationMessage = validateJobValues(values, mode);

  if (validationMessage) {
    return {
      ok: false,
      message: validationMessage
    };
  }

  const supabase = await createSupabaseServerClient();
  const company = await getRecruiterCompany(supabase, user.id);

  if (!company) {
    return {
      ok: false,
      message: "Aucune entreprise rattachée."
    };
  }

  if (!(await canCreateMoreJobs(supabase, company.id, normalizedJobId))) {
    return {
      ok: false,
      message: "Votre quota d'offres est atteint. Demandez un plan supérieur pour continuer."
    };
  }

  const { data: existingJob, error: existingJobError } = await supabase
    .from("jobs")
    .select("id, status, slug")
    .eq("id", normalizedJobId)
    .eq("company_id", company.id)
    .maybeSingle<{ id: string; status: JobStatus; slug: string }>();

  if (existingJobError || !existingJob) {
    return {
      ok: false,
      message: "Offre introuvable ou non autorisée."
    };
  }

  const status = nextJobStatusAfterEdit(existingJob.status, mode);
  const { error } = await supabase
    .from("jobs")
    .update(jobPayload(values, status))
    .eq("id", normalizedJobId)
    .eq("company_id", company.id);

  if (error) {
    return {
      ok: false,
      message: "L'offre n'a pas pu être enregistrée."
    };
  }

  revalidatePath("/recruteur/offres");
  revalidatePath(`/recruteur/offres/${normalizedJobId}/modifier`);
  revalidatePath("/recruteur/dashboard");
  revalidatePath(`/emploi/${existingJob.slug}`);

  return {
    ok: true,
    message: status === "pending_review" ? "Offre renvoyée en revue." : "Offre enregistrée."
  };
}

export async function duplicateRecruiterJob(jobId: string): Promise<CreateJobResult> {
  const normalizedJobId = jobId.trim();

  if (!normalizedJobId) {
    return {
      ok: false,
      message: "Offre introuvable."
    };
  }

  const { user, isDemo } = await requireRole(["recruiter"]);

  if (isDemo) {
    return {
      ok: false,
      message: "Les offres démo ne peuvent pas être dupliquées."
    };
  }

  const supabase = await createSupabaseServerClient();
  const company = await getRecruiterCompany(supabase, user.id);

  if (!company) {
    return {
      ok: false,
      message: "Aucune entreprise rattachée."
    };
  }

  if (!(await canCreateMoreJobs(supabase, company.id))) {
    return {
      ok: false,
      message: "Votre quota d'offres est atteint. Demandez un plan supérieur pour continuer."
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      "id, title, slug, contract, city, sector, salary_range, location_detail, internal_reference, summary, description, missions, profile, status, is_featured, is_urgent"
    )
    .eq("id", normalizedJobId)
    .eq("company_id", company.id)
    .maybeSingle<EditableJobRow>();

  if (jobError || !job) {
    return {
      ok: false,
      message: "Offre introuvable ou non autorisée."
    };
  }

  const duplicatedTitle = `${job.title} (copie)`;
  const { error } = await supabase.from("jobs").insert({
    company_id: company.id,
    title: duplicatedTitle,
    slug: `${slugify(duplicatedTitle)}-${randomSuffix()}`,
    contract: job.contract,
    city: job.city,
    sector: job.sector,
    salary_range: job.salary_range,
    location_detail: job.location_detail,
    internal_reference: job.internal_reference,
    summary: job.summary,
    description: job.description,
    missions: job.missions,
    profile: job.profile,
    status: "draft",
    is_featured: false,
    is_urgent: false
  });

  if (error) {
    return {
      ok: false,
      message: "L'offre n'a pas pu être dupliquée."
    };
  }

  revalidatePath("/recruteur/offres");
  revalidatePath("/recruteur/dashboard");

  return {
    ok: true,
    message: "Offre dupliquée en brouillon."
  };
}

export async function archiveRecruiterJob(jobId: string): Promise<CreateJobResult> {
  return setRecruiterJobStatus(jobId, "archived", "Offre archivée.", "L'offre n'a pas pu être archivée.");
}

export async function unarchiveRecruiterJob(jobId: string): Promise<CreateJobResult> {
  return setRecruiterJobStatus(jobId, "draft", "Offre restaurée en brouillon.", "L'offre n'a pas pu être restaurée.");
}

async function setRecruiterJobStatus(
  jobId: string,
  status: JobStatus,
  successMessage: string,
  errorMessage: string
): Promise<CreateJobResult> {
  const normalizedJobId = jobId.trim();

  if (!normalizedJobId) {
    return {
      ok: false,
      message: "Offre introuvable."
    };
  }

  const { isDemo } = await requireRole(["recruiter"]);

  if (isDemo) {
    return {
      ok: false,
      message: "Les offres démo ne peuvent pas être modifiées."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", normalizedJobId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return {
      ok: false,
      message: errorMessage
    };
  }

  if (!data) {
    return {
      ok: false,
      message: "Offre introuvable ou non autorisée."
    };
  }

  revalidatePath("/recruteur/offres");
  revalidatePath("/recruteur/dashboard");

  return {
    ok: true,
    message: successMessage
  };
}

export async function createJobAndRedirect(formData: FormData) {
  const result = await createJob(formData);

  if (result.ok) {
    redirect("/recruteur/offres?created=1");
  }

  redirect(`/recruteur/offres/nouvelle?error=${encodeURIComponent(result.message)}`);
}

export async function saveDraftJobAndRedirect(formData: FormData) {
  const result = await saveDraftJob(formData);

  if (result.ok) {
    redirect("/recruteur/offres?draft=1");
  }

  redirect(`/recruteur/offres/nouvelle?error=${encodeURIComponent(result.message)}`);
}

export async function updateRecruiterJobAndRedirect(
  jobId: string,
  mode: "draft" | "submit",
  formData: FormData
) {
  const result = await updateRecruiterJob(jobId, formData, mode);

  if (result.ok) {
    redirect(`/recruteur/offres?updated=${encodeURIComponent(result.message)}`);
  }

  redirect(`/recruteur/offres/${jobId}/modifier?error=${encodeURIComponent(result.message)}`);
}

export async function archiveRecruiterJobAndRedirect(jobId: string) {
  const result = await archiveRecruiterJob(jobId);

  if (result.ok) {
    redirect("/recruteur/offres?archived=1");
  }

  redirect(`/recruteur/offres?error=${encodeURIComponent(result.message)}`);
}

export async function unarchiveRecruiterJobAndRedirect(jobId: string) {
  const result = await unarchiveRecruiterJob(jobId);

  if (result.ok) {
    redirect("/recruteur/offres?restored=1");
  }

  redirect(`/recruteur/offres?error=${encodeURIComponent(result.message)}`);
}

export async function duplicateRecruiterJobAndRedirect(jobId: string) {
  const result = await duplicateRecruiterJob(jobId);

  if (result.ok) {
    redirect("/recruteur/offres?duplicated=1");
  }

  redirect(`/recruteur/offres?error=${encodeURIComponent(result.message)}`);
}
