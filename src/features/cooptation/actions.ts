"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CooptationReferralResult = {
  ok: boolean;
  message: string;
};

const maxReferralCvSizeBytes = 10 * 1024 * 1024;
const allowedReferralCvExtensions = [".pdf", ".doc", ".docx"] as const;
const cooptationPath = "/cooptation";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
}

function uploadedReferralCv(formData: FormData) {
  const file = formData.get("candidate_cv");

  return file instanceof File && file.size > 0 ? file : null;
}

function isAllowedReferralCv(file: File) {
  const lowerName = file.name.toLowerCase();

  return allowedReferralCvExtensions.some((extension) => lowerName.endsWith(extension));
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

export async function submitCooptationReferral(formData: FormData): Promise<CooptationReferralResult> {
  if (formValue(formData, "company")) {
    return {
      ok: false,
      message: "La cooptation n'a pas pu être envoyée."
    };
  }

  const referrerName = formValue(formData, "referrer_name");
  const referrerEmail = formValue(formData, "referrer_email").toLowerCase();
  const candidateName = formValue(formData, "candidate_name");
  const candidateEmail = optionalFormValue(formData, "candidate_email")?.toLowerCase() ?? null;
  const file = uploadedReferralCv(formData);

  if (!referrerName || !referrerEmail || !candidateName) {
    return {
      ok: false,
      message: "Complétez votre nom, votre email et le nom du candidat."
    };
  }

  if (!isValidEmail(referrerEmail) || (candidateEmail && !isValidEmail(candidateEmail))) {
    return {
      ok: false,
      message: "Vérifiez les adresses email saisies."
    };
  }

  if (!file || !isAllowedReferralCv(file)) {
    return {
      ok: false,
      message: "Ajoutez le CV du candidat au format PDF, DOC ou DOCX."
    };
  }

  if (file.size > maxReferralCvSizeBytes) {
    return {
      ok: false,
      message: "Le CV doit faire moins de 10MB."
    };
  }

  const supabase = await createSupabaseServerClient();
  const cvPath = `referrals/${Date.now()}-${randomUUID()}-${sanitizeCvFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from("cooptation-cvs").upload(cvPath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (uploadError) {
    return {
      ok: false,
      message: "Le CV n'a pas pu être envoyé."
    };
  }

  const { error: referralError } = await supabase.from("cooptation_referrals").insert({
    referrer_name: referrerName,
    referrer_email: referrerEmail,
    referrer_phone: optionalFormValue(formData, "referrer_phone"),
    candidate_name: candidateName,
    candidate_email: candidateEmail,
    candidate_phone: optionalFormValue(formData, "candidate_phone"),
    candidate_city: optionalFormValue(formData, "candidate_city"),
    target_role: optionalFormValue(formData, "target_role"),
    message: optionalFormValue(formData, "message"),
    cv_path: cvPath
  });

  if (referralError) {
    return {
      ok: false,
      message: "La cooptation n'a pas pu être enregistrée."
    };
  }

  revalidatePath(cooptationPath);

  return {
    ok: true,
    message: "Cooptation envoyée. Merci pour votre recommandation."
  };
}

export async function submitCooptationReferralAndRedirect(formData: FormData): Promise<void> {
  const result = await submitCooptationReferral(formData);

  if (result.ok) {
    redirect(`${cooptationPath}?sent=1`);
  }

  redirect(`${cooptationPath}?error=${encodeURIComponent(result.message)}`);
}
