"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { nextJobStatusAfterSubmit } from "@/features/jobs/status";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateJobResult = {
  ok: boolean;
  message: string;
};

type OwnedCompanyRow = {
  id: string;
  name: string;
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

export async function createJob(formData: FormData): Promise<CreateJobResult> {
  const { user } = await requireRole(["recruiter"]);

  const values = {
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

  const missingField = requiredFields.find((field) => !values[field]);

  if (missingField) {
    return {
      ok: false,
      message: "Renseignez le titre, le contrat, la ville et le secteur avant d'envoyer l'offre."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<OwnedCompanyRow>();

  if (companyError) {
    return {
      ok: false,
      message: "Impossible de vérifier votre entreprise. Réessayez dans quelques instants."
    };
  }

  if (!company) {
    return {
      ok: false,
      message: "Créez ou complétez votre entreprise avant de publier une offre."
    };
  }

  const slug = `${slugify(values.title)}-${randomSuffix()}`;
  const { error } = await supabase.from("jobs").insert({
    company_id: company.id,
    title: values.title,
    slug,
    contract: values.contract,
    city: values.city,
    sector: values.sector,
    salary_range: values.salary_range || null,
    location_detail: values.location_detail || null,
    internal_reference: values.internal_reference || null,
    summary: values.summary,
    description: values.description,
    missions: values.missions,
    profile: values.profile,
    status: nextJobStatusAfterSubmit("draft"),
    is_featured: false,
    is_urgent: false
  });

  if (error) {
    return {
      ok: false,
      message: "Offre non envoyée. Vérifiez les champs puis réessayez."
    };
  }

  revalidatePath("/recruteur/offres");

  return {
    ok: true,
    message: `L'offre est envoyée à l'équipe JobMada pour revue.`
  };
}

export async function createJobAndRedirect(formData: FormData) {
  const result = await createJob(formData);

  if (result.ok) {
    redirect("/recruteur/offres?created=1");
  }

  redirect(`/recruteur/offres/nouvelle?error=${encodeURIComponent(result.message)}`);
}
