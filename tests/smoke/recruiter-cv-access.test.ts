import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("recruiter CV access UI", () => {
  it("keeps CV access behind the signed URL server action and owner check", () => {
    const actions = read("src/features/applications/actions.ts");
    const page = read("app/(recruiter)/recruteur/candidatures/page.tsx");

    expect(actions).toContain("createRecruiterCandidateCvSignedUrl");
    expect(actions).toContain("companies!inner(owner_id)");
    expect(actions).toContain("company?.owner_id !== user.id");
    expect(actions).toContain("createSignedUrl(cvPath, 300)");
    expect(page).toContain("openRecruiterCandidateCvAndRedirect");
    expect(page).toContain("Voir le CV");
  });
});
