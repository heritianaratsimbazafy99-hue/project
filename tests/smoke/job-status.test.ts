import { describe, expect, it } from "vitest";

import { nextJobStatusAfterSubmit } from "@/features/jobs/status";

describe("job status transitions", () => {
  it("submits drafts for admin review", () => {
    expect(nextJobStatusAfterSubmit("draft")).toBe("pending_review");
  });
});
