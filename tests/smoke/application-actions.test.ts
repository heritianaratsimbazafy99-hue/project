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

describe("application actions", () => {
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

  it("updates a recruiter-owned application status and refreshes recruiter pages", async () => {
    const maybeSingle = vi.fn(async () => ({ data: { id: "application-1" }, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));

    mocks.from.mockReturnValue({ update });

    const { updateRecruiterApplicationStatus } = await import("@/features/applications/actions");
    const result = await updateRecruiterApplicationStatus(" application-1 ", " shortlisted ");

    expect(result).toEqual({ ok: true, message: "Statut de candidature mis à jour." });
    expect(mocks.requireRole).toHaveBeenCalledWith(["recruiter"]);
    expect(mocks.from).toHaveBeenCalledWith("applications");
    expect(update).toHaveBeenCalledWith({ status: "shortlisted" });
    expect(eq).toHaveBeenCalledWith("id", "application-1");
    expect(select).toHaveBeenCalledWith("id");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/recruteur/candidatures");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/recruteur/dashboard");
  });

  it("rejects unsupported recruiter status changes before writing", async () => {
    const { updateRecruiterApplicationStatus } = await import("@/features/applications/actions");
    const result = await updateRecruiterApplicationStatus("application-1", "submitted");

    expect(result).toEqual({ ok: false, message: "Statut de candidature invalide." });
    expect(mocks.requireRole).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("reports missing or unauthorized applications", async () => {
    const maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));

    mocks.from.mockReturnValue({ update });

    const { updateRecruiterApplicationStatus } = await import("@/features/applications/actions");
    const result = await updateRecruiterApplicationStatus("application-1", "viewed");

    expect(result).toEqual({
      ok: false,
      message: "Candidature introuvable ou non autorisée."
    });
  });
});
