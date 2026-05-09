import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
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
    mocks.storageFrom.mockReset();
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

  it("creates an authenticated candidate job alert", async () => {
    const insertAlert = vi.fn(async () => ({ error: null }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "job_alerts") {
        return { insert: insertAlert };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { createCandidateJobAlert } = await import("@/features/candidate/actions");
    const result = await createCandidateJobAlert(
      candidateForm({
        query: "Designer UI/UX",
        sector: "Informatique & Digital",
        city: "Antananarivo",
        contract: "CDI",
        frequency: "daily"
      })
    );

    expect(result).toEqual({ ok: true, message: "Alerte emploi créée." });
    expect(insertAlert).toHaveBeenCalledWith({
      candidate_id: "candidate-1",
      query: "Designer UI/UX",
      sector: "Informatique & Digital",
      city: "Antananarivo",
      contract: "CDI",
      frequency: "daily",
      is_active: true
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/candidat/alertes");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/candidat/dashboard");
  });

  it("uploads a candidate CV to private storage and saves the path", async () => {
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(1778338000000);
    const upload = vi.fn(async () => ({ error: null }));
    mocks.storageFrom.mockReturnValue({ upload });

    const candidateSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: { desired_role: "Designer UI/UX" }, error: null }))
    };
    const alertsCount = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(async () => ({ count: 1, error: null }))
    };
    const candidateUpsert = vi.fn(async () => ({ error: null }));
    const profileUpdateEq = vi.fn(async () => ({ error: null }));
    const profileUpdate = vi.fn(() => ({ eq: profileUpdateEq }));

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

    const formData = new FormData();
    formData.set("cv", new File(["fake pdf"], "Mon CV.pdf", { type: "application/pdf" }));

    const { uploadCandidateCv } = await import("@/features/candidate/actions");
    const result = await uploadCandidateCv(formData);

    expect(result).toEqual({ ok: true, message: "CV enregistré." });
    expect(mocks.storageFrom).toHaveBeenCalledWith("cvs");
    expect(upload).toHaveBeenCalledWith(
      "candidate-1/1778338000000-mon-cv.pdf",
      expect.any(File),
      expect.objectContaining({ contentType: "application/pdf", upsert: true })
    );
    expect(candidateUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "candidate-1",
        cv_path: "candidate-1/1778338000000-mon-cv.pdf",
        profile_completion: 100
      }),
      { onConflict: "user_id" }
    );
    expect(profileUpdate).toHaveBeenCalledWith({ onboarding_completion: 100 });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/candidat/profil");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/candidat/dashboard");

    dateSpy.mockRestore();
  });

  it("rejects unsupported CV files before uploading", async () => {
    const formData = new FormData();
    formData.set("cv", new File(["plain text"], "cv.txt", { type: "text/plain" }));

    const { uploadCandidateCv } = await import("@/features/candidate/actions");
    const result = await uploadCandidateCv(formData);

    expect(result).toEqual({
      ok: false,
      message: "Ajoutez un CV au format PDF, DOC ou DOCX."
    });
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });
});
