import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  signUp: vi.fn(),
  from: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signUp: mocks.signUp
    },
    from: mocks.from
  }))
}));

function signupForm(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function setupTables() {
  const profileUpsert = vi.fn(async () => ({ error: null }));
  const candidateUpsert = vi.fn(async () => ({ error: null }));
  const companySelect = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: null, error: null }))
  };
  const companyInsert = {
    select: vi.fn().mockReturnThis(),
    single: vi.fn(async () => ({ data: { id: "company-1" }, error: null }))
  };
  const companyTable = {
    select: companySelect.select,
    eq: companySelect.eq,
    order: companySelect.order,
    limit: companySelect.limit,
    maybeSingle: companySelect.maybeSingle,
    insert: vi.fn(() => companyInsert)
  };
  const subscriptionInsert = vi.fn(async () => ({ error: null }));

  mocks.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return { upsert: profileUpsert };
    }

    if (table === "candidate_profiles") {
      return { upsert: candidateUpsert };
    }

    if (table === "companies") {
      return companyTable;
    }

    if (table === "subscriptions") {
      return { insert: subscriptionInsert };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return {
    profileUpsert,
    candidateUpsert,
    companyTable,
    companyInsert,
    subscriptionInsert
  };
}

describe("real signup onboarding", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.redirect.mockClear();
    mocks.signUp.mockReset();
    mocks.from.mockReset();
  });

  it("creates a candidate auth user and workspace before opening the candidate area", async () => {
    const tables = setupTables();
    mocks.signUp.mockResolvedValue({
      data: {
        user: { id: "user-candidate", email: "hery@example.com" },
        session: { access_token: "token" }
      },
      error: null
    });

    const { signUpWithPassword } = await import("@/features/auth/actions");

    await expect(
      signUpWithPassword(
        signupForm({
          account_type: "candidate",
          first_name: "Hery",
          last_name: "Ranaivo",
          email: "hery@example.com",
          password: "password-123",
          desired_role: "Designer UI/UX"
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/candidat/dashboard");

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "hery@example.com",
      password: "password-123",
      options: {
        data: expect.objectContaining({
          role: "candidate",
          display_name: "Hery Ranaivo",
          desired_role: "Designer UI/UX"
        })
      }
    });
    expect(tables.profileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-candidate",
        role: "candidate",
        display_name: "Hery Ranaivo"
      }),
      { onConflict: "id" }
    );
    expect(tables.candidateUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-candidate",
        desired_role: "Designer UI/UX"
      }),
      { onConflict: "user_id" }
    );
  });

  it("creates a recruiter auth user, company, and free subscription", async () => {
    const tables = setupTables();
    mocks.signUp.mockResolvedValue({
      data: {
        user: { id: "aabbccdd-0000-4000-9000-000000000000", email: "rivo@media.mg" },
        session: { access_token: "token" }
      },
      error: null
    });

    const { signUpWithPassword } = await import("@/features/auth/actions");

    await expect(
      signUpWithPassword(
        signupForm({
          account_type: "recruiter",
          company_name: "Media Click",
          first_name: "Rivo",
          last_name: "Rakoto",
          email: "rivo@media.mg",
          password: "password-123"
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/recruteur/dashboard");

    expect(tables.companyTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: "aabbccdd-0000-4000-9000-000000000000",
        name: "Media Click",
        slug: "media-click-aabbccdd",
        status: "incomplete"
      })
    );
    expect(tables.subscriptionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        plan: "free",
        status: "active",
        job_quota: 2,
        cv_access_enabled: false
      })
    );
  });

  it("sends users to login confirmation when Supabase requires email verification", async () => {
    setupTables();
    mocks.signUp.mockResolvedValue({
      data: {
        user: { id: "pending-user", email: "pending@example.com" },
        session: null
      },
      error: null
    });

    const { signUpWithPassword } = await import("@/features/auth/actions");

    await expect(
      signUpWithPassword(
        signupForm({
          account_type: "candidate",
          first_name: "Pending",
          last_name: "User",
          email: "pending@example.com",
          password: "password-123"
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/connexion?signup=check-email&type=candidat");
  });

  it("rejects incomplete signup forms before reaching Supabase", async () => {
    setupTables();

    const { signUpWithPassword } = await import("@/features/auth/actions");

    await expect(
      signUpWithPassword(
        signupForm({
          account_type: "recruiter",
          first_name: "Rivo",
          last_name: "Rakoto",
          email: "rivo@media.mg",
          password: "short"
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/inscription/recruteur?error=missing");
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
});
