import { CvUploadCard } from "@/features/candidate/components/cv-upload-card";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CandidateProfileRow = {
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  sector: string | null;
  desired_role: string | null;
  salary_expectation: string | null;
};

export default async function CandidateProfilePage() {
  const { user, profile } = await requireRole(["candidate"]);
  const supabase = await createSupabaseServerClient();
  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("first_name, last_name, city, sector, desired_role, salary_expectation")
    .eq("user_id", user.id)
    .maybeSingle<CandidateProfileRow>();

  return (
    <div className="candidateStack">
      <section className="candidateHero" aria-labelledby="profile-title">
        <p className="candidateEyebrow">Mon profil</p>
        <h1 id="profile-title">Votre dossier candidat</h1>
        <p>Gardez vos informations à jour pour envoyer des candidatures complètes et crédibles.</p>
      </section>

      <CvUploadCard />

      <div className="candidateTabs" aria-label="Sections du profil">
        <a href="#infos">Infos personnelles</a>
        <a href="#parcours">Parcours</a>
        <a href="#competences">Compétences</a>
      </div>

      <section className="candidateCard" id="infos" aria-labelledby="infos-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Infos personnelles</p>
            <h2 id="infos-title">Coordonnées</h2>
          </div>
        </div>

        <form className="candidateForm">
          <label>
            Prénom
            <input name="first_name" defaultValue={candidateProfile?.first_name ?? ""} />
          </label>
          <label>
            Nom
            <input name="last_name" defaultValue={candidateProfile?.last_name ?? ""} />
          </label>
          <label>
            Email
            <input name="email" type="email" defaultValue={profile.email || user.email || ""} />
          </label>
          <label>
            Téléphone
            <input name="phone" type="tel" defaultValue={profile.phone ?? ""} />
          </label>
          <label>
            Ville
            <input name="city" defaultValue={candidateProfile?.city ?? ""} />
          </label>
          <label>
            Secteur
            <input name="sector" defaultValue={candidateProfile?.sector ?? ""} />
          </label>
          <label>
            Poste recherché
            <input name="desired_role" defaultValue={candidateProfile?.desired_role ?? ""} />
          </label>
          <label>
            Prétention salariale
            <input name="salary_expectation" defaultValue={candidateProfile?.salary_expectation ?? ""} />
          </label>
          <div className="candidateFormActions">
            <button type="button">Enregistrer le profil</button>
          </div>
        </form>
      </section>

      <section className="candidateCard" aria-labelledby="security-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Sécurité</p>
            <h2 id="security-title">Accès au compte</h2>
          </div>
          <button type="button">Modifier le mot de passe</button>
        </div>
      </section>

      <section className="candidateCard" id="parcours" aria-labelledby="journey-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Parcours</p>
            <h2 id="journey-title">Expériences et formations</h2>
          </div>
        </div>
        <div className="candidatePanelGrid">
          <div className="candidateEmptyState">
            <h3>Aucune expérience ajoutée</h3>
            <p>Ajoutez vos expériences pour aider les recruteurs à comprendre votre parcours.</p>
            <button type="button">Ajouter une expérience</button>
          </div>
          <div className="candidateEmptyState">
            <h3>Aucune formation ajoutée</h3>
            <p>Ajoutez vos diplômes, certificats ou formations professionnelles.</p>
            <button type="button">Ajouter une formation</button>
          </div>
        </div>
      </section>

      <section className="candidateCard" id="competences" aria-labelledby="skills-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Compétences</p>
            <h2 id="skills-title">Ce que vous savez faire</h2>
          </div>
        </div>
        <div className="candidateSkillGrid">
          <label>
            Compétences techniques
            <textarea name="hard_skills" placeholder="Excel, React, comptabilité, conduite..." />
          </label>
          <label>
            Soft skills
            <textarea name="soft_skills" placeholder="Leadership, rigueur, relation client..." />
          </label>
          <label>
            Langues
            <textarea name="languages" placeholder="Malagasy, français, anglais..." />
          </label>
        </div>
      </section>
    </div>
  );
}
