import Link from "next/link";
import { BriefcaseBusiness, Eye, FileText, Globe, Save } from "lucide-react";

import { demoRecruiterCompany } from "@/features/demo/workspace";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function RecruiterCompanyPage() {
  const { isDemo } = await requireRole(["recruiter"]);
  const company = isDemo ? demoRecruiterCompany : null;

  return (
    <>
      <div className="recruiter-top">
        <div className="recruiter-top-main">
          <div className="progress-ring">70%</div>
          <div>
            <h1>Profil de l'entreprise</h1>
            <p>Complétez votre profil pour attirer plus de candidats.</p>
          </div>
        </div>
        <Link className="btn btn-outline" href="/emploi">
          <Eye aria-hidden="true" size={18} />
          Voir ma page
        </Link>
      </div>

      <form>
        <section className="form-section">
          <div className="form-section-head">
            <div className="form-section-title">
              <span className="icon-tile">
                <BriefcaseBusiness aria-hidden="true" size={18} />
              </span>
              Identité
            </div>
            <span className="status-badge">À compléter</span>
          </div>
          <div className="form-body form-grid">
            <div className="form-field full">
              <label>Logo de l'entreprise</label>
              <div className="upload-box">
                <div className="avatar">{company?.name?.charAt(0) ?? "J"}</div>
                <div>
                  <strong>Format JPG ou PNG, max 2 Mo</strong>
                  <br />
                  <button className="btn btn-primary" type="button">
                    Télécharger un logo
                  </button>
                </div>
              </div>
            </div>
            <div className="form-field">
              <label>Nom de l'entreprise</label>
              <input className="input" defaultValue={company?.name ?? ""} placeholder="Nom de l'entreprise" />
            </div>
            <div className="form-field">
              <label>Secteur d'activité</label>
              <select className="select" defaultValue={company?.sector ?? ""}>
                <option value="">Sélectionner un secteur</option>
                <option>Informatique & Digital</option>
                <option>BPO & Relation client</option>
                <option>Commerce & Distribution</option>
              </select>
            </div>
            <div className="form-field">
              <label>Taille de l'entreprise</label>
              <select className="select" defaultValue="">
                <option value="">Sélectionner la taille</option>
                <option>1 à 10 employés</option>
                <option>11 à 50 employés</option>
                <option>51 à 200 employés</option>
              </select>
            </div>
            <div className="form-field">
              <label>Ville / Siège</label>
              <input className="input" defaultValue={company?.city ?? ""} placeholder="Ex : Antananarivo" />
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
          <div className="form-body">
            <div className="form-field">
              <label>Description de l'entreprise</label>
              <textarea className="textarea" placeholder="Parlez de vos activités, votre culture, vos valeurs" />
              <small>Astuce : mentionnez ce qui rend votre entreprise unique.</small>
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
              <input className="input" placeholder="https://www.votre-entreprise.mg" />
            </div>
            <div className="form-field">
              <label>Facebook</label>
              <input className="input" placeholder="https://facebook.com/votre-page" />
            </div>
            <div className="form-field">
              <label>LinkedIn</label>
              <input className="input" placeholder="https://linkedin.com/company/votre-page" />
            </div>
          </div>
        </section>

        <div className="sticky-actions">
          <button className="btn btn-soft" type="button">
            Annuler
          </button>
          <button className="btn btn-primary" type="button">
            <Save aria-hidden="true" size={18} />
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </>
  );
}
