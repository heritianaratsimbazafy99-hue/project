import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { DEMO_SESSION_COOKIE, dashboardPathForRole, parseDemoSession } from "@/lib/auth/demo-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type AuthenticatedProfile = {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  onboarding_completion: number | null;
};

export async function requireRole(roles: UserRole[]) {
  const cookieStore = await cookies();
  const demoAccount = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (demoAccount) {
    if (!roles.includes(demoAccount.role)) {
      redirect(dashboardPathForRole(demoAccount.role));
    }

    return {
      isDemo: true,
      user: {
        id: demoAccount.id,
        email: demoAccount.email
      },
      profile: {
        id: demoAccount.id,
        role: demoAccount.role,
        email: demoAccount.email,
        phone: null,
        display_name: demoAccount.displayName,
        onboarding_completion: demoAccount.onboardingCompletion
      }
    };
  }

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
    .select("id, role, email, phone, display_name, onboarding_completion")
    .eq("id", user.id)
    .single<AuthenticatedProfile>();

  if (profileError || !profile) {
    redirect("/");
  }

  if (!roles.includes(profile.role)) {
    redirect(dashboardPathForRole(profile.role));
  }

  return { isDemo: false, user, profile };
}
