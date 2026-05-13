import Link from "next/link";
import {
  BriefcaseBusiness,
  Eye,
  FileText,
  Gift,
  Globe,
  HeartHandshake,
  Image,
  Images,
  RotateCcw,
  Save
} from "lucide-react";

import { demoRecruiterCompany } from "@/features/demo/workspace";
import { saveRecruiterCompanyAndRedirect, submitCompanyForReview } from "@/features/recruiter/company-actions";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompanyStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type RecruiterCompanyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  sector: string | null;
  size_label: string | null;
  city: string | null;
  website: string | null;
  description: string | null;
  logo_path: string | null;
  cover_path: string | null;
  career_headline: string | null;
  career_intro: string | null;
  career_values: string[] | null;
  career_benefits: string[] | null;
  career_gallery_paths: string[] | null;
  career_connect_enabled: boolean | null;
  career_connect_title: string | null;
  career_connect_description: string | null;
};

type AdminReviewRow = {
  decision: "approve" | "reject";
  note: string | null;
  created_at: string;
};

const companyStatusLabels: Record<CompanyStatus, string> = {
  incomplete: "À compléter",
  pending_review: "En revue",
  verified: "Vérifiée",
  rejected: "À corriger"
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function calculateCompanyCompletion(company: CompanyRow | null) {
  if (!company) {
    return 0;
  }

  const fields = [
    company.name,
    company.sector,
    company.city,
    company.website,
    company.description,
    company.career_headline,
    company.career_intro,
    company.career_values?.length ? "values" : "",
    company.career_benefits?.length ? "benefits" : ""
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function textAreaList(values: string[] | null | undefined) {
  return (values ?? []).filter(Boolean).join("\n");
}

export default async function RecruiterCompanyPage({ searchParams }: RecruiterCompanyPageProps) {
  const { user, isDemo } = await requireRole(["recruiter"]);
  let company: CompanyRow | null = isDemo
    ? {
        ...demoRecruiterCompany,
        slug: "media-click-demo",
        website: "https://mediaclick.mg",
        description: "Studio digital spécialisé dans la conception produit, les campagnes et les talents créatifs.",
        size_label: "11 à 50 employés",
        logo_path: null,
        cover_path: null,
        career_headline: "Construisez des expériences digitales utiles à Madagascar",
        career_intro: "Une équipe créative, produit et acquisition qui avance vite avec ses clients.",
        career_values: ["Impact local", "Exigence produit", "Apprentissage continu"],
        career_benefits: ["Organisation hybride", "Formations métier", "Projets variés"],
        career_gallery_paths: [],
        career_connect_enabled: true,
        career_connect_title: "Restons en contact",
        career_connect_description: "Envoyez votre CV pour nos prochains recrutements."
      }
    : null;
  let companyReviews: AdminReviewRow[] = [];

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("companies")
      .select(
        "id, name, slug, status, sector, size_label, city, website, description, logo_path, cover_path, career_headline, career_intro, career_values, career_benefits, career_gallery_paths, career_connect_enabled, career_connect_title, career_connect_description"
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<CompanyRow>();

    company = data;

    if (company) {
      const { data: reviews } = await supabase
        .from("admin_reviews")
        .select("decision, note, created_at")
        .eq("target_table", "companies")
        .eq("target_id", company.id)
        .order("created_at", { ascending: false });

      companyReviews = (reviews ?? []) as AdminReviewRow[];
    }
  }

  const query = await searchParams;
  const saved = firstQueryValue(query.saved);
  const error = firstQueryValue(query.error);
  const completion = calculateCompanyCompletion(company);
  const statusLabel = company ? companyStatusLabels[company.status] : "À créer";
  const reviewCompanyId =
    company && (company.status === "incomplete" || company.status === "rejected") ? company.id : null;

  return (
    <>
      <div className="recruiter-top">
        <div className="recruiter-top-main">
          <div className="progress-ring">{completion}%</div>
          <div>
            <h1>Profil de l'entreprise</h1>
            <p>Complétez votre profil pour attirer plus de candidats.</p>
          </div>
        </div>
        <Link className="btn btn-outline" href={company?.slug ? `/entreprises/${company.slug}` : "/emploi"}>
          <Eye aria-hidden="true" size={18} />
          Voir mon site carrière
        </Link>
      </div>

      {saved ? (
        <div className="recruiterNotice" role="status">
          Profil entreprise enregistré.
        </div>
      ) : null}
      {error ? (
        <div className="recruiterNotice isError" role="alert">
          {error}
        </div>
      ) : null}
      {companyReviews.some((review) => review.decision === "reject" && review.note) ? (
        <div className="recruiterNotice isError" role="status">
          Dernier rejet JobMada : {companyReviews.find((review) => review.decision === "reject" && review.note)?.note}
        </div>
      ) : null}

      <form action={saveRecruiterCompanyAndRedirect}>
        <section className="form-section">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile">
                <BriefcaseBusiness aria-hidden="true" size={18} />
              </span>
              Identité
            </div>
            <span className="status-badge">{statusLabel}</span>
          </div>
          <div className="form-body form-grid">
            <div className="form-field full">
              <label>Logo de l'entreprise</label>
              <div className="upload-box">
                <div className="avatar">{company?.name?.charAt(0) ?? "J"}</div>
                <div>
                  <strong>Format JPG ou PNG, max 2 Mo</strong>
                  <br />
                  <input className="input" name="logo" type="file" accept="image/png,image/jpeg" />
                  {company?.logo_path ? <small>Logo actuel enregistré : {company.logo_path}</small> : null}
                </div>
              </div>
            </div>
            <div className="form-field full">
              <label>Image de couverture</label>
              <div className="upload-box">
                <span className="icon-tile">
                  <Image aria-hidden="true" size={18} />
                </span>
                <div>
                  <strong>Format JPG ou PNG, max 2 Mo</strong>
                  <br />
                  <input className="input" name="cover" type="file" accept="image/png,image/jpeg" />
                  {company?.cover_path ? <small>Couverture actuelle enregistrée : {company.cover_path}</small> : null}
                </div>
              </div>
            </div>
            <div className="form-field">
              <label>Nom de l'entreprise</label>
              <input className="input" name="name" defaultValue={company?.name ?? ""} placeholder="Nom de l'entreprise" required />
            </div>
            <div className="form-field">
              <label>Secteur d'activité</label>
              <select className="select" name="sector" defaultValue={company?.sector ?? ""}>
                <option value="">Sélectionner un secteur</option>
                <option>Informatique & Digital</option>
                <option>BPO & Relation client</option>
                <option>Commerce & Distribution</option>
                <option>Finance & Comptabilité</option>
                <option>Ressources humaines</option>
                <option>ONG & Projet</option>
              </select>
            </div>
            <div className="form-field">
              <label>Taille de l'entreprise</label>
              <select className="select" name="size_label" defaultValue={company?.size_label ?? ""}>
                <option value="">Sélectionner la taille</option>
                <option>1 à 10 employés</option>
                <option>11 à 50 employés</option>
                <option>51 à 200 employés</option>
                <option>201 à 500 employés</option>
                <option>500+ employés</option>
              </select>
            </div>
            <div className="form-field">
              <label>Ville / Siège</label>
              <input className="input" name="city" defaultValue={company?.city ?? ""} placeholder="Ex : Antananarivo" />
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile">
                <FileText aria-hidden="true" size={18} />
              </span>
              Présentation
            </div>
            <span className="status-badge">À compléter</span>
          </div>
          <div className="form-body form-grid">
            <div className="form-field">
              <label>Description de l'entreprise</label>
              <textarea
                className="textarea"
                name="description"
                defaultValue={company?.description ?? ""}
                placeholder="Parlez de vos activités, votre culture, vos valeurs"
              />
              <small>Astuce : mentionnez ce qui rend votre entreprise unique.</small>
            </div>
            <div className="form-field">
              <label>Headline carrière</label>
              <textarea
                className="textarea"
                name="career_headline"
                defaultValue={company?.career_headline ?? ""}
                placeholder="Ex : Construisez les services financiers de demain"
              />
              <small>Cette phrase apparaît dans le premier écran du site carrière.</small>
            </div>
            <div className="form-field full">
              <label>Culture et environnement</label>
              <textarea
                className="textarea"
                name="career_intro"
                defaultValue={company?.career_intro ?? ""}
                placeholder="Présentez votre culture, votre façon de travailler et le type de talents que vous recherchez."
              />
            </div>
            <div className="form-field full">
              <label>Valeurs ou points forts</label>
              <textarea
                className="textarea"
                name="career_values"
                defaultValue={textAreaList(company?.career_values)}
                placeholder={"Une valeur par ligne\nExigence\nImpact\nEsprit d'équipe"}
              />
              <small>Une ligne devient une pastille sur la page publique.</small>
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile">
                <Gift aria-hidden="true" size={18} />
              </span>
              Avantages
            </div>
            <span className="status-badge">Site carrière</span>
          </div>
          <div className="form-body">
            <div className="form-field">
              <label>Avantages candidats</label>
              <textarea
                className="textarea"
                name="career_benefits"
                defaultValue={textAreaList(company?.career_benefits)}
                placeholder={"Un avantage par ligne\nAssurance santé\nTélétravail partiel\nFormation continue"}
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile">
                <Images aria-hidden="true" size={18} />
              </span>
              Photos
            </div>
            <span className="status-badge">3 max</span>
          </div>
          <div className="form-body form-grid">
            {(company?.career_gallery_paths ?? []).slice(0, 3).map((path) => (
              <input key={path} type="hidden" name="career_gallery_existing" value={path} />
            ))}
            {[1, 2, 3].map((index) => (
              <div className="form-field" key={index}>
                <label>Photo {index}</label>
                <div className="upload-box">
                  <span className="icon-tile">
                    <Image aria-hidden="true" size={18} />
                  </span>
                  <div>
                    <strong>JPG ou PNG, max 2 Mo</strong>
                    <br />
                    <input className="input" name={`career_gallery_${index}`} type="file" accept="image/png,image/jpeg" />
                  </div>
                </div>
              </div>
            ))}
            {company?.career_gallery_paths?.length ? (
              <div className="form-field full">
                <small>Photos déjà enregistrées : {company.career_gallery_paths.slice(0, 3).join(", ")}</small>
              </div>
            ) : null}
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile">
                <HeartHandshake aria-hidden="true" size={18} />
              </span>
              Connect
            </div>
            <span className="status-badge">Vivier</span>
          </div>
          <div className="form-body form-grid">
            <label className="check-row full">
              <input
                name="career_connect_enabled"
                type="checkbox"
                defaultChecked={company?.career_connect_enabled ?? true}
              />{" "}
              <span>Permettre aux candidats d'envoyer leur CV sans postuler à une offre</span>
            </label>
            <div className="form-field">
              <label>Titre Connect</label>
              <input
                className="input"
                name="career_connect_title"
                defaultValue={company?.career_connect_title ?? ""}
                placeholder="Ex : Rejoignez notre vivier"
              />
            </div>
            <div className="form-field">
              <label>Description Connect</label>
              <input
                className="input"
                name="career_connect_description"
                defaultValue={company?.career_connect_description ?? ""}
                placeholder="Expliquez quand et pourquoi vous recontacterez les talents."
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile">
                <Globe aria-hidden="true" size={18} />
              </span>
              Présence en ligne
            </div>
            <span className="status-badge">À compléter</span>
          </div>
          <div className="form-body form-grid">
            <div className="form-field full">
              <label>Site web</label>
              <input
                className="input"
                name="website"
                defaultValue={company?.website ?? ""}
                placeholder="https://www.votre-entreprise.mg"
              />
            </div>
          </div>
        </section>

        <div className="sticky-actions">
          <button className="btn btn-soft" type="reset">
            <RotateCcw aria-hidden="true" size={18} />
            Annuler
          </button>
          <button className="btn btn-primary" type="submit">
            <Save aria-hidden="true" size={18} />
            Enregistrer les modifications
          </button>
        </div>
      </form>
      {reviewCompanyId ? (
        <form action={submitCompanyForReview.bind(null, reviewCompanyId)} className="review-company-form">
          <button className="btn btn-outline" type="submit">
            Envoyer l'entreprise en revue
          </button>
        </form>
      ) : null}
    </>
  );
}
