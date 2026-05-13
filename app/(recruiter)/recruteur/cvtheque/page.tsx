import Link from "next/link";
import { BriefcaseBusiness, FileSearch, LockKeyhole, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";

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
  candidate_skills?: Array<{ label: string | null; kind: string | null }> | null;
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
  const search = (firstValue(query.q) ?? "").trim().toLowerCase();
  const errorMessage = firstValue(query.error);
  let company: CompanySubscriptionRow | null = null;
  let candidates: CandidateProfileRow[] = [];
  let loadError = false;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("companies")
      .select("id, subscriptions(plan, status, job_quota, cv_access_enabled)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<CompanySubscriptionRow>();

    company = data;

    if (hasRecruiterCvLibraryAccess(firstSubscription(company))) {
      const { data: candidateData, error } = await supabase
        .from("candidate_profiles")
        .select("id, first_name, last_name, city, sector, desired_role, salary_expectation, cv_path, candidate_skills(label, kind)")
        .not("cv_path", "is", null)
        .order("updated_at", { ascending: false })
        .limit(50)
        .returns<CandidateProfileRow[]>();

      candidates = candidateData ?? [];
      loadError = Boolean(error);
    }
  }

  const subscription = firstSubscription(company);
  const hasCvAccess = hasRecruiterCvLibraryAccess(subscription);
  const filteredCandidates = candidates.filter((candidate) => matchesSearch(candidate, search));
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

          {loadError ? (
            <div className="recruiterNotice isError" role="alert">
              Impossible de charger la CVthèque. Vérifiez que la migration d'accès CVthèque est appliquée.
            </div>
          ) : null}

          {filteredCandidates.length > 0 ? (
            <div className="table-list cv-search">
              {filteredCandidates.map((candidate) => {
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
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              {search
                ? "Aucun profil CV ne correspond à cette recherche."
                : "Aucun profil candidat avec CV n'est encore disponible."}
            </div>
          )}
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
