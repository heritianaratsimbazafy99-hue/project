import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser
    },
    from: mocks.from
  }))
}));

function queryResult<T>(data: T, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data, error }))
  };
}

describe("candidate job apply state", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getUser.mockReset();
    mocks.from.mockReset();
  });

  it("returns guest when nobody is authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { getCandidateApplyState } = await import("@/features/applications/apply-state");
    await expect(getCandidateApplyState("job-1")).resolves.toEqual({ state: "guest" });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns ready when a candidate has a CV and has not applied yet", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "candidate-1" } }, error: null });
    const profile = queryResult({ role: "candidate" });
    const candidateProfile = queryResult({ cv_path: "candidate-1/cv.pdf" });
    const application = queryResult(null);

    mocks.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return profile;
      }

      if (table === "candidate_profiles") {
        return candidateProfile;
      }

      if (table === "applications") {
        return application;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { getCandidateApplyState } = await import("@/features/applications/apply-state");
    await expect(getCandidateApplyState("job-1")).resolves.toEqual({
      state: "ready",
      cvPath: "candidate-1/cv.pdf"
    });
    expect(application.eq).toHaveBeenNthCalledWith(1, "job_id", "job-1");
    expect(application.eq).toHaveBeenNthCalledWith(2, "candidate_id", "candidate-1");
  });

  it("returns already_applied when the candidate has an existing application", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "candidate-1" } }, error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return queryResult({ role: "candidate" });
      }

      if (table === "candidate_profiles") {
        return queryResult({ cv_path: "candidate-1/cv.pdf" });
      }

      if (table === "applications") {
        return queryResult({ id: "application-1" });
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { getCandidateApplyState } = await import("@/features/applications/apply-state");
    await expect(getCandidateApplyState("job-1")).resolves.toEqual({
      state: "already_applied",
      applicationId: "application-1"
    });
  });

  it("returns missing_cv when the candidate profile has no CV path", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "candidate-1" } }, error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return queryResult({ role: "candidate" });
      }

      if (table === "candidate_profiles") {
        return queryResult({ cv_path: null });
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { getCandidateApplyState } = await import("@/features/applications/apply-state");
    await expect(getCandidateApplyState("job-1")).resolves.toEqual({ state: "missing_cv" });
  });

  it("throws Supabase read errors instead of treating them as missing profile data", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "candidate-1" } }, error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return queryResult(null, { message: "profiles unavailable" });
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { getCandidateApplyState } = await import("@/features/applications/apply-state");
    await expect(getCandidateApplyState("job-1")).rejects.toThrow("profiles unavailable");
  });
});
