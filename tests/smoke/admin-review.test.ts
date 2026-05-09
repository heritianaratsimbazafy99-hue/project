import { describe, expect, it } from "vitest";

import {
  canReviewModerationStatus,
  isReviewDecision,
  normalizeReviewDecision
} from "@/features/admin/review";

describe("admin review decision", () => {
  it("maps approve to published job status", () => {
    expect(normalizeReviewDecision("approve")).toBe("published");
  });

  it("maps reject to rejected job status", () => {
    expect(normalizeReviewDecision("reject")).toBe("rejected");
  });

  it("accepts only known review decisions", () => {
    expect(isReviewDecision("approve")).toBe(true);
    expect(isReviewDecision("publish")).toBe(false);
  });

  it("limits moderation actions to pending review items", () => {
    expect(canReviewModerationStatus("pending_review")).toBe(true);
    expect(canReviewModerationStatus("published")).toBe(false);
    expect(canReviewModerationStatus("verified")).toBe(false);
  });
});
