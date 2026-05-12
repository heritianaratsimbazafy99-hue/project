import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("public job detail page", () => {
  it("renders stored job content instead of generic placeholder bullets", () => {
    const page = read("app/(public)/emploi/[slug]/page.tsx");

    expect(page).toContain("job.missions");
    expect(page).toContain("job.profile");
    expect(page).toContain("job.description");
    expect(page).not.toContain("Prendre en charge les missions quotidiennes");
    expect(page).not.toContain("Bonne capacité d'analyse");
  });
});
