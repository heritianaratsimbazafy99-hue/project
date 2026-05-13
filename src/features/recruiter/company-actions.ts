"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SaveRecruiterCompanyResult = {
  ok: boolean;
  message: string;
};

type OwnedCompanyRow = {
  id: string;
  slug?: string | null;
};

const companySavePaths = [
  "/recruteur/entreprise",
  "/recruteur/dashboard",
  "/recruteur/offres/nouvelle"
] as const;
const maxCompanyImageSizeBytes = 2 * 1024 * 1024;
const allowedCompanyImageTypes = ["image/jpeg", "image/png"] as const;

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
}

function uploadedImageFile(formData: FormData, key: string) {
  const file = formData.get(key);

  return file instanceof File && file.size > 0 ? file : null;
}

function isAllowedCompanyImage(file: File) {
  return allowedCompanyImageTypes.includes(file.type as (typeof allowedCompanyImageTypes)[number]);
}

function sanitizeImageFileName(fileName: string) {
  const normalizedName = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedName || "image.png";
}

function formTextList(formData: FormData, key: string, maxItems = 8) {
  return formValue(formData, key)
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function existingGalleryPaths(formData: FormData) {
  return formData
    .getAll("career_gallery_existing")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 52) || "entreprise"
  );
}

function buildCompanySlug(companyName: string, ownerId: string) {
  const suffix = ownerId.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8) || "jobmada";
  return `${slugify(companyName)}-${suffix}`;
}

function revalidateCompanyWorkspace(slug?: string | null) {
  companySavePaths.forEach((path) => revalidatePath(path));
  if (slug) {
    revalidatePath(`/entreprises/${slug}`);
    revalidatePath(`/entreprises/${slug}/connect`);
  }
}

async function uploadCompanyImage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
  bucket: "company-logos" | "company-covers",
  file: File | null
) {
  if (!file) {
    return { ok: true as const, path: null };
  }

  if (!isAllowedCompanyImage(file)) {
    return {
      ok: false as const,
      message: "Ajoutez une image JPG ou PNG."
    };
  }

  if (file.size > maxCompanyImageSizeBytes) {
    return {
      ok: false as const,
      message: "L'image doit faire moins de 2 Mo."
    };
  }

  const path = `${companyId}/${sanitizeImageFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: true
  });

  if (error) {
    return {
      ok: false as const,
      message: "L'image n'a pas pu être envoyée."
    };
  }

  return { ok: true as const, path };
}

async function uploadCompanyAssets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
  formData: FormData
) {
  const logoUpload = await uploadCompanyImage(supabase, companyId, "company-logos", uploadedImageFile(formData, "logo"));

  if (!logoUpload.ok) {
    return logoUpload;
  }

  const coverUpload = await uploadCompanyImage(
    supabase,
    companyId,
    "company-covers",
    uploadedImageFile(formData, "cover")
  );

  if (!coverUpload.ok) {
    return coverUpload;
  }

  const galleryUpload = await uploadCompanyGallery(supabase, companyId, formData);

  if (!galleryUpload.ok) {
    return galleryUpload;
  }

  return {
    ok: true as const,
    values: {
      ...(logoUpload.path ? { logo_path: logoUpload.path } : {}),
      ...(coverUpload.path ? { cover_path: coverUpload.path } : {}),
      ...galleryUpload.values
    }
  };
}

async function uploadCompanyGallery(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
  formData: FormData
) {
  const galleryPaths = existingGalleryPaths(formData);
  const galleryFiles = ["career_gallery_1", "career_gallery_2", "career_gallery_3"]
    .map((key) => uploadedImageFile(formData, key))
    .filter((file): file is File => Boolean(file));

  if (galleryPaths.length === 0 && galleryFiles.length === 0) {
    return { ok: true as const, values: {} };
  }

  for (const file of galleryFiles) {
    if (galleryPaths.length >= 3) {
      break;
    }

    if (!isAllowedCompanyImage(file)) {
      return {
        ok: false as const,
        message: "Ajoutez des photos JPG ou PNG."
      };
    }

    if (file.size > maxCompanyImageSizeBytes) {
      return {
        ok: false as const,
        message: "Chaque photo doit faire moins de 2 Mo."
      };
    }

    const path = `${companyId}/gallery-${galleryPaths.length + 1}-${Date.now()}-${sanitizeImageFileName(file.name)}`;
    const { error } = await supabase.storage.from("company-covers").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true
    });

    if (error) {
      return {
        ok: false as const,
        message: "Une photo n'a pas pu être envoyée."
      };
    }

    galleryPaths.push(path);
  }

  return {
    ok: true as const,
    values: {
      career_gallery_paths: galleryPaths
    }
  };
}

export async function saveRecruiterCompany(formData: FormData): Promise<SaveRecruiterCompanyResult> {
  const name = formValue(formData, "name");

  if (!name) {
    return {
      ok: false,
      message: "Renseignez au minimum le nom de l'entreprise."
    };
  }

  const { user } = await requireRole(["recruiter"]);
  const supabase = await createSupabaseServerClient();
  const values = {
    name,
    sector: optionalFormValue(formData, "sector"),
    size_label: optionalFormValue(formData, "size_label"),
    city: optionalFormValue(formData, "city"),
    website: optionalFormValue(formData, "website"),
    description: optionalFormValue(formData, "description"),
    career_headline: optionalFormValue(formData, "career_headline"),
    career_intro: optionalFormValue(formData, "career_intro"),
    career_values: formTextList(formData, "career_values"),
    career_benefits: formTextList(formData, "career_benefits"),
    career_connect_enabled: formBoolean(formData, "career_connect_enabled"),
    career_connect_title: optionalFormValue(formData, "career_connect_title"),
    career_connect_description: optionalFormValue(formData, "career_connect_description")
  };

  const { data: existingCompany, error: existingCompanyError } = await supabase
    .from("companies")
    .select("id, slug")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<OwnedCompanyRow>();

  if (existingCompanyError) {
    return {
      ok: false,
      message: "Impossible de charger votre entreprise. Réessayez dans quelques instants."
    };
  }

  if (existingCompany) {
    const assetUpload = await uploadCompanyAssets(supabase, existingCompany.id, formData);

    if (!assetUpload.ok) {
      return {
        ok: false,
        message: assetUpload.message
      };
    }

    const { error } = await supabase
      .from("companies")
      .update({ ...values, ...assetUpload.values })
      .eq("id", existingCompany.id)
      .eq("owner_id", user.id);

    if (error) {
      return {
        ok: false,
        message: "Les modifications n'ont pas pu être enregistrées."
      };
    }

    revalidateCompanyWorkspace(existingCompany.slug);

    return {
      ok: true,
      message: "Profil entreprise enregistré."
    };
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      ...values,
      slug: buildCompanySlug(name, user.id),
      status: "incomplete"
    })
    .select("id, slug")
    .single<OwnedCompanyRow>();

  if (companyError || !company?.id) {
    return {
      ok: false,
      message: "L'entreprise n'a pas pu être créée."
    };
  }

  const assetUpload = await uploadCompanyAssets(supabase, company.id, formData);

  if (!assetUpload.ok) {
    return {
      ok: false,
      message: assetUpload.message
    };
  }

  if (Object.keys(assetUpload.values).length > 0) {
    const { error } = await supabase
      .from("companies")
      .update(assetUpload.values)
      .eq("id", company.id)
      .eq("owner_id", user.id);

    if (error) {
      return {
        ok: false,
        message: "Le profil est créé, mais les images n'ont pas pu être enregistrées."
      };
    }
  }

  const { error: subscriptionError } = await supabase.from("subscriptions").insert({
    company_id: company.id,
    plan: "free",
    status: "active",
    job_quota: 2,
    cv_access_enabled: false
  });

  if (subscriptionError && subscriptionError.code !== "23505") {
    return {
      ok: false,
      message: "L'entreprise est créée, mais le plan gratuit n'a pas pu être initialisé."
    };
  }

  revalidateCompanyWorkspace(company.slug);

  return {
    ok: true,
    message: "Profil entreprise enregistré."
  };
}

export async function saveRecruiterCompanyAndRedirect(formData: FormData): Promise<void> {
  const result = await saveRecruiterCompany(formData);

  if (result.ok) {
    redirect("/recruteur/entreprise?saved=1");
  }

  redirect(`/recruteur/entreprise?error=${encodeURIComponent(result.message)}`);
}

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
