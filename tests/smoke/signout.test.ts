import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieDelete: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  signOut: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn(() => null)
  })),
  cookies: vi.fn(async () => ({
    delete: mocks.cookieDelete
  }))
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signOut: mocks.signOut
    }
  }))
}));

describe("sign out", () => {
  beforeEach(() => {
    mocks.cookieDelete.mockReset();
    mocks.redirect.mockClear();
    mocks.signOut.mockReset();
  });

  it("clears Supabase and demo sessions before returning to login", async () => {
    const { signOut } = await import("@/features/auth/actions");

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/connexion?logged_out=1");

    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.cookieDelete).toHaveBeenCalledWith("jobmada_demo_session");
  });
});
