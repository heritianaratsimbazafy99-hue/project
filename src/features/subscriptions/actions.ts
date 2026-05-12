"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSubscriptionPlan, planEntitlements } from "@/features/subscriptions/plans";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult = {
  ok: boolean;
  message: string;
};

function formNote(formData: FormData) {
  const value = formData.get("note");
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getOwnedCompanyId(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error || !company?.id) {
    return null;
  }

  return company.id;
}

export async function requestSubscriptionPlan(plan: string): Promise<ActionResult> {
  if (!isSubscriptionPlan(plan)) {
    return {
      ok: false,
      message: "Plan demandé invalide."
    };
  }

  const { user } = await requireRole(["recruiter"]);
  const companyId = await getOwnedCompanyId(user.id);

  if (!companyId) {
    return {
      ok: false,
      message: "Créez votre entreprise avant de changer de plan."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingPendingRequest, error: existingPendingRequestError } = await supabase
    .from("plan_change_requests")
    .select("id")
    .eq("company_id", companyId)
    .eq("requested_plan", plan)
    .eq("status", "pending")
    .maybeSingle<{ id: string }>();

  if (existingPendingRequestError) {
    return {
      ok: false,
      message: "La disponibilité de ce changement de plan n'a pas pu être vérifiée."
    };
  }

  if (existingPendingRequest) {
    return {
      ok: false,
      message: "Une demande pour ce plan est déjà en attente."
    };
  }

  const { error } = await supabase.from("plan_change_requests").insert({
    company_id: companyId,
    requested_plan: plan,
    requested_by: user.id,
    status: "pending"
  });

  if (error) {
    return {
      ok: false,
      message: "La demande de changement de plan n'a pas pu être enregistrée."
    };
  }

  revalidatePath("/recruteur/abonnement");
  revalidatePath("/admin");
  revalidatePath("/admin/abonnements");

  return {
    ok: true,
    message: `Votre demande de plan ${planEntitlements[plan].label} est transmise à l'équipe JobMada.`
  };
}

export async function chooseSubscriptionPlan(plan: string): Promise<void> {
  const result = await requestSubscriptionPlan(plan);

  if (result.ok) {
    redirect(`/recruteur/abonnement?requested=${encodeURIComponent(result.message)}`);
  }

  redirect(`/recruteur/abonnement?error=${encodeURIComponent(result.message)}`);
}

export async function cancelSubscriptionPlanRequest(requestId: string): Promise<ActionResult> {
  const normalizedRequestId = requestId.trim();

  if (!normalizedRequestId) {
    return {
      ok: false,
      message: "Demande introuvable."
    };
  }

  await requireRole(["recruiter"]);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("plan_change_requests")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", normalizedRequestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    return {
      ok: false,
      message: "La demande n'a pas pu être annulée."
    };
  }

  revalidatePath("/recruteur/abonnement");
  revalidatePath("/admin/abonnements");

  return {
    ok: true,
    message: "Demande annulée."
  };
}

export async function reviewPlanChangeRequest(
  requestId: string,
  decision: "approve" | "reject",
  formData?: FormData
): Promise<ActionResult> {
  const normalizedRequestId = requestId.trim();

  if (!normalizedRequestId || (decision !== "approve" && decision !== "reject")) {
    return {
      ok: false,
      message: "Décision d'abonnement invalide."
    };
  }

  const note = formData ? formNote(formData) : null;

  if (decision === "reject" && !note) {
    return {
      ok: false,
      message: "Ajoutez une note pour rejeter la demande."
    };
  }

  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("review_plan_change_request", {
    request_uuid: normalizedRequestId,
    review_decision: decision,
    review_note: note
  });

  if (error) {
    return {
      ok: false,
      message: "La demande n'a pas pu être clôturée."
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/abonnements");
  revalidatePath("/recruteur/abonnement");

  return {
    ok: true,
    message: decision === "approve" ? "Plan approuvé." : "Demande rejetée."
  };
}

export async function reviewPlanChangeRequestAndRefresh(
  requestId: string,
  decision: "approve" | "reject",
  formData: FormData
): Promise<void> {
  const result = await reviewPlanChangeRequest(requestId, decision, formData);
  const param = result.ok ? "updated" : "error";

  redirect(`/admin/abonnements?${param}=${encodeURIComponent(result.message)}`);
}
