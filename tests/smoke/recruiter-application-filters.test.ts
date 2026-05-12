import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("recruiter application filters", () => {
  it("keeps filter tab counters aligned with the exact status they link to", () => {
    const source = read("app/(recruiter)/recruteur/candidatures/page.tsx");

    expect(source).toContain("statusTabItems");
    expect(source).toContain('status: "viewed"');
    expect(source).toContain("application.status === status");
    expect(source).not.toContain('["Consultées", viewedCount]');
  });
});
