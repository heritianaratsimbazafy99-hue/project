function requireValue(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getRequiredEnv(name: string): string {
  return requireValue(name, process.env[name]);
}

export const env = {
  supabaseUrl: () =>
    requireValue("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    requireValue(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
};
