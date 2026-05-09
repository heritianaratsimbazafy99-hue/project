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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<ProfileRoleRow>();

  if (profile?.role !== "candidate") {
    return { state: "wrong_role", role: profile?.role ?? null };
  }

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("cv_path")
    .eq("user_id", user.id)
    .maybeSingle<CandidateCvRow>();

  const cvPath = candidateProfile?.cv_path?.trim() ?? "";

  if (!cvPath) {
    return { state: "missing_cv" };
  }

  const { data: application } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", normalizedJobId)
    .eq("candidate_id", user.id)
    .maybeSingle<ApplicationIdRow>();

  if (application?.id) {
    return { state: "already_applied", applicationId: application.id };
  }

  return { state: "ready", cvPath };
}
