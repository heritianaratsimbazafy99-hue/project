import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  authUpdateUser: vi.fn(),
  parseCandidateCvFile: vi.fn()
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
    auth: {
      updateUser: mocks.authUpdateUser
    },
    storage: {
      from: mocks.storageFrom
    }
  }))
}));

vi.mock("@/features/candidate/cv-parser", () => ({
  parseCandidateCvFile: mocks.parseCandidateCvFile
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
    mocks.authUpdateUser.mockReset();
    mocks.parseCandidateCvFile.mockReset();
    mocks.requireRole.mockResolvedValue({
      user: { id: "candidate-1", email: "hery@example.com" },
      profile: { role: "candidate", email: "hery@example.com" },
      isDemo: false
    });
    mocks.parseCandidateCvFile.mockResolvedValue({
      source: "fallback",
      desiredRole: null,
      city: null,
      sector: null,
      hardSkills: [],
      softSkills: [],
      languages: [],
      summary: null
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

  it("parses a candidate CV and persists extracted matching signals", async () => {
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(1778339000000);
    const upload = vi.fn(async () => ({ error: null }));
    mocks.storageFrom.mockReturnValue({ upload });
    mocks.parseCandidateCvFile.mockResolvedValue({
      source: "openai",
      desiredRole: "Développeur React",
      city: "Antananarivo",
      sector: "Informatique & Digital",
      hardSkills: ["React", "TypeScript", "SQL"],
      softSkills: ["Rigueur"],
      languages: ["Français", "Anglais"],
      summary: "Profil React orienté dashboard et bases SQL."
    });

    const candidateMaybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: "profile-1", desired_role: null, city: null, sector: null }, error: null })
      .mockResolvedValueOnce({ data: { id: "profile-1" }, error: null });
    const candidateSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: candidateMaybeSingle
    };
    const alertsCount = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(async () => ({ count: 0, error: null }))
    };
    const candidateUpsert = vi.fn(async () => ({ error: null }));
    const profileUpdateEq = vi.fn(async () => ({ error: null }));
    const profileUpdate = vi.fn(() => ({ eq: profileUpdateEq }));
    const skillsUpsert = vi.fn(async () => ({ error: null }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "candidate_profiles") {
        return {
          ...candidateSelect,
          upsert: candidateUpsert
        };
      }

      if (table === "candidate_skills") {
        return { upsert: skillsUpsert };
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
    const file = new File(["fake pdf"], "cv-react.pdf", { type: "application/pdf" });
    formData.set("cv", file);

    const { uploadCandidateCv } = await import("@/features/candidate/actions");
    const result = await uploadCandidateCv(formData);

    expect(result).toEqual({ ok: true, message: "CV enregistré." });
    expect(mocks.parseCandidateCvFile).toHaveBeenCalledWith(file);
    expect(candidateUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "candidate-1",
        cv_path: "candidate-1/1778339000000-cv-react.pdf",
        desired_role: "Développeur React",
        city: "Antananarivo",
        sector: "Informatique & Digital",
        cv_parse_source: "openai",
        cv_parse_summary: "Profil React orienté dashboard et bases SQL.",
        profile_completion: 75
      }),
      { onConflict: "user_id" }
    );
    const parsedUpsertPayload = (
      candidateUpsert.mock.calls as unknown as Array<[{ cv_parsed_at?: unknown }, unknown]>
    )[0]?.[0];

    expect(parsedUpsertPayload?.cv_parsed_at).toEqual(expect.any(String));
    expect(skillsUpsert).toHaveBeenCalledWith(
      [
        { candidate_profile_id: "profile-1", kind: "hard", label: "React", level: null },
        { candidate_profile_id: "profile-1", kind: "hard", label: "TypeScript", level: null },
        { candidate_profile_id: "profile-1", kind: "hard", label: "SQL", level: null },
        { candidate_profile_id: "profile-1", kind: "soft", label: "Rigueur", level: null },
        { candidate_profile_id: "profile-1", kind: "language", label: "Français", level: null },
        { candidate_profile_id: "profile-1", kind: "language", label: "Anglais", level: null }
      ],
      { onConflict: "candidate_profile_id,kind,label" }
    );
    expect(profileUpdate).toHaveBeenCalledWith({ onboarding_completion: 75 });

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

  it("adds an experience to the authenticated candidate profile", async () => {
    const profileMaybeSingle = vi.fn(async () => ({ data: { id: "profile-1" }, error: null }));
    const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = vi.fn(() => ({ eq: profileEq }));
    const insertExperience = vi.fn(async () => ({ error: null }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "candidate_profiles") {
        return { select: profileSelect };
      }

      if (table === "candidate_experiences") {
        return { insert: insertExperience };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { addCandidateExperience } = await import("@/features/candidate/actions");
    const result = await addCandidateExperience(
      candidateForm({
        title: "Designer UI/UX",
        company: "Media Click",
        city: "Antananarivo",
        start_date: "2024-01-01",
        end_date: "2025-02-01",
        description: "Design produit et recherche utilisateur."
      })
    );

    expect(result).toEqual({ ok: true, message: "Expérience ajoutée." });
    expect(profileEq).toHaveBeenCalledWith("user_id", "candidate-1");
    expect(insertExperience).toHaveBeenCalledWith({
      candidate_profile_id: "profile-1",
      title: "Designer UI/UX",
      company: "Media Click",
      city: "Antananarivo",
      start_date: "2024-01-01",
      end_date: "2025-02-01",
      is_current: false,
      description: "Design produit et recherche utilisateur."
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/candidat/profil");
  });

  it("replaces candidate skills from multiline skill and language fields", async () => {
    const profileMaybeSingle = vi.fn(async () => ({ data: { id: "profile-1" }, error: null }));
    const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = vi.fn(() => ({ eq: profileEq }));
    const deleteInKind = vi.fn(async () => ({ error: null }));
    const deleteEqProfile = vi.fn(() => ({ in: deleteInKind }));
    const deleteSkills = vi.fn(() => ({ eq: deleteEqProfile }));
    const upsertSkills = vi.fn(async () => ({ error: null }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "candidate_profiles") {
        return { select: profileSelect };
      }

      if (table === "candidate_skills") {
        return { delete: deleteSkills, upsert: upsertSkills };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { saveCandidateSkills } = await import("@/features/candidate/actions");
    const result = await saveCandidateSkills(
      candidateForm({
        hard_skills: "React\nSQL, Excel",
        soft_skills: "Rigueur\nRelation client",
        languages: "Français\nAnglais"
      })
    );

    expect(result).toEqual({ ok: true, message: "Compétences enregistrées." });
    expect(deleteEqProfile).toHaveBeenCalledWith("candidate_profile_id", "profile-1");
    expect(deleteInKind).toHaveBeenCalledWith("kind", ["hard", "soft", "language"]);
    expect(upsertSkills).toHaveBeenCalledWith(
      [
        { candidate_profile_id: "profile-1", kind: "hard", label: "React", level: null },
        { candidate_profile_id: "profile-1", kind: "hard", label: "SQL", level: null },
        { candidate_profile_id: "profile-1", kind: "hard", label: "Excel", level: null },
        { candidate_profile_id: "profile-1", kind: "soft", label: "Rigueur", level: null },
        { candidate_profile_id: "profile-1", kind: "soft", label: "Relation client", level: null },
        { candidate_profile_id: "profile-1", kind: "language", label: "Français", level: null },
        { candidate_profile_id: "profile-1", kind: "language", label: "Anglais", level: null }
      ],
      { onConflict: "candidate_profile_id,kind,label" }
    );
  });

  it("removes the current candidate CV and recalculates completion", async () => {
    const remove = vi.fn(async () => ({ error: null }));
    mocks.storageFrom.mockReturnValue({ remove });

    const candidateSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({
        data: { cv_path: "candidate-1/cv.pdf", desired_role: "Designer UI/UX" },
        error: null
      }))
    };
    const alertsCount = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(async () => ({ count: 1, error: null }))
    };
    const candidateUpdateEq = vi.fn(async () => ({ error: null }));
    const candidateUpdate = vi.fn(() => ({ eq: candidateUpdateEq }));
    const profileUpdateEq = vi.fn(async () => ({ error: null }));
    const profileUpdate = vi.fn(() => ({ eq: profileUpdateEq }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "candidate_profiles") {
        return {
          ...candidateSelect,
          update: candidateUpdate
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

    const { deleteCandidateCv } = await import("@/features/candidate/actions");
    const result = await deleteCandidateCv();

    expect(result).toEqual({ ok: true, message: "CV supprimé." });
    expect(remove).toHaveBeenCalledWith(["candidate-1/cv.pdf"]);
    expect(candidateUpdate).toHaveBeenCalledWith({ cv_path: null, profile_completion: 75 });
    expect(candidateUpdateEq).toHaveBeenCalledWith("user_id", "candidate-1");
    expect(profileUpdate).toHaveBeenCalledWith({ onboarding_completion: 75 });
  });

  it("updates a job alert only when it belongs to the authenticated candidate", async () => {
    const updateEqCandidate = vi.fn(async () => ({ error: null }));
    const updateEqId = vi.fn(() => ({ eq: updateEqCandidate }));
    const updateAlert = vi.fn(() => ({ eq: updateEqId }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "job_alerts") {
        return { update: updateAlert };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { updateCandidateJobAlertStatus } = await import("@/features/candidate/actions");
    const result = await updateCandidateJobAlertStatus(
      candidateForm({
        alert_id: "alert-1",
        is_active: "false"
      })
    );

    expect(result).toEqual({ ok: true, message: "Alerte mise en pause." });
    expect(updateAlert).toHaveBeenCalledWith({ is_active: false });
    expect(updateEqId).toHaveBeenCalledWith("id", "alert-1");
    expect(updateEqCandidate).toHaveBeenCalledWith("candidate_id", "candidate-1");
  });

  it("deletes a job alert only when it belongs to the authenticated candidate", async () => {
    const deleteEqCandidate = vi.fn(async () => ({ error: null }));
    const deleteEqId = vi.fn(() => ({ eq: deleteEqCandidate }));
    const deleteAlert = vi.fn(() => ({ eq: deleteEqId }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "job_alerts") {
        return { delete: deleteAlert };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { deleteCandidateJobAlert } = await import("@/features/candidate/actions");
    const result = await deleteCandidateJobAlert(candidateForm({ alert_id: "alert-1" }));

    expect(result).toEqual({ ok: true, message: "Alerte supprimée." });
    expect(deleteEqId).toHaveBeenCalledWith("id", "alert-1");
    expect(deleteEqCandidate).toHaveBeenCalledWith("candidate_id", "candidate-1");
  });

  it("updates the authenticated candidate password through Supabase Auth", async () => {
    mocks.authUpdateUser.mockResolvedValue({ error: null });

    const { updateCandidatePassword } = await import("@/features/candidate/actions");
    const result = await updateCandidatePassword(
      candidateForm({
        password: "nouveau-secret-2026",
        password_confirm: "nouveau-secret-2026"
      })
    );

    expect(result).toEqual({ ok: true, message: "Mot de passe mis à jour." });
    expect(mocks.authUpdateUser).toHaveBeenCalledWith({ password: "nouveau-secret-2026" });
  });
});
