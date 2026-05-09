import type { JobStatus } from "@/types/database";

export type ReviewDecision = "approve" | "reject";

export function normalizeReviewDecision(decision: ReviewDecision): JobStatus {
  return decision === "approve" ? "published" : "rejected";
}

export function isReviewDecision(decision: unknown): decision is ReviewDecision {
  return decision === "approve" || decision === "reject";
}

export function canReviewModerationStatus(status: JobStatus | "incomplete" | "verified"): boolean {
  return status === "pending_review";
}
