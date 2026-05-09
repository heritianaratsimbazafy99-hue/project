import type { JobStatus } from "@/types/database";

export function nextJobStatusAfterSubmit(current: JobStatus): JobStatus {
  if (current === "draft" || current === "rejected") {
    return "pending_review";
  }

  return current;
}
