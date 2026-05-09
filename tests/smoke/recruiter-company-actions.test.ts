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

function companyForm(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function setupExistingCompanyQuery(company: { id: string } | null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: company, error: null }))
  };

  return query;
}

describe("recruiter company actions", () => {
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

  it("updates the authenticated recruiter's existing company profile", async () => {
    const existingCompanyQuery = setupExistingCompanyQuery({ id: "company-1" });
    const updateChain = {
      eq: vi.fn()
    };
    const update = vi.fn(() => updateChain);

    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return {
          ...existingCompanyQuery,
          update
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });
    updateChain.eq.mockReturnValueOnce(updateChain).mockResolvedValueOnce({ error: null });

    const { saveRecruiterCompany } = await import("@/features/recruiter/company-actions");
    const result = await saveRecruiterCompany(
      companyForm({
        name: "Media Click",
        sector: "Informatique & Digital",
        city: "Antananarivo",
        website: "https://mediaclick.mg",
        description: "Studio digital malgache."
      })
    );

    expect(result).toEqual({ ok: true, message: "Profil entreprise enregistré." });
    expect(update).toHaveBeenCalledWith({
      name: "Media Click",
      sector: "Informatique & Digital",
      city: "Antananarivo",
      website: "https://mediaclick.mg",
      description: "Studio digital malgache."
    });
    expect(updateChain.eq).toHaveBeenNthCalledWith(1, "id", "company-1");
    expect(updateChain.eq).toHaveBeenNthCalledWith(2, "owner_id", "recruiter-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/recruteur/entreprise");
  });

  it("creates a company and free subscription when a recruiter has no company yet", async () => {
    const existingCompanyQuery = setupExistingCompanyQuery(null);
    const companyInsertResult = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: { id: "company-new" }, error: null }))
    };
    const insertCompany = vi.fn(() => companyInsertResult);
    const insertSubscription = vi.fn(async () => ({ error: null }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return {
          ...existingCompanyQuery,
          insert: insertCompany
        };
      }

      if (table === "subscriptions") {
        return { insert: insertSubscription };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { saveRecruiterCompany } = await import("@/features/recruiter/company-actions");
    const result = await saveRecruiterCompany(
      companyForm({
        name: "1Talent Pour Vous",
        sector: "Ressources humaines",
        city: "Antananarivo",
        website: "",
        description: ""
      })
    );

    expect(result.ok).toBe(true);
    expect(insertCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: "recruiter-1",
        name: "1Talent Pour Vous",
        slug: "1talent-pour-vous-recruite",
        status: "incomplete"
      })
    );
    expect(insertSubscription).toHaveBeenCalledWith({
      company_id: "company-new",
      plan: "free",
      status: "active",
      job_quota: 2,
      cv_access_enabled: false
    });
  });

  it("rejects incomplete company profiles before writing to Supabase", async () => {
    const { saveRecruiterCompany } = await import("@/features/recruiter/company-actions");
    const result = await saveRecruiterCompany(
      companyForm({
        name: "",
        sector: "Informatique & Digital",
        city: "Antananarivo"
      })
    );

    expect(result).toEqual({
      ok: false,
      message: "Renseignez au minimum le nom de l'entreprise."
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
