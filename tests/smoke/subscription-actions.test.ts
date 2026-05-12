import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  from: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  })
}));

vi.mock("@/lib/auth/require-role", () => ({
  requireRole: mocks.requireRole
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: mocks.from
  }))
}));

function setupCompanyQuery(company: { id: string } | null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: company, error: null }))
  };
}

describe("subscription actions", () => {
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

  it("creates an auditable plan change request instead of updating entitlements directly", async () => {
    const companyQuery = setupCompanyQuery({ id: "company-1" });
    const insert = vi.fn(async () => ({ error: null }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return companyQuery;
      }

      if (table === "plan_change_requests") {
        return { insert };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { requestSubscriptionPlan } = await import("@/features/subscriptions/actions");
    const result = await requestSubscriptionPlan("booster");

    expect(result).toEqual({
      ok: true,
      message: "Votre demande de plan Booster est transmise à l'équipe JobMada."
    });
    expect(insert).toHaveBeenCalledWith({
      company_id: "company-1",
      requested_plan: "booster",
      requested_by: "recruiter-1",
      status: "pending"
    });
    expect(mocks.from).not.toHaveBeenCalledWith("subscriptions");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/abonnements");
  });

  it("rejects unknown plans before writing to Supabase", async () => {
    const { requestSubscriptionPlan } = await import("@/features/subscriptions/actions");
    const result = await requestSubscriptionPlan("enterprise");

    expect(result).toEqual({
      ok: false,
      message: "Plan demandé invalide."
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("admin approval updates the subscription and closes the request", async () => {
    mocks.requireRole.mockResolvedValue({
      user: { id: "admin-1" },
      profile: { role: "admin" },
      isDemo: false
    });

    const requestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({
        data: {
          id: "request-1",
          company_id: "company-1",
          requested_plan: "starter",
          status: "pending"
        },
        error: null
      }))
    };
    const upsert = vi.fn(async () => ({ error: null }));
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(async () => ({ error: null }))
    };

    mocks.from.mockImplementation((table: string) => {
      if (table === "plan_change_requests") {
        return requestQuery.select.mock.calls.length === 0 ? requestQuery : updateQuery;
      }

      if (table === "subscriptions") {
        return { upsert };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { reviewPlanChangeRequest } = await import("@/features/subscriptions/actions");
    const result = await reviewPlanChangeRequest("request-1", "approve");

    expect(result).toEqual({ ok: true, message: "Plan approuvé." });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        plan: "starter",
        status: "active",
        job_quota: 10,
        cv_access_enabled: false
      }),
      { onConflict: "company_id" }
    );
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        reviewed_by: "admin-1"
      })
    );
  });
});
