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

  it("sends edited published jobs back to moderation before public display", async () => {
    const formData = new FormData();
    formData.set("title", "Designer UI/UX senior");
    formData.set("contract", "CDI");
    formData.set("city", "Antananarivo");
    formData.set("sector", "Informatique & Digital");
    formData.set("summary", "Résumé mis à jour");
    formData.set("description", "Description mise à jour");
    formData.set("missions", "Missions mises à jour");
    formData.set("profile", "Profil mis à jour");

    const companyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: { id: "company-1", name: "Media Click" }, error: null }))
    };
    const subscriptionQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: { plan: "booster", job_quota: 10 }, error: null }))
    };
    const quotaQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      count: 1,
      error: null
    };
    const existingJobQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({
        data: { id: "job-1", status: "published", slug: "designer-uiux" },
        error: null
      }))
    };
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      error: null
    };
    let jobsCallCount = 0;

    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return companyQuery;
      }

      if (table === "subscriptions") {
        return subscriptionQuery;
      }

      if (table === "jobs") {
        jobsCallCount += 1;
        return [quotaQuery, existingJobQuery, updateQuery][jobsCallCount - 1];
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { updateRecruiterJob } = await import("@/features/jobs/actions");
    const result = await updateRecruiterJob("job-1", formData, "draft");

    expect(result).toEqual({ ok: true, message: "Offre renvoyée en revue." });
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Designer UI/UX senior",
        status: "pending_review"
      })
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/emploi/designer-uiux");
  });
});
