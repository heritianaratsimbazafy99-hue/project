import Link from "next/link";
import { ArrowLeft, Save, Send } from "lucide-react";
import { notFound } from "next/navigation";

import { updateRecruiterJobAndRedirect } from "@/features/jobs/actions";
import { JOB_CONTRACT_OPTIONS, type JobContractOption } from "@/features/jobs/contracts";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type EditRecruiterOfferPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type EditableJobRow = {
  id: string;
  title: string;
  contract: string;
  city: string;
  sector: string;
  salary_range: string | null;
  location_detail: string | null;
  internal_reference: string | null;
  summary: string;
  description: string;
  missions: string;
  profile: string;
  status: JobStatus;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function TextAreaField({
  label,
  name,
  value,
  placeholder
}: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
}) {
  return (
    <div className="form-field full">
      <label htmlFor={name}>{label}</label>
      <textarea className="textarea" id={name} name={name} defaultValue={value} placeholder={placeholder} rows={5} />
    </div>
  );
}

export default async function EditRecruiterOfferPage({ params, searchParams }: EditRecruiterOfferPageProps) {
  const { id } = await params;
  const { user, isDemo } = await requireRole(["recruiter"]);

  if (isDemo) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!company) {
    notFound();
  }

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, title, contract, city, sector, salary_range, location_detail, internal_reference, summary, description, missions, profile, status"
    )
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle<EditableJobRow>();

  if (!job) {
    notFound();
  }

  const query = await searchParams;
  const error = firstQueryValue(query.error);
  const canSubmit = job.status === "draft" || job.status === "rejected";
  const contractOptions: readonly string[] = JOB_CONTRACT_OPTIONS.includes(job.contract as JobContractOption)
    ? JOB_CONTRACT_OPTIONS
    : [job.contract, ...JOB_CONTRACT_OPTIONS];

  return (
    <div className="new-offer-page">
      <div className="dashboard-welcome offer-heading">
        <div>
          <Link className="change-method-link" href="/recruteur/offres">
            <ArrowLeft aria-hidden="true" size={17} />
            Retour aux offres
          </Link>
          <h1>Modifier l'offre</h1>
          <p>Statut actuel : {job.status}</p>
        </div>
      </div>

      {error ? (
        <div className="recruiterNotice isError" role="alert">
          {error}
        </div>
      ) : null}

      <form action={updateRecruiterJobAndRedirect.bind(null, job.id, "draft")}>
        <section className="form-section" aria-labelledby="job-basics-title">
          <div className="form-section-head">
            <div className="form-section-title">
              <div>
                <h2 id="job-basics-title">Informations du poste</h2>
                <p>Modifiez les champs qui seront relus par JobMada avant publication.</p>
              </div>
            </div>
          </div>
          <div className="form-body form-grid offer-basics-grid">
            <div className="form-field">
              <label htmlFor="title">Titre du poste</label>
              <input className="input" id="title" name="title" defaultValue={job.title} required />
            </div>
            <div className="form-field">
              <label htmlFor="contract">Type de contrat</label>
              <select className="select" id="contract" name="contract" defaultValue={job.contract} required>
                {contractOptions.map((contract) => (
                  <option key={contract}>{contract}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="city">Ville</label>
              <input className="input" id="city" name="city" defaultValue={job.city} required />
            </div>
            <div className="form-field">
              <label htmlFor="sector">Secteur</label>
              <input className="input" id="sector" name="sector" defaultValue={job.sector} required />
            </div>
            <div className="form-field">
              <label htmlFor="location_detail">Lieu de travail</label>
              <input className="input" id="location_detail" name="location_detail" defaultValue={job.location_detail ?? ""} />
            </div>
            <div className="form-field">
              <label htmlFor="salary_range">Fourchette salariale</label>
              <input className="input" id="salary_range" name="salary_range" defaultValue={job.salary_range ?? ""} />
            </div>
            <div className="form-field">
              <label htmlFor="internal_reference">Référence interne</label>
              <input className="input" id="internal_reference" name="internal_reference" defaultValue={job.internal_reference ?? ""} />
            </div>
            <div className="form-field">
              <label htmlFor="summary">Résumé court</label>
              <input className="input" id="summary" name="summary" defaultValue={job.summary} />
            </div>
          </div>
        </section>

        <section className="form-section" aria-labelledby="job-content-title">
          <div className="form-section-head">
            <div className="form-section-title">
              <div>
                <h2 id="job-content-title">Contenu de l'offre</h2>
                <p>Ces sections sont affichées sur le détail public.</p>
              </div>
            </div>
          </div>
          <div className="form-body form-grid">
            <TextAreaField label="Description" name="description" value={job.description} placeholder="Contexte du poste" />
            <TextAreaField label="Missions" name="missions" value={job.missions} placeholder="Missions principales" />
            <TextAreaField label="Profil recherché" name="profile" value={job.profile} placeholder="Compétences attendues" />
          </div>
        </section>

        <div className="sticky-actions">
          <button className="btn btn-soft" type="submit">
            <Save aria-hidden="true" size={17} />
            Enregistrer
          </button>
          {canSubmit ? (
            <button className="btn btn-primary" type="submit" formAction={updateRecruiterJobAndRedirect.bind(null, job.id, "submit")}>
              <Send aria-hidden="true" size={17} />
              Envoyer en revue
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
