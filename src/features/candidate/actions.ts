"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { calculateCandidateCompletion } from "@/features/candidate/completion";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CandidateActionResult = {
  ok: boolean;
  message: string;
};

type CandidateProfileState = {
  cv_path: string | null;
  desired_role?: string | null;
};

const candidateProfilePaths = ["/candidat/profil", "/candidat/dashboard"] as const;
const candidateAlertPaths = ["/candidat/alertes", "/candidat/dashboard"] as const;
const maxCvSizeBytes = 5 * 1024 * 1024;
const allowedCvExtensions = [".pdf", ".doc", ".docx"] as const;

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
}

function buildDisplayName(firstName: string, lastName: string, fallback: string | null | undefined) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || fallback || "Candidat JobMada";
}

function revalidateCandidateProfile() {
  candidateProfilePaths.forEach((path) => revalidatePath(path));
}

function revalidateCandidateAlerts() {
  candidateAlertPaths.forEach((path) => revalidatePath(path));
}

function uploadedCvFile(formData: FormData) {
  const file = formData.get("cv");

  return file instanceof File && file.size > 0 ? file : null;
}

function isAllowedCvFile(file: File) {
  const lowerName = file.name.toLowerCase();

  return allowedCvExtensions.some((extension) => lowerName.endsWith(extension));
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

async function candidateCompletionAfterCv(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const [
    { data: candidateProfile, error: candidateProfileError },
    { count: alertCount, error: alertError }
  ] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("desired_role")
      .eq("user_id", userId)
      .maybeSingle<CandidateProfileState>(),
    supabase
      .from("job_alerts")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", userId)
  ]);

  if (candidateProfileError || alertError) {
    return null;
  }

  return calculateCandidateCompletion({
    accountCreated: true,
    hasCv: true,
    hasDesiredRole: Boolean(candidateProfile?.desired_role),
    hasAlert: Boolean(alertCount && alertCount > 0)
  });
}

export async function uploadCandidateCv(formData: FormData): Promise<CandidateActionResult> {
  const file = uploadedCvFile(formData);

  if (!file || !isAllowedCvFile(file)) {
    return {
      ok: false,
      message: "Ajoutez un CV au format PDF, DOC ou DOCX."
    };
  }

  if (file.size > maxCvSizeBytes) {
    return {
      ok: false,
      message: "Votre CV doit faire moins de 5MB."
    };
  }

  const { user, isDemo } = await requireRole(["candidate"]);

  if (isDemo) {
    return {
      ok: false,
      message: "L'upload de CV est désactivé en mode démo."
    };
  }

  const supabase = await createSupabaseServerClient();
  const fileName = sanitizeCvFileName(file.name);
  const cvPath = `${user.id}/${Date.now()}-${fileName}`;
  const completion = await candidateCompletionAfterCv(supabase, user.id);

  if (!completion) {
    return {
      ok: false,
      message: "Impossible de recalculer votre progression candidat."
    };
  }

  const { error: uploadError } = await supabase.storage.from("cvs").upload(cvPath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: true
  });

  if (uploadError) {
    return {
      ok: false,
      message: "Le CV n'a pas pu être envoyé."
    };
  }

  const { error: candidateError } = await supabase.from("candidate_profiles").upsert(
    {
      user_id: user.id,
      cv_path: cvPath,
      profile_completion: completion.percent
    },
    { onConflict: "user_id" }
  );

  if (candidateError) {
    return {
      ok: false,
      message: "Le chemin du CV n'a pas pu être enregistré."
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_completion: completion.percent })
    .eq("id", user.id);

  if (profileError) {
    return {
      ok: false,
      message: "La progression du compte n'a pas pu être mise à jour."
    };
  }

  revalidateCandidateProfile();

  return {
    ok: true,
    message: "CV enregistré."
  };
}

export async function uploadCandidateCvAndRedirect(formData: FormData): Promise<void> {
  const result = await uploadCandidateCv(formData);

  if (result.ok) {
    redirect("/candidat/profil?cv=uploaded");
  }

  redirect(`/candidat/profil?error=${encodeURIComponent(result.message)}`);
}

export async function saveCandidateProfile(formData: FormData): Promise<CandidateActionResult> {
  const { user, profile } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();

  const firstName = formValue(formData, "first_name");
  const lastName = formValue(formData, "last_name");
  const desiredRole = optionalFormValue(formData, "desired_role");

  const [
    { data: candidateProfile, error: candidateProfileError },
    { count: alertCount, error: alertError }
  ] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("cv_path")
      .eq("user_id", user.id)
      .maybeSingle<CandidateProfileState>(),
    supabase
      .from("job_alerts")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", user.id)
  ]);

  if (candidateProfileError) {
    return {
      ok: false,
      message: "Impossible de charger votre profil candidat."
    };
  }

  if (alertError) {
    return {
      ok: false,
      message: "Impossible de recalculer votre progression candidat."
    };
  }

  const completion = calculateCandidateCompletion({
    accountCreated: true,
    hasCv: Boolean(candidateProfile?.cv_path),
    hasDesiredRole: Boolean(desiredRole),
    hasAlert: Boolean(alertCount && alertCount > 0)
  });

  const { error: candidateError } = await supabase.from("candidate_profiles").upsert(
    {
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      city: optionalFormValue(formData, "city"),
      sector: optionalFormValue(formData, "sector"),
      desired_role: desiredRole,
      salary_expectation: optionalFormValue(formData, "salary_expectation"),
      profile_completion: completion.percent
    },
    { onConflict: "user_id" }
  );

  if (candidateError) {
    return {
      ok: false,
      message: "Le profil candidat n'a pas pu être enregistré."
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: buildDisplayName(firstName, lastName, profile.email || user.email),
      phone: optionalFormValue(formData, "phone"),
      onboarding_completion: completion.percent
    })
    .eq("id", user.id);

  if (profileError) {
    return {
      ok: false,
      message: "Les coordonnées du compte n'ont pas pu être enregistrées."
    };
  }

  revalidateCandidateProfile();

  return {
    ok: true,
    message: "Profil candidat enregistré."
  };
}

export async function saveCandidateProfileAndRedirect(formData: FormData): Promise<void> {
  const result = await saveCandidateProfile(formData);

  if (result.ok) {
    redirect("/candidat/profil?saved=1");
  }

  redirect(`/candidat/profil?error=${encodeURIComponent(result.message)}`);
}

export async function createCandidateJobAlert(formData: FormData): Promise<CandidateActionResult> {
  const query = formValue(formData, "query");
  const sector = optionalFormValue(formData, "sector");
  const city = optionalFormValue(formData, "city");
  const contract = optionalFormValue(formData, "contract");

  if (!query && !sector && !city && !contract) {
    return {
      ok: false,
      message: "Ajoutez au moins un critère pour créer l'alerte."
    };
  }

  const { user } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();
  const frequency = formValue(formData, "frequency") || "daily";

  const { error } = await supabase.from("job_alerts").insert({
    candidate_id: user.id,
    query,
    sector,
    city,
    contract,
    frequency,
    is_active: true
  });

  if (error) {
    return {
      ok: false,
      message: "L'alerte emploi n'a pas pu être créée."
    };
  }

  revalidateCandidateAlerts();

  return {
    ok: true,
    message: "Alerte emploi créée."
  };
}

export async function createCandidateJobAlertAndRedirect(formData: FormData): Promise<void> {
  const result = await createCandidateJobAlert(formData);

  if (result.ok) {
    redirect("/candidat/alertes?created=1");
  }

  redirect(`/candidat/alertes?error=${encodeURIComponent(result.message)}`);
}
