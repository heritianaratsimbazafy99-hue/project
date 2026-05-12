import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieDelete: vi.fn(),
  getUser: vi.fn(),
  headersGet: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  resetPasswordForEmail: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    delete: mocks.cookieDelete,
    getAll: vi.fn(() => []),
    set: vi.fn()
  })),
  headers: vi.fn(async () => ({
    get: mocks.headersGet
  }))
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signOut: mocks.signOut,
      updateUser: mocks.updateUser
    }
  }))
}));

function form(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("password reset flow", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.cookieDelete.mockReset();
    mocks.getUser.mockReset();
    mocks.headersGet.mockReset();
    mocks.redirect.mockClear();
    mocks.resetPasswordForEmail.mockReset();
    mocks.signOut.mockReset();
    mocks.updateUser.mockReset();
    mocks.headersGet.mockImplementation((name: string) => (name === "origin" ? "https://app.jobmada.mg" : null));
  });

  it("asks Supabase to send a password reset email with the app callback URL", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    const { sendPasswordResetEmail } = await import("@/features/auth/actions");

    await expect(sendPasswordResetEmail(form({ email: " Hery@Example.com " }))).rejects.toThrow(
      "NEXT_REDIRECT:/connexion?reset=sent"
    );

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("hery@example.com", {
      redirectTo: "https://app.jobmada.mg/auth/callback?next=/connexion/reinitialiser"
    });
  });

  it("updates the recovery session password and signs the user out", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });

    const { updatePasswordFromRecovery } = await import("@/features/auth/actions");

    await expect(
      updatePasswordFromRecovery(
        form({
          password: "nouveau-secret-2026",
          password_confirm: "nouveau-secret-2026"
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/connexion?reset=updated");

    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "nouveau-secret-2026" });
    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.cookieDelete).toHaveBeenCalledWith("jobmada_demo_session");
  });

  it("rejects mismatched recovery passwords before calling Supabase", async () => {
    const { updatePasswordFromRecovery } = await import("@/features/auth/actions");

    await expect(
      updatePasswordFromRecovery(
        form({
          password: "nouveau-secret-2026",
          password_confirm: "autre-secret-2026"
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/connexion/reinitialiser?error=mismatch");

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
