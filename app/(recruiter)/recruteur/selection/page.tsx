import Link from "next/link";
import { Star, Trash2, Zap } from "lucide-react";

import { removeCandidateFromRecruiterSelectionAndRefresh } from "@/features/recruiter/selection-actions";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SelectedApplicationRow = {
  id: string;
  candidate_id: string;
  job_id: string;
  created_at: string;
};

type CandidateProfileRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  sector: string | null;
  desired_role: string | null;
};

type JobRow = {
  id: string;
  title: string;
};

function initials(candidate: CandidateProfileRow | undefined, fallback: string) {
  const label = [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ").trim() || fallback;
  return label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function RecruiterSelectionPage() {
  const { user, isDemo } = await requireRole(["recruiter"]);
  let applications: SelectedApplicationRow[] | null = [];
  let candidates: CandidateProfileRow[] | null = [];
  let jobs: JobRow[] | null = [];

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (company) {
      const { data } = await supabase
        .from("applications")
        .select("id, candidate_id, job_id, created_at, jobs!inner(company_id)")
        .eq("status", "shortlisted")
        .eq("jobs.company_id", company.id)
        .order("created_at", { ascending: false })
        .returns<SelectedApplicationRow[]>();

      applications = data;
    }
  }

  const selectedApplications = applications ?? [];
  const candidateIds = [...new Set(selectedApplications.map((application) => application.candidate_id))];
  const jobIds = [...new Set(selectedApplications.map((application) => application.job_id))];

  if (!isDemo && (candidateIds.length > 0 || jobIds.length > 0)) {
    const supabase = await createSupabaseServerClient();
    const [candidateResult, jobResult] = await Promise.all([
      candidateIds.length > 0
        ? supabase
            .from("candidate_profiles")
            .select("user_id, first_name, last_name, city, sector, desired_role")
            .in("user_id", candidateIds)
            .returns<CandidateProfileRow[]>()
        : Promise.resolve({ data: [] as CandidateProfileRow[] }),
      jobIds.length > 0
        ? supabase.from("jobs").select("id, title").in("id", jobIds).returns<JobRow[]>()
        : Promise.resolve({ data: [] as JobRow[] })
    ]);

    candidates = candidateResult.data;
    jobs = jobResult.data;
  }

  const candidateById = new Map((candidates ?? []).map((candidate) => [candidate.user_id, candidate]));
  const jobById = new Map((jobs ?? []).map((job) => [job.id, job]));

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Ma sélection</h1>
          <p>Vos candidats enregistrés et vos profils consultés récemment.</p>
        </div>
      </div>

      <div className="segmented selection-tabs" aria-label="Vue active">
        <span className="active">
          <Star aria-hidden="true" size={18} />
          Ma sélection ({selectedApplications.length})
        </span>
      </div>

      {selectedApplications.length > 0 ? (
        <section className="cv-grid">
          {selectedApplications.map((application) => {
            const candidate = candidateById.get(application.candidate_id);
            const job = jobById.get(application.job_id);
            const candidateName =
              [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ").trim() || "Candidat sélectionné";

            return (
              <article className="cv-card" key={application.id}>
                <div className="candidate-card-head">
                  <div className="avatar" aria-hidden="true">
                    {initials(candidate, "CS")}
                  </div>
                  <div>
                    <strong>{candidateName}</strong>
                    <p>{candidate?.desired_role || candidate?.sector || "Profil candidat"}</p>
                  </div>
                </div>
                <p>{candidate?.city || "Localisation non renseignée"}</p>
                <p>Offre : {job?.title || "Offre associée"}</p>
                <form action={removeCandidateFromRecruiterSelectionAndRefresh.bind(null, application.id)}>
                  <button className="btn btn-outline" type="submit">
                    <Trash2 aria-hidden="true" size={18} />
                    Retirer
                  </button>
                </form>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="empty-state selection-empty">
          <Zap aria-hidden="true" size={26} />
          <h2>Aucun candidat sélectionné</h2>
          <p>Ajoutez des candidats depuis les candidatures reçues en les passant au statut shortlisté.</p>
          <Link className="btn btn-primary" href="/recruteur/candidatures">
            Voir mes candidatures
          </Link>
        </section>
      )}
    </>
  );
}
