export function encodeStoragePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function resolveCompanyLogoPath(logoPath: string | null | undefined) {
  const trimmedPath = logoPath?.trim();

  if (!trimmedPath) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmedPath) || trimmedPath.startsWith("/")) {
    return trimmedPath;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

  return supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/company-logos/${encodeStoragePath(trimmedPath)}`
    : null;
}
