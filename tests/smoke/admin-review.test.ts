import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  canReviewModerationStatus,
  isReviewDecision,
  normalizeReviewDecision
} from "@/features/admin/review";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

vi.mock("@/lib/auth/require-role", () => ({
  requireRole: mocks.requireRole
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    rpc: mocks.rpc,
    from: mocks.from
  }))
}));

describe("admin review decision", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.requireRole.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.rpc.mockReset();
    mocks.from.mockReset();
    mocks.requireRole.mockResolvedValue({
      user: { id: "admin-1" },
      profile: { role: "admin" },
      isDemo: false
    });
  });

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

  it("requires a note before rejecting a job", async () => {
    const { reviewJob } = await import("@/features/admin/actions");

    await expect(reviewJob("job-1", "reject", "   ")).rejects.toThrow(
      "Ajoutez une note pour expliquer le rejet."
    );

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("passes a trimmed rejection note to the job review RPC", async () => {
    mocks.rpc.mockReturnValue({
      single: vi.fn(async () => ({ data: { slug: "dev-fullstack" }, error: null }))
    });

    const { reviewJob } = await import("@/features/admin/actions");
    await reviewJob("job-1", "reject", "  Description trop vague. ");

    expect(mocks.rpc).toHaveBeenCalledWith("review_job", {
      job_uuid: "job-1",
      review_decision: "reject",
      review_note: "Description trop vague."
    });
  });

  it("requires a note before rejecting a company", async () => {
    const { reviewCompany } = await import("@/features/admin/actions");

    await expect(reviewCompany("company-1", "reject", new FormData())).rejects.toThrow(
      "Ajoutez une note pour expliquer le rejet."
    );

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("surfaces RPC errors instead of swallowing them", async () => {
    mocks.rpc.mockReturnValue({
      single: vi.fn(async () => ({ data: null, error: { message: "Job is not waiting for review" } }))
    });

    const { reviewJob } = await import("@/features/admin/actions");

    await expect(reviewJob("job-1", "approve", "")).rejects.toThrow(
      "Job is not waiting for review"
    );
  });
});
