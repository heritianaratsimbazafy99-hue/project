import { describe, expect, it } from "vitest";

describe("production health route", () => {
  it("reports ready when required public Supabase configuration exists without leaking values", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-public-key";
    process.env.VERCEL_GIT_COMMIT_SHA = "1234567890abcdef";

    const { GET } = await import("../../app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      service: "jobmada",
      status: "ok",
      deployment: {
        commit: "1234567"
      },
      checks: {
        supabaseUrlConfigured: true,
        supabaseAnonKeyConfigured: true
      }
    });
    expect(JSON.stringify(body)).not.toContain("project.supabase.co");
    expect(JSON.stringify(body)).not.toContain("anon-public-key");
  });
});
