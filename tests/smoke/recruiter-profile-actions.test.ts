import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  from: vi.fn(),
  updateUser: vi.fn()
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
      updateUser: mocks.updateUser
    }
  }))
}));

function profileForm(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("recruiter profile actions", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.requireRole.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.from.mockReset();
    mocks.updateUser.mockReset();
    mocks.requireRole.mockResolvedValue({
      user: { id: "recruiter-1" },
      profile: { role: "recruiter", email: "recruteur@jobmada.mg" },
      isDemo: false
    });
  });

  it("updates the authenticated recruiter profile display name and phone", async () => {
    const eq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq }));

    mocks.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return { update };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { saveRecruiterProfile } = await import("@/features/recruiter/profile-actions");
    const result = await saveRecruiterProfile(
      profileForm({
        first_name: "Rova",
        last_name: "Rakoto",
        phone: "+261 34 00 000 00"
      })
    );

    expect(result).toEqual({ ok: true, message: "Profil recruteur enregistré." });
    expect(update).toHaveBeenCalledWith({
      display_name: "Rova Rakoto",
      phone: "+261 34 00 000 00"
    });
    expect(eq).toHaveBeenCalledWith("id", "recruiter-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/recruteur/profil");
  });

  it("changes the recruiter password when confirmation matches", async () => {
    mocks.updateUser.mockResolvedValue({ error: null });

    const { changeRecruiterPassword } = await import("@/features/recruiter/profile-actions");
    const result = await changeRecruiterPassword(
      profileForm({
        password: "new-password-123",
        password_confirm: "new-password-123"
      })
    );

    expect(result).toEqual({ ok: true, message: "Mot de passe mis à jour." });
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "new-password-123" });
  });

  it("rejects password changes when confirmation does not match", async () => {
    const { changeRecruiterPassword } = await import("@/features/recruiter/profile-actions");
    const result = await changeRecruiterPassword(
      profileForm({
        password: "new-password-123",
        password_confirm: "other-password"
      })
    );

    expect(result).toEqual({
      ok: false,
      message: "Les deux mots de passe ne correspondent pas."
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
