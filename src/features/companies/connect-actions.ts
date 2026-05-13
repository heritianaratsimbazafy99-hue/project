"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CompanyConnectResult = {
  ok: boolean;
  message: string;
};

type ConnectCompanyRow = {
  id: string;
  slug: string;
  name: string;
  career_connect_enabled: boolean | null;
};

const maxConnectCvSizeBytes = 10 * 1024 * 1024;
const allowedConnectCvExtensions = [".pdf", ".doc", ".docx"] as const;

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
}

function uploadedConnectCv(formData: FormData) {
  const file = formData.get("cv");

  return file instanceof File && file.size > 0 ? file : null;
}

function isAllowedConnectCv(file: File) {
  const lowerName = file.name.toLowerCase();

  return allowedConnectCvExtensions.some((extension) => lowerName.endsWith(extension));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeCvFileName(fileName: string) {
  const normalizedName = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedName || "cv.pdf";
}

async function getConnectCompany(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, slug, name, career_connect_enabled")
    .eq("slug", slug)
    .eq("status", "verified")
    .maybeSingle<ConnectCompanyRow>();

  return { supabase, company: data, error };
}

export async function submitCompanyConnect(slug: string, formData: FormData): Promise<CompanyConnectResult> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug || formValue(formData, "company")) {
    return {
      ok: false,
      message: "Votre profil n'a pas pu être transmis."
    };
  }

  const fullName = formValue(formData, "full_name");
  const email = formValue(formData, "email").toLowerCase();
  const consentAccepted = formData.get("consent_accepted") === "on";
  const file = uploadedConnectCv(formData);

  if (!fullName || !email) {
    return {
      ok: false,
      message: "Complétez votre nom et votre email."
    };
  }

  if (!isValidEmail(email)) {
    return {
      ok: false,
      message: "Vérifiez l'adresse email saisie."
    };
  }

  if (!consentAccepted) {
    return {
      ok: false,
      message: "Acceptez d'être contacté par l'entreprise pour envoyer votre profil."
    };
  }

  if (!file || !isAllowedConnectCv(file)) {
    return {
      ok: false,
      message: "Ajoutez votre CV au format PDF, DOC ou DOCX."
    };
  }

  if (file.size > maxConnectCvSizeBytes) {
    return {
      ok: false,
      message: "Le CV doit faire moins de 10MB."
    };
  }

  const { supabase, company, error: companyError } = await getConnectCompany(normalizedSlug);

  if (companyError || !company || !company.career_connect_enabled) {
    return {
      ok: false,
      message: "Cette entreprise ne reçoit pas de profils Connect pour le moment."
    };
  }

  const cvPath = `${company.id}/${Date.now()}-${randomUUID()}-${sanitizeCvFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from("company-connect-cvs").upload(cvPath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (uploadError) {
    return {
      ok: false,
      message: "Le CV n'a pas pu être envoyé."
    };
  }

  const { error: leadError } = await supabase.from("company_connect_profiles").insert({
    company_id: company.id,
    full_name: fullName,
    email,
    phone: optionalFormValue(formData, "phone"),
    desired_role: optionalFormValue(formData, "desired_role"),
    message: optionalFormValue(formData, "message"),
    cv_path: cvPath,
    status: "new",
    consent_accepted: true
  });

  if (leadError) {
    return {
      ok: false,
      message: "Votre profil n'a pas pu être enregistré."
    };
  }

  revalidatePath(`/entreprises/${company.slug}`);
  revalidatePath(`/entreprises/${company.slug}/connect`);

  return {
    ok: true,
    message: `Votre profil a été transmis à ${company.name}.`
  };
}

export async function submitCompanyConnectAndRedirect(slug: string, formData: FormData): Promise<void> {
  const result = await submitCompanyConnect(slug, formData);
  const param = result.ok ? "sent" : "error";

  redirect(`/entreprises/${slug}/connect?${param}=${encodeURIComponent(result.message)}`);
}
