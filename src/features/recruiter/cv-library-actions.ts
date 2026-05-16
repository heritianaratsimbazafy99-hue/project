"use server";

import { redirect } from "next/navigation";

import { hasRecruiterCvLibraryAccess } from "@/features/subscriptions/plans";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SubscriptionAccessRow = {
  plan: string | null;
  status: string | null;
  job_quota: number | null;
  cv_access_enabled: boolean | null;
};

type CompanyAccessRow = {
  id: string;
  status: string | null;
  subscriptions?: SubscriptionAccessRow | SubscriptionAccessRow[] | null;
};

type CandidateCvRow = {
  id: string;
  user_id: string;
  cv_path: string | null;
  cv_library_opt_in: boolean | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export type RecruiterLibraryCvSignedUrlResult =
  | {
      ok: true;
      message: string;
      signedUrl: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function createRecruiterLibraryCvSignedUrl(
  candidateProfileId: string
): Promise<RecruiterLibraryCvSignedUrlResult> {
  const normalizedCandidateProfileId = candidateProfileId.trim();

  if (!normalizedCandidateProfileId) {
    return {
      ok: false,
      message: "Profil candidat introuvable."
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
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, status, subscriptions(plan, status, job_quota, cv_access_enabled)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<CompanyAccessRow>();

  if (
    companyError ||
    !company ||
    !hasRecruiterCvLibraryAccess(firstRelation(company.subscriptions), { companyStatus: company.status })
  ) {
    return {
      ok: false,
      message: "Votre plan ne donne pas accès à la CVthèque."
    };
  }

  const { data: candidateProfile, error: candidateProfileError } = await supabase
    .from("candidate_profiles")
    .select("id, user_id, cv_path, cv_library_opt_in")
    .eq("id", normalizedCandidateProfileId)
    .maybeSingle<CandidateCvRow>();

  const cvPath = candidateProfile?.cv_path?.trim() ?? "";

  if (
    candidateProfileError ||
    !candidateProfile ||
    !candidateProfile.cv_library_opt_in ||
    !cvPath ||
    !cvPath.startsWith(`${candidateProfile.user_id}/`)
  ) {
    return {
      ok: false,
      message: "CV candidat introuvable ou indisponible."
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

export async function openRecruiterLibraryCvAndRedirect(candidateProfileId: string): Promise<void> {
  const result = await createRecruiterLibraryCvSignedUrl(candidateProfileId);

  if (result.ok) {
    redirect(result.signedUrl);
  }

  redirect(`/recruteur/cvtheque?error=${encodeURIComponent(result.message)}`);
}
