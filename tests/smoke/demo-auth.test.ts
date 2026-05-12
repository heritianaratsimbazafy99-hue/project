import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  signInWithPassword: vi.fn(),
  getUser: vi.fn(),
  profileSingle: vi.fn()
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
      single: mocks.profileSingle
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
    mocks.profileSingle.mockReset();
    mocks.profileSingle.mockResolvedValue({ data: null, error: { message: "no profile" } });
    delete process.env.ENABLE_DEMO_AUTH;
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

  it("does not default Supabase users to the candidate dashboard when their profile cannot be loaded", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-without-profile", email: "person@jobmada.test" } },
      error: null
    });
    mocks.profileSingle.mockResolvedValue({ data: null, error: { message: "no profile" } });

    const { signInWithPassword } = await import("@/features/auth/actions");

    await expect(signInWithPassword(credentials("person@jobmada.test", "password123"))).rejects.toThrow(
      "NEXT_REDIRECT:/connexion?error=profile"
    );
  });

  it("does not open demo accounts when demo auth is disabled", async () => {
    process.env.ENABLE_DEMO_AUTH = "false";
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" }
    });

    const { signInWithPassword } = await import("@/features/auth/actions");

    await expect(
      signInWithPassword(credentials("candidat.demo@jobmada.mg", "jobmada-demo-password"))
    ).rejects.toThrow("NEXT_REDIRECT:/connexion?error=invalid");
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.signInWithPassword).toHaveBeenCalled();
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

  it("redirects a demo user to their own dashboard when they request another role workspace", async () => {
    const value = encodeURIComponent(
      JSON.stringify({
        id: "00000000-0000-0000-0000-000000000002",
        role: "candidate",
        email: "candidat.demo@jobmada.mg",
        displayName: "Candidat demo JobMada"
      })
    );

    mocks.cookieGet.mockImplementation((name: string) =>
      name === "jobmada_demo_session" ? { value } : undefined
    );

    const { requireRole } = await import("@/lib/auth/require-role");

    await expect(requireRole(["recruiter"])).rejects.toThrow("NEXT_REDIRECT:/candidat/dashboard");
  });

  it("ignores existing demo cookies when demo auth is disabled", async () => {
    process.env.ENABLE_DEMO_AUTH = "false";
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

    await expect(requireRole(["recruiter"])).rejects.toThrow("NEXT_REDIRECT:/connexion");
  });

  it("redirects a Supabase user to their own dashboard when they request another role workspace", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-candidate", email: "candidate@jobmada.test" } },
      error: null
    });
    mocks.profileSingle.mockResolvedValue({
      data: {
        id: "user-candidate",
        role: "candidate",
        email: "candidate@jobmada.test",
        phone: null,
        display_name: "Candidate Test",
        onboarding_completion: 75
      },
      error: null
    });

    const { requireRole } = await import("@/lib/auth/require-role");

    await expect(requireRole(["recruiter"])).rejects.toThrow("NEXT_REDIRECT:/candidat/dashboard");
  });
});
