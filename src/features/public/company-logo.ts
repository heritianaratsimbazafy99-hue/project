export function encodeStoragePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function resolvePublicStoragePath(bucket: string, path: string | null | undefined) {
  const trimmedPath = path?.trim();

  if (!trimmedPath) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmedPath) || trimmedPath.startsWith("/")) {
    return trimmedPath;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

  return supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeStoragePath(trimmedPath)}`
    : null;
}

export function resolveCompanyLogoPath(logoPath: string | null | undefined) {
  return resolvePublicStoragePath("company-logos", logoPath);
}

export function resolveCompanyCoverPath(coverPath: string | null | undefined) {
  return resolvePublicStoragePath("company-covers", coverPath);
}
