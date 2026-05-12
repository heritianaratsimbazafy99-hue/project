import { NextResponse } from "next/server";

function shortCommit() {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    "local"
  ).slice(0, 7);
}

export async function GET() {
  const supabaseUrlConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const supabaseAnonKeyConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const status = supabaseUrlConfigured && supabaseAnonKeyConfigured ? "ok" : "degraded";

  return NextResponse.json(
    {
      service: "jobmada",
      status,
      deployment: {
        commit: shortCommit(),
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local"
      },
      checks: {
        supabaseUrlConfigured,
        supabaseAnonKeyConfigured
      }
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
