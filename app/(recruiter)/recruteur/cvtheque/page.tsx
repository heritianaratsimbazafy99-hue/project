import Link from "next/link";
import { BriefcaseBusiness, FileSearch, LockKeyhole, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { sortCandidatesByJobMatch, type CandidateJobMatch, type JobMatchInput } from "@/features/recruiter/cv-matching";
import { hasRecruiterCvLibraryAccess } from "@/features/subscriptions/plans";
import { openRecruiterLibraryCvAndRedirect } from "@/features/recruiter/cv-library-actions";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RecruiterCvLibraryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SubscriptionAccessRow = {
  plan: string | null;
  status: string | null;
  job_quota: number | null;
  cv_access_enabled: boolean | null;
};

type CompanySubscriptionRow = {
  id: string;
  status: string | null;
  subscriptions?: SubscriptionAccessRow | SubscriptionAccessRow[] | null;
};

type CandidateProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  sector: string | null;
  desired_role: string | null;
  salary_expectation: string | null;
  cv_path: string | null;
  cv_library_opt_in: boolean | null;
  cv_parse_source: "openai" | "fallback" | null;
  cv_parse_summary: string | null;
  candidate_skills?: Array<{ label: string | null; kind: string | null }> | null;
};

type JobMatchRow = JobMatchInput & {
  title: string | null;
  city: string | null;
  sector: string | null;
  status: string | null;
};

type DisplayCandidateRow = CandidateProfileRow & {
  match?: CandidateJobMatch;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function firstSubscription(company: CompanySubscriptionRow | null) {
  const subscriptions = company?.subscriptions;
  return Array.isArray(subscriptions) ? subscriptions[0] : subscriptions;
}

function candidateName(candidate: CandidateProfileRow) {
  return [candidate.first_name, candidate.last_name].filter(Boolean).join(" ").trim() || "Candidat JobMada";
}

function matchesSearch(candidate: CandidateProfileRow, search: string) {
  if (!search) {
    return true;
  }

  const haystack = [
    candidateName(candidate),
    candidate.city,
    candidate.sector,
    candidate.desired_role,
    candidate.salary_expectation,
    ...(candidate.candidate_skills ?? []).map((skill) => skill.label)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

export default async function RecruiterCvLibraryPage({ searchParams }: RecruiterCvLibraryPageProps) {
  const { user, isDemo } = await requireRole(["recruiter"]);
  const query = await searchParams;
  const mode = firstValue(query.mode) === "match" ? "match" : "search";
  const selectedJobId = firstValue(query.job);
  const search = (firstValue(query.q) ?? "").trim().toLowerCase();
  const errorMessage = firstValue(query.error);
  let company: CompanySubscriptionRow | null = null;
  let candidates: CandidateProfileRow[] = [];
  let jobs: JobMatchRow[] = [];
  let loadError = false;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("companies")
      .select("id, status, subscriptions(plan, status, job_quota, cv_access_enabled)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<CompanySubscriptionRow>();

    company = data;

    if (
      company?.id &&
      hasRecruiterCvLibraryAccess(firstSubscription(company), { companyStatus: company.status })
    ) {
      const [candidateResult, jobResult] = await Promise.all([
        supabase
          .from("candidate_profiles")
          .select(
            "id, first_name, last_name, city, sector, desired_role, salary_expectation, cv_path, cv_library_opt_in, cv_parse_source, cv_parse_summary, candidate_skills(label, kind)"
          )
          .not("cv_path", "is", null)
          .eq("cv_library_opt_in", true)
          .order("updated_at", { ascending: false })
          .limit(50)
          .returns<CandidateProfileRow[]>(),
        supabase
          .from("jobs")
          .select("id, title, city, sector, contract, summary, description, missions, profile, status")
          .eq("company_id", company.id)
          .order("updated_at", { ascending: false })
          .limit(25)
          .returns<JobMatchRow[]>()
      ]);

      candidates = candidateResult.data ?? [];
      jobs = jobResult.data ?? [];
      loadError = Boolean(candidateResult.error || jobResult.error);
    }
  }

  const subscription = firstSubscription(company);
  const hasCvAccess = hasRecruiterCvLibraryAccess(subscription, { companyStatus: company?.status });
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null;
  const matchedCandidates = selectedJob ? sortCandidatesByJobMatch(candidates, selectedJob) : [];
  const filteredCandidates = candidates.filter((candidate) => matchesSearch(candidate, search));
  const displayedCandidates: DisplayCandidateRow[] = mode === "match" ? matchedCandidates : filteredCandidates;
  const shouldShowCandidateResults = mode !== "match" || Boolean(selectedJob);
  const planLabel = subscription?.plan ? subscription.plan.toUpperCase() : "GRATUIT";

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>CVthèque JobMada</h1>
          <p>Accès aux profils candidat selon votre plan et les autorisations JobMada.</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="recruiterNotice isError" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <section className="cv-stats" aria-label="Statistiques CVthèque">
        {([
          [planLabel, "Plan actuel", FileSearch],
          [hasCvAccess ? "Activé" : "Non activé", "Accès CVthèque", LockKeyhole],
          [hasCvAccess ? "IA incluse" : "V1", hasCvAccess ? "Matching profils" : "Accès contrôlé", ShieldCheck]
        ] as const).map(([value, label, Icon]) => (
          <article className="metric-card" key={String(label)}>
            <span className="icon-tile">
              <Icon aria-hidden="true" size={18} />
            </span>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      {hasCvAccess ? (
        <section className="limited-cv cv-library-unlocked">
          <div className="notice-line">
            <Sparkles aria-hidden="true" size={18} />
            <strong>Recherche libre activée</strong>
            <span>Votre plan donne accès aux profils candidats avec CV et aux signaux de matching JobMada.</span>
          </div>

          <div className="cv-search-panel">
            <div className="segmented cv-mode-tabs" aria-label="Mode de recherche CVthèque">
              <Link className={mode === "search" ? "active" : ""} href="/recruteur/cvtheque">
                <Search aria-hidden="true" size={18} />
                Recherche libre
              </Link>
              <Link className={mode === "match" ? "active" : ""} href="/recruteur/cvtheque?mode=match">
                <BriefcaseBusiness aria-hidden="true" size={18} />
                Matcher par offre
              </Link>
            </div>

            {mode === "match" ? (
              <form className="toolbar cv-search" action="/recruteur/cvtheque">
                <input type="hidden" name="mode" value="match" />
                <div className="input-with-icon">
                  <BriefcaseBusiness aria-hidden="true" size={18} />
                  <select className="select" name="job" defaultValue={selectedJob?.id ?? ""}>
                    {jobs.length > 0 ? (
                      jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title || "Offre sans titre"} · {job.city || "Ville à préciser"}
                        </option>
                      ))
                    ) : (
                      <option value="">Aucune offre disponible</option>
                    )}
                  </select>
                </div>
                <button className="btn btn-soft" type="submit" disabled={jobs.length === 0}>
                  Matcher
                </button>
              </form>
            ) : (
              <form className="toolbar cv-search" action="/recruteur/cvtheque">
                <div className="input-with-icon">
                  <Search aria-hidden="true" size={18} />
                  <input
                    className="input"
                    name="q"
                    defaultValue={firstValue(query.q) ?? ""}
                    placeholder="Rechercher par poste, ville, secteur ou compétence..."
                  />
                </div>
                <button className="btn btn-soft" type="submit">
                  Rechercher
                </button>
                {search ? (
                  <Link className="btn btn-outline" href="/recruteur/cvtheque">
                    Réinitialiser
                  </Link>
                ) : null}
              </form>
            )}
          </div>

          {loadError ? (
            <div className="recruiterNotice isError" role="alert">
              Impossible de charger la CVthèque. Vérifiez que la migration d'accès CVthèque est appliquée.
            </div>
          ) : null}

          {mode === "match" && !selectedJob ? (
            <div className="empty-state">
              Publiez ou créez une offre pour lancer le matching candidats.
            </div>
          ) : null}

          {shouldShowCandidateResults ? (
            displayedCandidates.length > 0 ? (
              <div className="table-list cv-search">
                {displayedCandidates.map((candidate) => {
                  const skills = (candidate.candidate_skills ?? []).filter((skill) => skill.label).slice(0, 4);

                  return (
                    <article className="candidate-card" key={candidate.id}>
                      <div className="candidate-card-head">
                        <div>
                          <strong>{candidateName(candidate)}</strong>
                          <p>
                            {candidate.desired_role || "Profil candidat"} · {candidate.city || "Ville à préciser"}
                          </p>
                          <small>
                            {candidate.sector || "Secteur à préciser"}
                            {candidate.salary_expectation ? ` · ${candidate.salary_expectation}` : ""}
                          </small>
                          {candidate.match ? (
                            <div className="popular-row" aria-label="Score matching">
                              <strong>Score matching</strong>
                              <span className="status-badge ok">{candidate.match.score}%</span>
                              {candidate.match.reasons.slice(0, 3).map((reason) => (
                                <span className="status-badge" key={`${candidate.id}-${reason}`}>
                                  {reason}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <form action={openRecruiterLibraryCvAndRedirect.bind(null, candidate.id)}>
                          <button className="btn btn-soft" type="submit">
                            Voir le CV
                          </button>
                        </form>
                      </div>
                      {skills.length > 0 ? (
                        <div className="popular-row" aria-label="Compétences candidat">
                          <strong>COMPÉTENCES</strong>
                          {skills.map((skill) => (
                            <span className="status-badge" key={`${candidate.id}-${skill.kind}-${skill.label}`}>
                              {skill.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {candidate.cv_parse_summary ? (
                        <div className="popular-row" aria-label="Profil enrichi">
                          <strong>Profil enrichi</strong>
                          <span className="status-badge ok">
                            {candidate.cv_parse_source === "openai" ? "IA" : "CV"}
                          </span>
                          <span>{candidate.cv_parse_summary}</span>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                {mode === "match"
                  ? "Aucun profil avec CV n'est disponible pour calculer un matching."
                  : search
                    ? "Aucun profil CV ne correspond à cette recherche."
                    : "Aucun profil candidat avec CV n'est encore disponible."}
              </div>
            )
          ) : null}
        </section>
      ) : (
        <section className="limited-cv">
          <div className="notice-line">
            <Zap aria-hidden="true" size={18} />
            <strong>CVthèque non activée</strong>
            <span>Choisissez un plan Booster ou Agency pour accéder à la recherche libre de profils.</span>
          </div>
          <div className="upgrade-card">
            <strong>ACCÈS CVTHÈQUE</strong>
            <p>Demandez un plan avec accès CVthèque pour activer la recherche de profils pour votre entreprise.</p>
            <Link className="btn btn-primary" href="/recruteur/abonnement">
              Voir les plans
            </Link>
            <Link className="btn btn-outline" href="/recruteur/candidatures">
              Voir mes candidatures
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
