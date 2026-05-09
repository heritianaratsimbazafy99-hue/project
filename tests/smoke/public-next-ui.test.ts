import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("public Next UI routes", () => {
  it("keeps the original prototype visual system mounted in Next", () => {
    expect(read("app/layout.tsx")).toContain('import "../styles.css"');
    expect(read("app/page.tsx")).toContain("hero-band");
    expect(read("src/features/public/components.tsx")).toContain("deadline-card");
    expect(read("src/features/public/components.tsx")).toContain("data-sticky-pro");
    expect(read("app/(public)/emploi/page.tsx")).toContain("jobs-listing-layout");
    expect(read("app/(public)/emploi/page.tsx")).toContain("filter-panel");
  });

  it("defines public routes used by visible links", () => {
    expect(existsSync(resolve(process.cwd(), "app/(public)/connexion/page.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "app/(public)/inscription/[type]/page.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "app/(public)/tarifs/page.tsx"))).toBe(true);
  });
});
