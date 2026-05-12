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
  id?: string;
  cv_path: string | null;
  desired_role?: string | null;
};

const candidateProfilePaths = ["/candidat/profil", "/candidat/dashboard"] as const;
const candidateAlertPaths = ["/candidat/alertes", "/candidat/dashboard"] as const;
const candidateApplicationPaths = ["/candidat/candidatures", "/candidat/dashboard"] as const;
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

function revalidateCandidateApplications() {
  candidateApplicationPaths.forEach((path) => revalidatePath(path));
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

async function loadCandidateProfileId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();

  if (error) {
    return { id: null, error };
  }

  if (data?.id) {
    return { id: data.id, error: null };
  }

  const { data: createdProfile, error: createError } = await supabase
    .from("candidate_profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("id")
    .single<{ id: string }>();

  return { id: createdProfile?.id ?? null, error: createError };
}

function profileIdFailure(): CandidateActionResult {
  return {
    ok: false,
    message: "Impossible de charger votre profil candidat."
  };
}

function redirectBackToProfile(param: string, result: CandidateActionResult): never {
  if (result.ok) {
    redirect(`/candidat/profil?${param}=1`);
  }

  redirect(`/candidat/profil?error=${encodeURIComponent(result.message)}`);
}

function redirectBackToAlerts(param: string, result: CandidateActionResult): never {
  if (result.ok) {
    redirect(`/candidat/alertes?${param}=1`);
  }

  redirect(`/candidat/alertes?error=${encodeURIComponent(result.message)}`);
}

function optionalDateValue(formData: FormData, key: string) {
  return optionalFormValue(formData, key);
}

function parseSkillLabels(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function alertIdFromForm(formData: FormData) {
  return formValue(formData, "alert_id");
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

export async function addCandidateExperience(formData: FormData): Promise<CandidateActionResult> {
  const title = formValue(formData, "title");
  const company = formValue(formData, "company");

  if (!title || !company) {
    return {
      ok: false,
      message: "Indiquez au minimum un poste et une entreprise."
    };
  }

  const { user } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();
  const { id: candidateProfileId, error } = await loadCandidateProfileId(supabase, user.id);

  if (error || !candidateProfileId) {
    return profileIdFailure();
  }

  const isCurrent = formData.get("is_current") === "on" || formData.get("is_current") === "true";
  const { error: insertError } = await supabase.from("candidate_experiences").insert({
    candidate_profile_id: candidateProfileId,
    title,
    company,
    city: optionalFormValue(formData, "city"),
    start_date: optionalDateValue(formData, "start_date"),
    end_date: isCurrent ? null : optionalDateValue(formData, "end_date"),
    is_current: isCurrent,
    description: formValue(formData, "description")
  });

  if (insertError) {
    return {
      ok: false,
      message: "L'expérience n'a pas pu être ajoutée."
    };
  }

  revalidateCandidateProfile();

  return {
    ok: true,
    message: "Expérience ajoutée."
  };
}

export async function addCandidateExperienceAndRedirect(formData: FormData): Promise<void> {
  const result = await addCandidateExperience(formData);
  redirectBackToProfile("experience", result);
}

export async function addCandidateEducation(formData: FormData): Promise<CandidateActionResult> {
  const school = formValue(formData, "school");
  const degree = formValue(formData, "degree");

  if (!school || !degree) {
    return {
      ok: false,
      message: "Indiquez au minimum une école et un diplôme."
    };
  }

  const { user } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();
  const { id: candidateProfileId, error } = await loadCandidateProfileId(supabase, user.id);

  if (error || !candidateProfileId) {
    return profileIdFailure();
  }

  const { error: insertError } = await supabase.from("candidate_educations").insert({
    candidate_profile_id: candidateProfileId,
    school,
    degree,
    field: optionalFormValue(formData, "field"),
    city: optionalFormValue(formData, "city"),
    start_date: optionalDateValue(formData, "start_date"),
    end_date: optionalDateValue(formData, "end_date"),
    description: formValue(formData, "description")
  });

  if (insertError) {
    return {
      ok: false,
      message: "La formation n'a pas pu être ajoutée."
    };
  }

  revalidateCandidateProfile();

  return {
    ok: true,
    message: "Formation ajoutée."
  };
}

export async function addCandidateEducationAndRedirect(formData: FormData): Promise<void> {
  const result = await addCandidateEducation(formData);
  redirectBackToProfile("education", result);
}

export async function saveCandidateSkills(formData: FormData): Promise<CandidateActionResult> {
  const { user } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();
  const { id: candidateProfileId, error } = await loadCandidateProfileId(supabase, user.id);

  if (error || !candidateProfileId) {
    return profileIdFailure();
  }

  const skills = [
    ...parseSkillLabels(formValue(formData, "hard_skills")).map((label) => ({
      candidate_profile_id: candidateProfileId,
      kind: "hard",
      label,
      level: null
    })),
    ...parseSkillLabels(formValue(formData, "soft_skills")).map((label) => ({
      candidate_profile_id: candidateProfileId,
      kind: "soft",
      label,
      level: null
    })),
    ...parseSkillLabels(formValue(formData, "languages")).map((label) => ({
      candidate_profile_id: candidateProfileId,
      kind: "language",
      label,
      level: null
    }))
  ];

  const { error: deleteError } = await supabase
    .from("candidate_skills")
    .delete()
    .eq("candidate_profile_id", candidateProfileId)
    .in("kind", ["hard", "soft", "language"]);

  if (deleteError) {
    return {
      ok: false,
      message: "Les compétences existantes n'ont pas pu être remplacées."
    };
  }

  if (skills.length > 0) {
    const { error: upsertError } = await supabase
      .from("candidate_skills")
      .upsert(skills, { onConflict: "candidate_profile_id,kind,label" });

    if (upsertError) {
      return {
        ok: false,
        message: "Les compétences n'ont pas pu être enregistrées."
      };
    }
  }

  revalidateCandidateProfile();

  return {
    ok: true,
    message: "Compétences enregistrées."
  };
}

export async function saveCandidateSkillsAndRedirect(formData: FormData): Promise<void> {
  const result = await saveCandidateSkills(formData);
  redirectBackToProfile("skills", result);
}

export async function deleteCandidateCv(): Promise<CandidateActionResult> {
  const { user } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();

  const [
    { data: candidateProfile, error: candidateProfileError },
    { count: alertCount, error: alertError }
  ] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("cv_path, desired_role")
      .eq("user_id", user.id)
      .maybeSingle<CandidateProfileState>(),
    supabase
      .from("job_alerts")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", user.id)
  ]);

  if (candidateProfileError || alertError) {
    return {
      ok: false,
      message: "Impossible de charger votre CV candidat."
    };
  }

  if (!candidateProfile?.cv_path) {
    return {
      ok: false,
      message: "Aucun CV à supprimer."
    };
  }

  const { error: removeError } = await supabase.storage.from("cvs").remove([candidateProfile.cv_path]);

  if (removeError) {
    return {
      ok: false,
      message: "Le CV n'a pas pu être supprimé du stockage."
    };
  }

  const completion = calculateCandidateCompletion({
    accountCreated: true,
    hasCv: false,
    hasDesiredRole: Boolean(candidateProfile.desired_role),
    hasAlert: Boolean(alertCount && alertCount > 0)
  });

  const { error: candidateError } = await supabase
    .from("candidate_profiles")
    .update({ cv_path: null, profile_completion: completion.percent })
    .eq("user_id", user.id);

  if (candidateError) {
    return {
      ok: false,
      message: "Le profil candidat n'a pas pu être mis à jour."
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
    message: "CV supprimé."
  };
}

export async function deleteCandidateCvAndRedirect(): Promise<void> {
  const result = await deleteCandidateCv();
  redirectBackToProfile("cvDeleted", result);
}

export async function updateCandidatePassword(formData: FormData): Promise<CandidateActionResult> {
  const password = formValue(formData, "password");
  const passwordConfirm = formValue(formData, "password_confirm");

  if (password.length < 8) {
    return {
      ok: false,
      message: "Le mot de passe doit contenir au moins 8 caractères."
    };
  }

  if (password !== passwordConfirm) {
    return {
      ok: false,
      message: "Les deux mots de passe ne correspondent pas."
    };
  }

  await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      ok: false,
      message: "Le mot de passe n'a pas pu être mis à jour."
    };
  }

  revalidateCandidateProfile();

  return {
    ok: true,
    message: "Mot de passe mis à jour."
  };
}

export async function updateCandidatePasswordAndRedirect(formData: FormData): Promise<void> {
  const result = await updateCandidatePassword(formData);
  redirectBackToProfile("password", result);
}

export async function updateCandidateJobAlertStatus(formData: FormData): Promise<CandidateActionResult> {
  const alertId = alertIdFromForm(formData);

  if (!alertId) {
    return {
      ok: false,
      message: "Alerte introuvable."
    };
  }

  const isActive = formValue(formData, "is_active") === "true";
  const { user } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("job_alerts")
    .update({ is_active: isActive })
    .eq("id", alertId)
    .eq("candidate_id", user.id);

  if (error) {
    return {
      ok: false,
      message: "L'alerte n'a pas pu être mise à jour."
    };
  }

  revalidateCandidateAlerts();

  return {
    ok: true,
    message: isActive ? "Alerte réactivée." : "Alerte mise en pause."
  };
}

export async function updateCandidateJobAlertStatusAndRedirect(formData: FormData): Promise<void> {
  const isActive = formValue(formData, "is_active") === "true";
  const result = await updateCandidateJobAlertStatus(formData);
  redirectBackToAlerts(isActive ? "resumed" : "paused", result);
}

export async function deleteCandidateJobAlert(formData: FormData): Promise<CandidateActionResult> {
  const alertId = alertIdFromForm(formData);

  if (!alertId) {
    return {
      ok: false,
      message: "Alerte introuvable."
    };
  }

  const { user } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("job_alerts").delete().eq("id", alertId).eq("candidate_id", user.id);

  if (error) {
    return {
      ok: false,
      message: "L'alerte n'a pas pu être supprimée."
    };
  }

  revalidateCandidateAlerts();
  revalidateCandidateApplications();

  return {
    ok: true,
    message: "Alerte supprimée."
  };
}

export async function deleteCandidateJobAlertAndRedirect(formData: FormData): Promise<void> {
  const result = await deleteCandidateJobAlert(formData);
  redirectBackToAlerts("deleted", result);
}
