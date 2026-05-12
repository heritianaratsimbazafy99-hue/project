"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RecruiterSelectionActionResult = {
  ok: boolean;
  message: string;
};

async function updateSelectionStatus(
  applicationId: string,
  status: "shortlisted" | "viewed",
  successMessage: string
): Promise<RecruiterSelectionActionResult> {
  const normalizedApplicationId = applicationId.trim();

  if (!normalizedApplicationId) {
    return {
      ok: false,
      message: "Candidature introuvable."
    };
  }

  const { isDemo } = await requireRole(["recruiter"]);

  if (isDemo) {
    return {
      ok: false,
      message: "La sélection démo ne peut pas être modifiée."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", normalizedApplicationId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return {
      ok: false,
      message: "La sélection n'a pas pu être mise à jour."
    };
  }

  if (!data) {
    return {
      ok: false,
      message: "Candidature introuvable ou non autorisée."
    };
  }

  revalidatePath("/recruteur/selection");
  revalidatePath("/recruteur/candidatures");
  revalidatePath("/recruteur/dashboard");

  return {
    ok: true,
    message: successMessage
  };
}

export async function saveCandidateToRecruiterSelection(applicationId: string): Promise<RecruiterSelectionActionResult> {
  return updateSelectionStatus(applicationId, "shortlisted", "Candidat ajouté à votre sélection.");
}

export async function removeCandidateFromRecruiterSelection(
  applicationId: string
): Promise<RecruiterSelectionActionResult> {
  return updateSelectionStatus(applicationId, "viewed", "Candidat retiré de votre sélection.");
}

export async function removeCandidateFromRecruiterSelectionAndRefresh(applicationId: string): Promise<void> {
  await removeCandidateFromRecruiterSelection(applicationId);
}
