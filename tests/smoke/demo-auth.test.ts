import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  signInWithPassword: vi.fn(),
  getUser: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
    getAll: vi.fn(() => []),
    set: mocks.cookieSet,
    setAll: vi.fn()
  }))
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      signInWithPassword: mocks.signInWithPassword
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: null, error: { message: "no profile" } }))
    }))
  }))
}));

function credentials(email: string, password: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("demo authentication", () => {
  beforeEach(() => {
    mocks.cookieGet.mockReset();
    mocks.cookieSet.mockReset();
    mocks.redirect.mockClear();
    mocks.signInWithPassword.mockReset();
    mocks.getUser.mockReset();
  });

  it("opens the recruiter demo account when Supabase Auth rejects the seeded credential", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" }
    });

    const { signInWithPassword } = await import("@/features/auth/actions");

    await expect(
      signInWithPassword(credentials("recruteur.demo@jobmada.mg", "jobmada-demo-password"))
    ).rejects.toThrow("NEXT_REDIRECT:/recruteur/dashboard");
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "jobmada_demo_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax" })
    );
  });

  it("opens demo accounts locally without waiting on Supabase sign-in", async () => {
    mocks.signInWithPassword.mockRejectedValue(new Error("Supabase should not be reached for demo credentials"));

    const { signInWithPassword } = await import("@/features/auth/actions");

    await expect(
      signInWithPassword(credentials("candidat.demo@jobmada.mg", "jobmada-demo-password"))
    ).rejects.toThrow("NEXT_REDIRECT:/candidat/dashboard");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "jobmada_demo_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax" })
    );
  });

  it("allows demo sessions through role guards without a Supabase Auth user", async () => {
    const value = encodeURIComponent(
      JSON.stringify({
        id: "00000000-0000-0000-0000-000000000001",
        role: "recruiter",
        email: "recruteur.demo@jobmada.mg",
        displayName: "Recruteur demo JobMada"
      })
    );

    mocks.cookieGet.mockImplementation((name: string) =>
      name === "jobmada_demo_session" ? { value } : undefined
    );
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "missing session" }
    });

    const { requireRole } = await import("@/lib/auth/require-role");
    const result = await requireRole(["recruiter"]);

    expect(result.profile.role).toBe("recruiter");
    expect(result.profile.email).toBe("recruteur.demo@jobmada.mg");
    expect(result.user.id).toBe("00000000-0000-0000-0000-000000000001");
  });

  it("does not call Supabase Auth when a valid demo session cookie is present", async () => {
    const value = encodeURIComponent(
      JSON.stringify({
        id: "00000000-0000-0000-0000-000000000001",
        role: "recruiter",
        email: "recruteur.demo@jobmada.mg",
        displayName: "Recruteur demo JobMada"
      })
    );

    mocks.cookieGet.mockImplementation((name: string) =>
      name === "jobmada_demo_session" ? { value } : undefined
    );
    mocks.getUser.mockRejectedValue(new Error("Supabase should not be reached for demo sessions"));

    const { requireRole } = await import("@/lib/auth/require-role");
    const result = await requireRole(["recruiter"]);

    expect(result.profile.role).toBe("recruiter");
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});
