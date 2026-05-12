import { beforeEach, describe, expect, it, vi } from "vitest";

const queryResult = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => queryResult())
    }))
  }))
}));

describe("public job query resilience", () => {
  beforeEach(() => {
    queryResult.mockReset();
  });

  it("returns an empty list instead of throwing when Supabase cannot load jobs", async () => {
    const { getPublishedJobsOrEmpty } = await import("@/features/jobs/queries");

    queryResult.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(async () => ({
        data: null,
        error: { message: "fetch failed" }
      }))
    });

    await expect(
      getPublishedJobsOrEmpty({ query: "", contract: [], city: [], sector: "" })
    ).resolves.toEqual([]);
  });

  it("returns null instead of throwing when Supabase cannot load one public job", async () => {
    const { getPublishedJobBySlugOrNull } = await import("@/features/jobs/queries");

    queryResult.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({
        data: null,
        error: { message: "fetch failed" }
      }))
    });

    await expect(getPublishedJobBySlugOrNull("designer-ui")).resolves.toBeNull();
  });
});
