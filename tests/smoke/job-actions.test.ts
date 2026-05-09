import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  from: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

vi.mock("@/lib/auth/require-role", () => ({
  requireRole: mocks.requireRole
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: mocks.from
  }))
}));

describe("job actions", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.requireRole.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.from.mockReset();
    mocks.requireRole.mockResolvedValue({
      user: { id: "recruiter-1" },
      profile: { role: "recruiter" },
      isDemo: false
    });
  });

  it("archives a recruiter-owned job and refreshes recruiter pages", async () => {
    const maybeSingle = vi.fn(async () => ({ data: { id: "job-1" }, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));

    mocks.from.mockReturnValue({ update });

    const { archiveRecruiterJob } = await import("@/features/jobs/actions");
    const result = await archiveRecruiterJob(" job-1 ");

    expect(result).toEqual({ ok: true, message: "Offre archivée." });
    expect(mocks.requireRole).toHaveBeenCalledWith(["recruiter"]);
    expect(update).toHaveBeenCalledWith({ status: "archived" });
    expect(eq).toHaveBeenCalledWith("id", "job-1");
    expect(select).toHaveBeenCalledWith("id");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/recruteur/offres");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/recruteur/dashboard");
  });

  it("rejects empty job ids before writing", async () => {
    const { archiveRecruiterJob } = await import("@/features/jobs/actions");
    const result = await archiveRecruiterJob(" ");

    expect(result).toEqual({ ok: false, message: "Offre introuvable." });
    expect(mocks.requireRole).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
