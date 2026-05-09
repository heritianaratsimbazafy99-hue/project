"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  dashboardPathForRole,
  DEMO_SESSION_COOKIE,
  getDemoAccountForCredentials,
  serializeDemoSession
} from "@/lib/auth/demo-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const demoAccount = getDemoAccountForCredentials(email, password);

  if (!email || !password) {
    redirect("/connexion?error=missing");
  }

  if (demoAccount) {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_SESSION_COOKIE, serializeDemoSession(demoAccount), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    redirect(dashboardPathForRole(demoAccount.role));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect("/connexion?error=invalid");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single<{ role: UserRole }>();

  if (profile?.role === "recruiter") {
    redirect("/recruteur/dashboard");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  redirect("/candidat/dashboard");
}
