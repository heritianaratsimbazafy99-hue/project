import Link from "next/link";
import {
  Bold,
  BriefcaseBusiness,
  FileText,
  Hash,
  Italic,
  List,
  ListOrdered,
  Save,
  Send,
  Sparkles,
  Star,
  Zap
} from "lucide-react";

import { createJobAndRedirect, saveDraftJobAndRedirect } from "@/features/jobs/actions";
import { JobDescriptionAssistant } from "@/features/jobs/components/job-description-assistant";
import { demoRecruiterCompany, demoRecruiterSubscription } from "@/features/demo/workspace";
import { calculateJobQuotaUsage, QUOTA_EXCLUDED_JOB_STATUS } from "@/features/recruiter/quota";
import { hasAdvancedRecruiterTools } from "@/features/subscriptions/plans";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NewRecruiterOfferPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function EditorField({
  label,
  name,
  placeholder
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <div className="form-field full editor-field">
      <label>{label}</label>
        <div className="editor-shell">
          <div className="editor-toolbar" aria-hidden="true">
          <span>
            <Bold size={15} />
          </span>
          <span>
            <Italic size={15} />
          </span>
          <span>
            <List size={15} />
          </span>
          <span>
            <ListOrdered size={15} />
          </span>
        </div>
        <textarea className="textarea" name={name} placeholder={placeholder} rows={5} />
        <small>0 / 100 min. recommandé</small>
      </div>
    </div>
  );
}

export default async function NewRecruiterOfferPage({ searchParams }: NewRecruiterOfferPageProps) {
  const { user, isDemo } = await requireRole(["recruiter"]);
  const errorMessage = firstValue((await searchParams).error);
  let quota = demoRecruiterSubscription.job_quota;
  let usedJobs = isDemo ? 1 : 0;
  let subscription: {
    plan: string | null;
    status: string | null;
    job_quota: number | null;
    cv_access_enabled: boolean | null;
  } | null = isDemo
    ? { plan: "free", status: "active", job_quota: demoRecruiterSubscription.job_quota, cv_access_enabled: false }
    : null;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<typeof demoRecruiterCompany>();

    if (company) {
      const [{ data: subscriptionData }, { count }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("plan, status, job_quota, cv_access_enabled")
          .eq("company_id", company.id)
          .maybeSingle<{
            plan: string | null;
            status: string | null;
            job_quota: number | null;
            cv_access_enabled: boolean | null;
          }>(),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .neq("status", QUOTA_EXCLUDED_JOB_STATUS)
      ]);

      subscription = subscriptionData ?? null;
      quota = subscription?.job_quota ?? quota;
      usedJobs = count ?? 0;
    }
  }

  const quotaUsage = calculateJobQuotaUsage({ quota, used: usedJobs });
  const remainingJobs = quotaUsage.remainingLabel;
  const advancedToolsEnabled = hasAdvancedRecruiterTools(subscription);

  return (
    <div className="new-offer-page">
      <div className="dashboard-welcome offer-heading">
        <div>
          <h1>Nouvelle offre</h1>
          <p>Remplissez les informations de votre offre</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="recruiterNotice" role="status">
          {errorMessage}
        </div>
      ) : null}

      <div className="quota-notice">
        <Zap aria-hidden="true" size={19} />
        <span>
          Il vous reste <strong>{remainingJobs} offres</strong> sur votre plan
        </span>
      </div>

      <form action={createJobAndRedirect}>
        <section className="form-section" aria-labelledby="job-basics-title">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile">
                <BriefcaseBusiness aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 id="job-basics-title">Informations du poste</h2>
                <p>Les informations de base de votre offre</p>
              </div>
            </div>
          </div>
          <div className="form-body form-grid offer-basics-grid">
            <div className="form-field">
              <label htmlFor="title">Titre du poste *</label>
              <input
                className="input"
                id="title"
                name="title"
                required
                placeholder="Ex: Développeur Full Stack React/Node.js"
              />
            </div>
            <div className="form-field">
              <label htmlFor="contract">Type de contrat *</label>
              <select className="select" id="contract" name="contract" required defaultValue="CDI">
                <option>CDI</option>
                <option>CDD</option>
                <option>Stage</option>
                <option>Freelance</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="city">Ville *</label>
              <select className="select" id="city" name="city" required defaultValue="">
                <option value="" disabled>
                  Sélectionner une ville
                </option>
                {[
                  "Ambanja",
                  "Antananarivo",
                  "Antsirabe",
                  "Antsiranana",
                  "Fianarantsoa",
                  "Mahajanga",
                  "Moramanga",
                  "Morondava",
                  "Nosy Be",
                  "Sainte-Marie",
                  "Taolagnaro",
                  "Toamasina",
                  "Toliara"
                ].map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="location_detail">Lieu de travail</label>
              <input
                className="input"
                id="location_detail"
                name="location_detail"
                placeholder="Ex: Analakely, Antananarivo"
              />
            </div>
            <div className="form-field">
              <label htmlFor="salary_range">Fourchette de salaire mensuel</label>
              <select className="select" id="salary_range" name="salary_range" defaultValue="">
                <option value="" disabled>
                  Sélectionner une fourchette
                </option>
                <option>Moins de 500 000 Ar</option>
                <option>500 000 à 1 200 000 Ar</option>
                <option>1 200 000 à 2 000 000 Ar</option>
                <option>2 000 000 à 3 000 000 Ar</option>
                <option>Plus de 3 000 000 Ar</option>
              </select>
              <label className="check-row compact">
                <input type="checkbox" name="salary_hidden" value="1" />
                Salaire non communiqué
              </label>
            </div>
            <div className="form-field">
              <label htmlFor="internal_reference">Votre référence interne</label>
              <div className="input-with-icon">
                <Hash aria-hidden="true" size={19} />
                <input
                  className="input"
                  id="internal_reference"
                  name="internal_reference"
                  placeholder="Ex: DEV-2026-042"
                />
              </div>
              <small>Visible dans votre dashboard pour tracker vos offres</small>
            </div>
            <div className="form-field">
              <label htmlFor="sector">Secteur *</label>
              <select className="select" id="sector" name="sector" required defaultValue="">
                <option value="" disabled>
                  Sélectionner un secteur
                </option>
                <option>Informatique & Digital</option>
                <option>BPO & Relation client</option>
                <option>Commerce & Distribution</option>
                <option>Finance & Comptabilité</option>
                <option>Ressources humaines</option>
                <option>ONG & Projet</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="summary">Résumé court</label>
              <input className="input" id="summary" name="summary" placeholder="Une phrase visible dans les listes" />
            </div>
          </div>
        </section>

        <section className="form-section" aria-labelledby="job-content-title">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile mauve">
                <FileText aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 id="job-content-title">Description de l'offre</h2>
                <p>Décrivez le poste pour attirer les bons candidats</p>
              </div>
            </div>
          </div>
          <div className="form-body form-grid">
            <p className="form-tip">
              <strong>Conseil :</strong> les offres avec plus de 200 caractères par section reçoivent en moyenne 3× plus
              de candidatures.
            </p>
            <EditorField
              label="Description du poste *"
              name="description"
              placeholder="Contexte de l'entreprise et responsabilités principales"
            />
            <EditorField
              label="Missions principales *"
              name="missions"
              placeholder="Les tâches quotidiennes et objectifs du poste"
            />
            <EditorField
              label="Profil recherché *"
              name="profile"
              placeholder="Compétences techniques et humaines attendues"
            />
            {advancedToolsEnabled ? (
              <JobDescriptionAssistant />
            ) : (
              <div className="ai-row full">
                <div>
                  <strong>Améliorer avec l'IA</strong>
                  <p>Fonctionnalité disponible après validation d'un plan avancé.</p>
                </div>
                <Link className="btn btn-soft" href="/recruteur/abonnement">
                  <Sparkles aria-hidden="true" size={17} />
                  Voir les plans
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="form-section" aria-labelledby="visibility-title">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile amber">
                <Zap aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 id="visibility-title">Options de visibilité</h2>
                <p>Boostez la visibilité de votre offre pendant 7 jours.</p>
              </div>
            </div>
            <span className="status-badge">optionnel</span>
          </div>
          <div className="form-body visibility-grid">
            <article>
              <div>
                <strong>
                  <Star aria-hidden="true" size={18} /> Vedette
                </strong>
                {advancedToolsEnabled ? <span>Inclus</span> : <Link href="/recruteur/abonnement">Débloquer</Link>}
              </div>
              <p>Mise en avant en haut des résultats avec un badge doré.</p>
              <small>Durée : 7 jours · Plan Booster+</small>
            </article>
            <article>
              <div>
                <strong>
                  <Zap aria-hidden="true" size={18} /> Urgent
                </strong>
                {advancedToolsEnabled ? <span>Inclus</span> : <Link href="/recruteur/abonnement">Débloquer</Link>}
              </div>
              <p>Badge rouge « Urgent » sur l'offre. Pour les recrutements à pourvoir vite.</p>
              <small>Durée : 7 jours · Plan Starter+</small>
            </article>
            <p className="form-tip full">
              {advancedToolsEnabled
                ? "Options incluses dans votre plan. Elles sont confirmées pendant la validation de l'offre."
                : "Les options s'activent après validation de l'offre par notre équipe."}
            </p>
          </div>
        </section>

        <div className="sticky-actions">
          <div className="progress-hint">
            <strong>10%</strong>
            <span>
              Ajoutez la description
              <br />
              pour plus de visibilité
            </span>
          </div>
          <button className="btn btn-soft" type="submit" formAction={saveDraftJobAndRedirect}>
            <Save aria-hidden="true" size={17} />
            Enregistrer en brouillon
          </button>
          <button className="btn btn-primary" type="submit">
            <Send aria-hidden="true" size={17} />
            Publier l'offre
          </button>
        </div>
      </form>
    </div>
  );
}
