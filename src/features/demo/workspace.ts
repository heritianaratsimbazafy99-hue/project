import { fallbackPublishedJobs } from "@/features/public/demo-data";
import type { CompanyStatus, JobStatus } from "@/types/database";

export const demoRecruiterCompany = {
  id: "demo-company-media-click",
  name: "Media Click",
  status: "verified" as CompanyStatus,
  sector: "Informatique & Digital",
  city: "Antananarivo"
};

export const demoRecruiterSubscription = {
  plan: "Gratuit",
  status: "active",
  job_quota: 2,
  cv_access_enabled: false
};

export const demoRecruiterJobs = fallbackPublishedJobs.slice(0, 2).map((job, index) => ({
  id: `demo-recruiter-${job.id}`,
  title: job.title,
  contract: job.contract,
  city: job.city,
  sector: job.sector,
  status: (index === 0 ? "published" : "pending_review") as JobStatus,
  is_featured: job.is_featured,
  is_urgent: job.is_urgent,
  created_at: job.published_at ?? new Date().toISOString()
}));

export const demoCandidateProfile = {
  cv_path: null,
  desired_role: "Designer UI/UX"
};

export const demoCandidateAlertCount = 1;

export const demoCandidateAlerts = [
  {
    id: "demo-alert-ui",
    query: "Designer UI/UX",
    sector: "Informatique & Digital",
    city: "Antananarivo",
    contract: "CDI",
    frequency: "daily",
    is_active: true,
    created_at: new Date().toISOString()
  }
];
