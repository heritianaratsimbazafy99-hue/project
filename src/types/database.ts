export type UserRole = "candidate" | "recruiter" | "admin";

export type JobStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "expired"
  | "archived";

export type CompanyStatus =
  | "incomplete"
  | "pending_review"
  | "verified"
  | "rejected";

export type SubscriptionPlan = "free" | "starter" | "booster" | "agency";

export type PlanChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "canceled";

export type ApplicationStatus =
  | "submitted"
  | "viewed"
  | "shortlisted"
  | "rejected"
  | "interview"
  | "hired";

export type JobListItem = {
  id: string;
  slug: string;
  title: string;
  contract: string;
  city: string;
  sector: string;
  summary: string;
  is_featured: boolean;
  is_urgent: boolean;
  published_at: string | null;
  company: {
    name: string;
    slug: string;
    logo_path: string | null;
  };
};
