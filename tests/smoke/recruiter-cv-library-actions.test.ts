import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn()
}));

vi.mock("@/lib/auth/require-role", () => ({
  requireRole: mocks.requireRole
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: mocks.from,
    storage: {
      from: mocks.storageFrom
    }
  }))
}));

function companyQuery(company: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: company, error: null }))
  };
}

function candidateQuery(candidateProfile: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: candidateProfile, error: null }))
  };
}

describe("recruiter CV library actions", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.requireRole.mockReset();
    mocks.from.mockReset();
    mocks.storageFrom.mockReset();
    mocks.requireRole.mockResolvedValue({
      user: { id: "recruiter-1" },
      profile: { role: "recruiter" },
      isDemo: false
    });
  });

  it("creates a signed CV URL only for a verified company with active CV library access", async () => {
    const company = companyQuery({
      id: "company-1",
      status: "verified",
      subscriptions: {
        plan: "agency",
        status: "active",
        job_quota: 999,
        cv_access_enabled: false
      }
    });
    const candidate = candidateQuery({
      id: "candidate-profile-1",
      user_id: "candidate-1",
      cv_path: "candidate-1/cv.pdf"
    });
    const createSignedUrl = vi.fn(async () => ({
      data: { signedUrl: "https://storage.example/candidate-1/cv.pdf?token=abc" },
      error: null
    }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return company;
      }

      if (table === "candidate_profiles") {
        return candidate;
      }

      throw new Error(`Unexpected table ${table}`);
    });
    mocks.storageFrom.mockReturnValue({ createSignedUrl });

    const { createRecruiterLibraryCvSignedUrl } = await import("@/features/recruiter/cv-library-actions");
    const result = await createRecruiterLibraryCvSignedUrl(" candidate-profile-1 ");

    expect(result).toEqual({
      ok: true,
      message: "CV prêt à consulter.",
      signedUrl: "https://storage.example/candidate-1/cv.pdf?token=abc"
    });
    expect(company.select).toHaveBeenCalledWith("id, status, subscriptions(plan, status, job_quota, cv_access_enabled)");
    expect(candidate.select).toHaveBeenCalledWith("id, user_id, cv_path");
    expect(mocks.storageFrom).toHaveBeenCalledWith("cvs");
    expect(createSignedUrl).toHaveBeenCalledWith("candidate-1/cv.pdf", 300);
  });

  it("blocks unverified recruiter companies before loading candidate CV data", async () => {
    const company = companyQuery({
      id: "company-1",
      status: "pending_review",
      subscriptions: {
        plan: "agency",
        status: "active",
        job_quota: 999,
        cv_access_enabled: false
      }
    });

    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return company;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { createRecruiterLibraryCvSignedUrl } = await import("@/features/recruiter/cv-library-actions");
    const result = await createRecruiterLibraryCvSignedUrl("candidate-profile-1");

    expect(result).toEqual({
      ok: false,
      message: "Votre plan ne donne pas accès à la CVthèque."
    });
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("rejects candidate CV paths outside the candidate owner folder before signing", async () => {
    const company = companyQuery({
      id: "company-1",
      status: "verified",
      subscriptions: {
        plan: "agency",
        status: "active",
        job_quota: 999,
        cv_access_enabled: false
      }
    });
    const candidate = candidateQuery({
      id: "candidate-profile-1",
      user_id: "candidate-1",
      cv_path: "other-candidate/cv.pdf"
    });

    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return company;
      }

      if (table === "candidate_profiles") {
        return candidate;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { createRecruiterLibraryCvSignedUrl } = await import("@/features/recruiter/cv-library-actions");
    const result = await createRecruiterLibraryCvSignedUrl("candidate-profile-1");

    expect(result).toEqual({
      ok: false,
      message: "CV candidat introuvable ou indisponible."
    });
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });
});
