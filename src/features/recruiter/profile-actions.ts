"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RecruiterProfileActionResult = {
  ok: boolean;
  message: string;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
}

function buildDisplayName(firstName: string, lastName: string, fallback: string | null | undefined) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || fallback || "Recruteur JobMada";
}

export async function saveRecruiterProfile(formData: FormData): Promise<RecruiterProfileActionResult> {
  const { user, profile } = await requireRole(["recruiter"]);
  const firstName = formValue(formData, "first_name");
  const lastName = formValue(formData, "last_name");
  const displayName = buildDisplayName(firstName, lastName, profile.display_name);
  const phone = optionalFormValue(formData, "phone");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ display_name: displayName, phone }).eq("id", user.id);

  if (error) {
    return {
      ok: false,
      message: "Le profil recruteur n'a pas pu être enregistré."
    };
  }

  revalidatePath("/recruteur/profil");
  revalidatePath("/recruteur/dashboard");

  return {
    ok: true,
    message: "Profil recruteur enregistré."
  };
}

export async function saveRecruiterProfileAndRedirect(formData: FormData): Promise<void> {
  const result = await saveRecruiterProfile(formData);

  if (result.ok) {
    redirect("/recruteur/profil?saved=1");
  }

  redirect(`/recruteur/profil?error=${encodeURIComponent(result.message)}`);
}

export async function changeRecruiterPassword(formData: FormData): Promise<RecruiterProfileActionResult> {
  const password = formValue(formData, "password");
  const passwordConfirm = formValue(formData, "password_confirm");

  if (password.length < 8) {
    return {
      ok: false,
      message: "Le nouveau mot de passe doit contenir au moins 8 caractères."
    };
  }

  if (password !== passwordConfirm) {
    return {
      ok: false,
      message: "Les deux mots de passe ne correspondent pas."
    };
  }

  const { isDemo } = await requireRole(["recruiter"]);

  if (isDemo) {
    return {
      ok: false,
      message: "Le mot de passe démo ne peut pas être modifié."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      ok: false,
      message: "Le mot de passe n'a pas pu être mis à jour."
    };
  }

  return {
    ok: true,
    message: "Mot de passe mis à jour."
  };
}

export async function changeRecruiterPasswordAndRedirect(formData: FormData): Promise<void> {
  const result = await changeRecruiterPassword(formData);

  if (result.ok) {
    redirect("/recruteur/profil?password=updated");
  }

  redirect(`/recruteur/profil?error=${encodeURIComponent(result.message)}`);
}
