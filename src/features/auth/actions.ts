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

type SignupAccountType = "candidate" | "recruiter";

type SignupWorkspaceInput = {
  userId: string;
  accountType: SignupAccountType;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  desiredRole: string;
  companyName: string;
};

function textValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function normalizeSignupAccountType(value: string): SignupAccountType | null {
  if (value === "candidate" || value === "candidat") {
    return "candidate";
  }

  if (value === "recruiter" || value === "recruteur") {
    return "recruiter";
  }

  return null;
}

function signupRouteForAccountType(accountType: SignupAccountType): string {
  return accountType === "recruiter" ? "recruteur" : "candidat";
}

function signupErrorPath(accountType: SignupAccountType, error: string): string {
  return `/inscription/${signupRouteForAccountType(accountType)}?error=${error}`;
}

function makeDisplayName(firstName: string, lastName: string, email: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || email.split("@")[0] || "Utilisateur JobMada";
}

function buildSignupCompanySlug(companyName: string, userId: string): string {
  const base = companyName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52) || "entreprise";

  return `${base}-${userId.replace(/-/g, "").slice(0, 8)}`;
}

async function ensureSignupWorkspace(input: SignupWorkspaceInput): Promise<"ok" | "workspace_error"> {
  const supabase = await createSupabaseServerClient();
  const profileCompletion = input.accountType === "recruiter" ? 35 : input.desiredRole ? 35 : 20;

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: input.userId,
      role: input.accountType,
      display_name: input.displayName,
      email: input.email,
      onboarding_completion: profileCompletion
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return "workspace_error";
  }

  if (input.accountType === "candidate") {
    const { error } = await supabase.from("candidate_profiles").upsert(
      {
        user_id: input.userId,
        first_name: input.firstName,
        last_name: input.lastName,
        desired_role: input.desiredRole || null,
        profile_completion: profileCompletion
      },
      { onConflict: "user_id" }
    );

    return error ? "workspace_error" : "ok";
  }

  const { data: existingCompany, error: existingCompanyError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", input.userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingCompanyError) {
    return "workspace_error";
  }

  let companyId = existingCompany?.id ?? null;

  if (!companyId) {
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        owner_id: input.userId,
        name: input.companyName,
        slug: buildSignupCompanySlug(input.companyName, input.userId),
        status: "incomplete"
      })
      .select("id")
      .single<{ id: string }>();

    if (companyError || !company?.id) {
      return "workspace_error";
    }

    companyId = company.id;
  }

  const { error: subscriptionError } = await supabase.from("subscriptions").insert({
    company_id: companyId,
    plan: "free",
    status: "active",
    job_quota: 2,
    cv_access_enabled: false
  });

  return subscriptionError && subscriptionError.code !== "23505" ? "workspace_error" : "ok";
}

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

export async function signUpWithPassword(formData: FormData) {
  const accountType = normalizeSignupAccountType(textValue(formData, "account_type"));
  const email = textValue(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = textValue(formData, "first_name");
  const lastName = textValue(formData, "last_name");
  const desiredRole = textValue(formData, "desired_role");
  const companyName = textValue(formData, "company_name");

  if (!accountType) {
    redirect("/inscription/candidat?error=missing");
  }

  const needsCompany = accountType === "recruiter";
  const hasRequiredFields = Boolean(email && password && firstName && lastName && (!needsCompany || companyName));

  if (!hasRequiredFields || password.length < 8) {
    redirect(signupErrorPath(accountType, "missing"));
  }

  const displayName = makeDisplayName(firstName, lastName, email);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: accountType,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        desired_role: desiredRole,
        company_name: companyName
      }
    }
  });

  if (error || !data.user) {
    redirect(signupErrorPath(accountType, "exists"));
  }

  if (!data.session) {
    redirect(`/connexion?signup=check-email&type=${signupRouteForAccountType(accountType)}`);
  }

  const workspaceStatus = await ensureSignupWorkspace({
    userId: data.user.id,
    accountType,
    email: data.user.email ?? email,
    firstName,
    lastName,
    displayName,
    desiredRole,
    companyName
  });

  if (workspaceStatus !== "ok") {
    redirect(signupErrorPath(accountType, "workspace"));
  }

  redirect(accountType === "recruiter" ? "/recruteur/dashboard" : "/candidat/dashboard");
}
