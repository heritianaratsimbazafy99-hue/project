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

function candidateForm(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("candidate profile actions", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.requireRole.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.from.mockReset();
    mocks.requireRole.mockResolvedValue({
      user: { id: "candidate-1", email: "hery@example.com" },
      profile: { role: "candidate", email: "hery@example.com" },
      isDemo: false
    });
  });

  it("saves the authenticated candidate profile and refreshes onboarding completion", async () => {
    const candidateSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: { cv_path: "candidate-1/cv.pdf" }, error: null }))
    };
    const alertsCount = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(async () => ({ count: 1, error: null }))
    };
    const profileUpdateEq = vi.fn(async () => ({ error: null }));
    const profileUpdate = vi.fn(() => ({ eq: profileUpdateEq }));
    const candidateUpsert = vi.fn(async () => ({ error: null }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "candidate_profiles") {
        return {
          ...candidateSelect,
          upsert: candidateUpsert
        };
      }

      if (table === "profiles") {
        return { update: profileUpdate };
      }

      if (table === "job_alerts") {
        return alertsCount;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { saveCandidateProfile } = await import("@/features/candidate/actions");
    const result = await saveCandidateProfile(
      candidateForm({
        first_name: "Hery",
        last_name: "Ranaivo",
        phone: "+261 34 00 000 00",
        city: "Antananarivo",
        sector: "Informatique & Digital",
        desired_role: "Designer UI/UX",
        salary_expectation: "1 200 000 Ar"
      })
    );

    expect(result).toEqual({ ok: true, message: "Profil candidat enregistré." });
    expect(candidateUpsert).toHaveBeenCalledWith(
      {
        user_id: "candidate-1",
        first_name: "Hery",
        last_name: "Ranaivo",
        city: "Antananarivo",
        sector: "Informatique & Digital",
        desired_role: "Designer UI/UX",
        salary_expectation: "1 200 000 Ar",
        profile_completion: 100
      },
      { onConflict: "user_id" }
    );
    expect(profileUpdate).toHaveBeenCalledWith({
      display_name: "Hery Ranaivo",
      phone: "+261 34 00 000 00",
      onboarding_completion: 100
    });
    expect(profileUpdateEq).toHaveBeenCalledWith("id", "candidate-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/candidat/profil");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/candidat/dashboard");
  });
});
