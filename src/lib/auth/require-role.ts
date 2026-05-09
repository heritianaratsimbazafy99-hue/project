import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type AuthenticatedProfile = {
  id: string;
  role: UserRole;
  email: string | null;
  display_name: string | null;
  onboarding_completion: number | null;
};

export async function requireRole(roles: UserRole[]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/connexion");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, email, display_name, onboarding_completion")
    .eq("id", user.id)
    .single<AuthenticatedProfile>();

  if (profileError || !profile || !roles.includes(profile.role)) {
    redirect("/");
  }

  return { user, profile };
}
