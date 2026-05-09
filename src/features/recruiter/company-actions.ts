"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitCompanyForReview(companyId: string): Promise<void> {
  if (!companyId) {
    return;
  }

  const { user } = await requireRole(["recruiter"]);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("companies")
    .update({ status: "pending_review" })
    .eq("id", companyId)
    .eq("owner_id", user.id)
    .in("status", ["incomplete", "rejected"]);

  if (error) {
    return;
  }

  revalidatePath("/recruteur/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/entreprises");
}
