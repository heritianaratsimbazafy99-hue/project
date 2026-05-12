import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn()
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
    from: mocks.from,
    rpc: mocks.rpc
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
    mocks.rpc.mockReset();
    mocks.requireRole.mockResolvedValue({
      user: { id: "recruiter-1" },
      profile: { role: "recruiter" },
      isDemo: false
    });
  });

  it("creates an auditable plan change request instead of updating entitlements directly", async () => {
    const companyQuery = setupCompanyQuery({ id: "company-1" });
    const pendingRequestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: null, error: null }))
    };
    const insert = vi.fn(async () => ({ error: null }));
    let requestCallCount = 0;

    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return companyQuery;
      }

      if (table === "plan_change_requests") {
        requestCallCount += 1;
        return requestCallCount === 1 ? pendingRequestQuery : { insert };
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

  it("does not create a duplicate pending request for the same company and plan", async () => {
    const companyQuery = setupCompanyQuery({ id: "company-1" });
    const pendingRequestQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: { id: "request-1" }, error: null }))
    };
    const insert = vi.fn(async () => ({ error: null }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return companyQuery;
      }

      if (table === "plan_change_requests") {
        return { ...pendingRequestQuery, insert };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { requestSubscriptionPlan } = await import("@/features/subscriptions/actions");
    const result = await requestSubscriptionPlan("booster");

    expect(result).toEqual({
      ok: false,
      message: "Une demande pour ce plan est déjà en attente."
    });
    expect(insert).not.toHaveBeenCalled();
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

  it("admin approval delegates plan changes to a transactional RPC", async () => {
    mocks.requireRole.mockResolvedValue({
      user: { id: "admin-1" },
      profile: { role: "admin" },
      isDemo: false
    });

    mocks.rpc.mockResolvedValue({ error: null });

    const { reviewPlanChangeRequest } = await import("@/features/subscriptions/actions");
    const result = await reviewPlanChangeRequest("request-1", "approve");

    expect(result).toEqual({ ok: true, message: "Plan approuvé." });
    expect(mocks.rpc).toHaveBeenCalledWith("review_plan_change_request", {
      request_uuid: "request-1",
      review_decision: "approve",
      review_note: null
    });
    expect(mocks.from).not.toHaveBeenCalledWith("subscriptions");
  });
});
