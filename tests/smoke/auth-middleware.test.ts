import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createServerClient: vi.fn()
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient
}));

function requestWithCookies(cookieNames: string[] = []) {
  const cookies = new Map(cookieNames.map((name) => [name, "value"]));

  return {
    cookies: {
      getAll: vi.fn(() => Array.from(cookies, ([name, value]) => ({ name, value }))),
      set: vi.fn(),
      has: vi.fn((name: string) => cookies.has(name))
    }
  };
}

describe("auth middleware", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    delete process.env.ENABLE_DEMO_AUTH;
    mocks.getUser.mockReset();
    mocks.createServerClient.mockReset();
    mocks.createServerClient.mockReturnValue({
      auth: {
        getUser: mocks.getUser
      }
    });
  });

  it("does not refresh Supabase auth when the request has no Supabase session cookie", async () => {
    const { middleware } = await import("../../middleware");

    await middleware(requestWithCookies() as never);

    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("does not refresh Supabase auth for local demo sessions", async () => {
    const { middleware } = await import("../../middleware");

    await middleware(requestWithCookies(["jobmada_demo_session"]) as never);

    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("refreshes Supabase auth when a local demo cookie is present alongside a Supabase session", async () => {
    const { middleware } = await import("../../middleware");

    await middleware(requestWithCookies(["jobmada_demo_session", "sb-project-auth-token"]) as never);

    expect(mocks.createServerClient).toHaveBeenCalled();
    expect(mocks.getUser).toHaveBeenCalled();
  });

  it("does refresh Supabase auth when demo cookies are disabled", async () => {
    process.env.ENABLE_DEMO_AUTH = "false";
    const { middleware } = await import("../../middleware");

    await middleware(requestWithCookies(["jobmada_demo_session", "sb-project-auth-token"]) as never);

    expect(mocks.createServerClient).toHaveBeenCalled();
    expect(mocks.getUser).toHaveBeenCalled();
    delete process.env.ENABLE_DEMO_AUTH;
  });
});
