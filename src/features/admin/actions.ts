"use server";

import { revalidatePath } from "next/cache";

import { isReviewDecision } from "@/features/admin/review";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getNote(note?: string | FormData) {
  if (typeof note === "string") {
    return note.trim() || null;
  }

  const formNote = note?.get("note");
  return typeof formNote === "string" && formNote.trim() ? formNote.trim() : null;
}

function assertReviewRequest(targetId: string, decision: string, note?: string | FormData) {
  if (!targetId || !isReviewDecision(decision)) {
    throw new Error("Décision de modération invalide.");
  }

  const reviewNote = getNote(note);

  if (decision === "reject" && !reviewNote) {
    throw new Error("Ajoutez une note pour expliquer le rejet.");
  }

  return reviewNote;
}

function revalidateAdminRoutes() {
  revalidatePath("/admin");
  revalidatePath("/admin/offres");
  revalidatePath("/admin/entreprises");
}

async function revalidatePublicCompanyJobs(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, companyId: string) {
  const { data } = await supabase.from("jobs").select("slug").eq("company_id", companyId);

  revalidatePath("/");
  revalidatePath("/emploi");

  for (const job of data ?? []) {
    if (typeof job.slug === "string" && job.slug) {
      revalidatePath(`/emploi/${job.slug}`);
    }
  }
}

export async function reviewJob(
  jobId: string,
  decision: string,
  note?: string | FormData
): Promise<void> {
  const reviewNote = assertReviewRequest(jobId, decision, note);

  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .rpc("review_job", {
      job_uuid: jobId,
      review_decision: decision,
      review_note: reviewNote
    })
    .single<{ slug: string }>();

  if (error) {
    throw new Error(error.message || "La décision sur l'offre n'a pas pu être enregistrée.");
  }

  revalidateAdminRoutes();
  revalidatePath("/");
  revalidatePath("/emploi");
  revalidatePath(`/emploi/${data.slug}`);

  return;
}

export async function reviewCompany(
  companyId: string,
  decision: string,
  note?: string | FormData
): Promise<void> {
  const reviewNote = assertReviewRequest(companyId, decision, note);

  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("review_company", {
    company_uuid: companyId,
    review_decision: decision,
    review_note: reviewNote
  });

  if (error) {
    throw new Error(error.message || "La décision sur l'entreprise n'a pas pu être enregistrée.");
  }

  revalidateAdminRoutes();
  await revalidatePublicCompanyJobs(supabase, companyId);

  return;
}
