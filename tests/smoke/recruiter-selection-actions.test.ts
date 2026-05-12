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

describe("recruiter selection actions", () => {
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

  it("persists a visible candidate in the recruiter selection by shortlisting its application", async () => {
    const maybeSingle = vi.fn(async () => ({ data: { id: "application-1" }, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn().mockReturnThis();
    const update = vi.fn(() => ({ eq, select }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "applications") {
        return { update };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { saveCandidateToRecruiterSelection } = await import("@/features/recruiter/selection-actions");
    const result = await saveCandidateToRecruiterSelection(" application-1 ");

    expect(result).toEqual({ ok: true, message: "Candidat ajouté à votre sélection." });
    expect(update).toHaveBeenCalledWith({ status: "shortlisted" });
    expect(eq).toHaveBeenCalledWith("id", "application-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/recruteur/selection");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/recruteur/candidatures");
  });

  it("removes a selected candidate by returning its application to viewed", async () => {
    const maybeSingle = vi.fn(async () => ({ data: { id: "application-1" }, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn().mockReturnThis();
    const update = vi.fn(() => ({ eq, select }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "applications") {
        return { update };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { removeCandidateFromRecruiterSelection } = await import("@/features/recruiter/selection-actions");
    const result = await removeCandidateFromRecruiterSelection("application-1");

    expect(result).toEqual({ ok: true, message: "Candidat retiré de votre sélection." });
    expect(update).toHaveBeenCalledWith({ status: "viewed" });
  });
});
