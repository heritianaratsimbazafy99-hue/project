"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SaveRecruiterCompanyResult = {
  ok: boolean;
  message: string;
};

type OwnedCompanyRow = {
  id: string;
};

const companySavePaths = [
  "/recruteur/entreprise",
  "/recruteur/dashboard",
  "/recruteur/offres/nouvelle"
] as const;

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 52) || "entreprise"
  );
}

function buildCompanySlug(companyName: string, ownerId: string) {
  const suffix = ownerId.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8) || "jobmada";
  return `${slugify(companyName)}-${suffix}`;
}

function revalidateCompanyWorkspace() {
  companySavePaths.forEach((path) => revalidatePath(path));
}

export async function saveRecruiterCompany(formData: FormData): Promise<SaveRecruiterCompanyResult> {
  const name = formValue(formData, "name");

  if (!name) {
    return {
      ok: false,
      message: "Renseignez au minimum le nom de l'entreprise."
    };
  }

  const { user } = await requireRole(["recruiter"]);
  const supabase = await createSupabaseServerClient();
  const values = {
    name,
    sector: optionalFormValue(formData, "sector"),
    city: optionalFormValue(formData, "city"),
    website: optionalFormValue(formData, "website"),
    description: optionalFormValue(formData, "description")
  };

  const { data: existingCompany, error: existingCompanyError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<OwnedCompanyRow>();

  if (existingCompanyError) {
    return {
      ok: false,
      message: "Impossible de charger votre entreprise. Réessayez dans quelques instants."
    };
  }

  if (existingCompany) {
    const { error } = await supabase
      .from("companies")
      .update(values)
      .eq("id", existingCompany.id)
      .eq("owner_id", user.id);

    if (error) {
      return {
        ok: false,
        message: "Les modifications n'ont pas pu être enregistrées."
      };
    }

    revalidateCompanyWorkspace();

    return {
      ok: true,
      message: "Profil entreprise enregistré."
    };
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      ...values,
      slug: buildCompanySlug(name, user.id),
      status: "incomplete"
    })
    .select("id")
    .single<OwnedCompanyRow>();

  if (companyError || !company?.id) {
    return {
      ok: false,
      message: "L'entreprise n'a pas pu être créée."
    };
  }

  const { error: subscriptionError } = await supabase.from("subscriptions").insert({
    company_id: company.id,
    plan: "free",
    status: "active",
    job_quota: 2,
    cv_access_enabled: false
  });

  if (subscriptionError && subscriptionError.code !== "23505") {
    return {
      ok: false,
      message: "L'entreprise est créée, mais le plan gratuit n'a pas pu être initialisé."
    };
  }

  revalidateCompanyWorkspace();

  return {
    ok: true,
    message: "Profil entreprise enregistré."
  };
}

export async function saveRecruiterCompanyAndRedirect(formData: FormData): Promise<void> {
  const result = await saveRecruiterCompany(formData);

  if (result.ok) {
    redirect("/recruteur/entreprise?saved=1");
  }

  redirect(`/recruteur/entreprise?error=${encodeURIComponent(result.message)}`);
}

export async function submitCompanyForReview(companyId: string): Promise<void> {
  if (!companyId) {
    return;
  }

  const { user } = await requireRole(["recruiter"]);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("companies")
    .update({ status: "pending_review" })
    .eq("id", companyId)
    .eq("owner_id", user.id)
    .in("status", ["incomplete", "rejected"]);

  if (error) {
    return;
  }

  revalidatePath("/recruteur/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/entreprises");
}
