import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("Next.js security headers", () => {
  it("sets the baseline browser security headers globally", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(nextConfig.headers).toBeTypeOf("function");

    const headers = await nextConfig.headers?.();
    const globalHeaders = headers?.find((entry) => entry.source === "/(.*)")?.headers ?? [];
    const headerMap = new Map(globalHeaders.map((header) => [header.key.toLowerCase(), header.value]));

    expect(headerMap.get("content-security-policy")).toContain("frame-ancestors 'self'");
    expect(headerMap.get("x-content-type-options")).toBe("nosniff");
    expect(headerMap.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(headerMap.get("permissions-policy")).toContain("camera=()");
  });
});
