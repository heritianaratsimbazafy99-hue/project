import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type CandidateApplyState =
  | { state: "guest" }
  | { state: "wrong_role"; role: UserRole | null }
  | { state: "missing_cv" }
  | { state: "already_applied"; applicationId: string }
  | { state: "ready"; cvPath: string };

type ProfileRoleRow = {
  role: UserRole | null;
};

type CandidateCvRow = {
  cv_path: string | null;
};

type ApplicationIdRow = {
  id: string;
};

function throwSupabaseError(error: unknown, fallback: string): never {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    throw new Error(error.message);
  }

  throw new Error(fallback);
}

export async function getCandidateApplyState(jobId: string): Promise<CandidateApplyState> {
  const normalizedJobId = jobId.trim();

  if (!normalizedJobId) {
    return { state: "guest" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { state: "guest" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<ProfileRoleRow>();

  if (profileError) {
    throwSupabaseError(profileError, "Impossible de charger le profil utilisateur.");
  }

  if (profile?.role !== "candidate") {
    return { state: "wrong_role", role: profile?.role ?? null };
  }

  const { data: candidateProfile, error: candidateProfileError } = await supabase
    .from("candidate_profiles")
    .select("cv_path")
    .eq("user_id", user.id)
    .maybeSingle<CandidateCvRow>();

  if (candidateProfileError) {
    throwSupabaseError(candidateProfileError, "Impossible de charger le profil candidat.");
  }

  const cvPath = candidateProfile?.cv_path?.trim() ?? "";

  if (!cvPath) {
    return { state: "missing_cv" };
  }

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", normalizedJobId)
    .eq("candidate_id", user.id)
    .maybeSingle<ApplicationIdRow>();

  if (applicationError) {
    throwSupabaseError(applicationError, "Impossible de vérifier la candidature existante.");
  }

  if (application?.id) {
    return { state: "already_applied", applicationId: application.id };
  }

  return { state: "ready", cvPath };
}
