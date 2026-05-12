"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/database";

export type ApplyToJobResult = {
  ok: boolean;
  message: string;
};

export type UpdateRecruiterApplicationStatusResult = {
  ok: boolean;
  message: string;
};

export type RecruiterCandidateCvSignedUrlResult =
  | {
      ok: true;
      message: string;
      signedUrl: string;
    }
  | {
      ok: false;
      message: string;
    };

type RecruiterApplicationCvRow = {
  id: string;
  cv_path: string | null;
  jobs?:
    | {
        id: string;
        companies?: { owner_id: string } | Array<{ owner_id: string }> | null;
      }
    | Array<{
        id: string;
        companies?: { owner_id: string } | Array<{ owner_id: string }> | null;
      }>
    | null;
};

const recruiterAssignableStatuses = [
  "viewed",
  "shortlisted",
  "rejected",
  "interview",
  "hired"
] as const satisfies readonly ApplicationStatus[];

function isRecruiterAssignableStatus(status: string): status is (typeof recruiterAssignableStatuses)[number] {
  return recruiterAssignableStatuses.includes(status as (typeof recruiterAssignableStatuses)[number]);
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function createRecruiterCandidateCvSignedUrl(
  applicationId: string
): Promise<RecruiterCandidateCvSignedUrlResult> {
  const normalizedApplicationId = applicationId.trim();

  if (!normalizedApplicationId) {
    return {
      ok: false,
      message: "Candidature introuvable."
    };
  }

  const { user, isDemo } = await requireRole(["recruiter"]);

  if (isDemo) {
    return {
      ok: false,
      message: "Les CV démo ne peuvent pas être ouverts."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, cv_path, jobs!inner(id, companies!inner(owner_id))")
    .eq("id", normalizedApplicationId)
    .maybeSingle<RecruiterApplicationCvRow>();

  if (applicationError) {
    return {
      ok: false,
      message: "Impossible de vérifier cette candidature."
    };
  }

  const cvPath = application?.cv_path?.trim() ?? "";

  if (!application || !cvPath) {
    return {
      ok: false,
      message: "Candidature introuvable ou CV indisponible."
    };
  }

  const job = firstRelation(application.jobs);
  const company = firstRelation(job?.companies);

  if (company?.owner_id !== user.id) {
    return {
      ok: false,
      message: "Vous n'êtes pas autorisé à consulter ce CV."
    };
  }

  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(cvPath, 300);

  if (error || !data?.signedUrl) {
    return {
      ok: false,
      message: "Le CV n'a pas pu être préparé."
    };
  }

  return {
    ok: true,
    message: "CV prêt à consulter.",
    signedUrl: data.signedUrl
  };
}

export async function openRecruiterCandidateCvAndRedirect(applicationId: string): Promise<void> {
  const result = await createRecruiterCandidateCvSignedUrl(applicationId);

  if (result.ok) {
    redirect(result.signedUrl);
  }

  redirect(`/recruteur/candidatures?error=${encodeURIComponent(result.message)}`);
}

export async function updateRecruiterApplicationStatus(
  applicationId: string,
  status: string
): Promise<UpdateRecruiterApplicationStatusResult> {
  const normalizedApplicationId = applicationId.trim();
  const normalizedStatus = status.trim();

  if (!normalizedApplicationId || !isRecruiterAssignableStatus(normalizedStatus)) {
    return {
      ok: false,
      message: "Statut de candidature invalide."
    };
  }

  const { isDemo } = await requireRole(["recruiter"]);

  if (isDemo) {
    return {
      ok: false,
      message: "Les candidatures démo ne peuvent pas être modifiées."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .update({ status: normalizedStatus })
    .eq("id", normalizedApplicationId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return {
      ok: false,
      message: "La candidature n'a pas pu être mise à jour."
    };
  }

  if (!data) {
    return {
      ok: false,
      message: "Candidature introuvable ou non autorisée."
    };
  }

  revalidatePath("/recruteur/candidatures");
  revalidatePath("/recruteur/dashboard");

  return {
    ok: true,
    message: "Statut de candidature mis à jour."
  };
}

export async function applyToJob(jobId: string, cvPath: string | null | undefined): Promise<ApplyToJobResult> {
  const normalizedJobId = jobId.trim();
  const normalizedCvPath = cvPath?.trim() ?? "";

  if (!normalizedJobId) {
    return {
      ok: false,
      message: "Offre introuvable."
    };
  }

  if (!normalizedCvPath) {
    return {
      ok: false,
      message: "Ajoutez un CV avant de postuler."
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Connectez-vous pour postuler."
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single<{ id: string; role: string }>();

  if (profileError || profile?.role !== "candidate") {
    return {
      ok: false,
      message: "Seuls les profils candidats peuvent postuler."
    };
  }

  const { data: candidateProfile, error: candidateProfileError } = await supabase
    .from("candidate_profiles")
    .select("cv_path")
    .eq("user_id", user.id)
    .maybeSingle<{ cv_path: string | null }>();

  if (
    candidateProfileError ||
    !candidateProfile?.cv_path ||
    candidateProfile.cv_path !== normalizedCvPath ||
    !normalizedCvPath.startsWith(`${user.id}/`)
  ) {
    return {
      ok: false,
      message: "Ajoutez votre CV depuis votre profil avant de postuler."
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, companies!inner(status)")
    .eq("id", normalizedJobId)
    .eq("status", "published")
    .eq("companies.status", "verified")
    .maybeSingle<{ id: string }>();

  if (jobError || !job) {
    return {
      ok: false,
      message: "Cette offre n'est plus disponible."
    };
  }

  const { error } = await supabase.from("applications").insert({
    job_id: normalizedJobId,
    candidate_id: user.id,
    cv_path: normalizedCvPath
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        message: "Vous avez déjà postulé à cette offre."
      };
    }

    return {
      ok: false,
      message: "Candidature non envoyée. Réessayez dans quelques instants."
    };
  }

  revalidatePath("/candidat/candidatures");

  return {
    ok: true,
    message: "Votre candidature a bien été envoyée."
  };
}
