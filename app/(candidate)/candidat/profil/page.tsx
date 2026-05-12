import { CheckCircle2, Circle, FileText, ShieldCheck, Target } from "lucide-react";

import { CvUploadCard } from "@/features/candidate/components/cv-upload-card";
import {
  addCandidateEducationAndRedirect,
  addCandidateExperienceAndRedirect,
  deleteCandidateCvAndRedirect,
  saveCandidateProfileAndRedirect,
  saveCandidateSkillsAndRedirect,
  updateCandidatePasswordAndRedirect
} from "@/features/candidate/actions";
import { demoCandidateProfile } from "@/features/demo/workspace";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CandidateProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
};

type CandidateExperienceRow = {
  id: string;
  title: string;
  company: string;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
};

type CandidateEducationRow = {
  id: string;
  school: string;
  degree: string;
  field: string | null;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
};

type CandidateSkillRow = {
  kind: "hard" | "soft" | "language";
  label: string;
};

const candidateCities = [
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
  "Toliara",
  "Télétravail"
];

const candidateSectors = [
  "Informatique & Digital",
  "Centres d'appels & BPO",
  "Commerce & Vente",
  "Marketing, Communication & Médias",
  "Banque, Finance & Comptabilité",
  "Gestion, Administration & Secrétariat",
  "Ressources humaines",
  "Hôtellerie, Restauration & Tourisme",
  "BTP, Construction & Immobilier",
  "Industrie & Production",
  "Logistique, Transport & Supply Chain",
  "Santé & Médical",
  "Enseignement & Formation",
  "Juridique",
  "Agriculture & Agroalimentaire",
  "Textile, Mode & Confection",
  "Énergie, Mines & Environnement",
  "Associatif, ONG & Humanitaire",
  "Artisanat & Métiers techniques",
  "Sécurité & Gardiennage",
  "Services à la personne"
];

const salaryRanges = [
  "Moins de 500 000 Ar/mois",
  "500 000 — 1 000 000 Ar/mois",
  "1 000 000 — 2 000 000 Ar/mois",
  "Plus de 2 000 000 Ar/mois"
];

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatPeriod(startDate: string | null, endDate: string | null, isCurrent = false) {
  return [startDate || "Début à préciser", isCurrent ? "Aujourd'hui" : endDate || "Fin à préciser"].join(" - ");
}

function skillsText(skills: CandidateSkillRow[], kind: CandidateSkillRow["kind"]) {
  return skills
    .filter((skill) => skill.kind === kind)
    .map((skill) => skill.label)
    .join("\n");
}

export default async function CandidateProfilePage({ searchParams }: CandidateProfilePageProps) {
  const { user, profile, isDemo } = await requireRole(["candidate"]);
  let experiences: CandidateExperienceRow[] = [];
  let educations: CandidateEducationRow[] = [];
  let skills: CandidateSkillRow[] = [];
  let candidateProfile: CandidateProfileRow | null = isDemo
    ? {
        id: "demo-candidate-profile",
        first_name: "Candidat",
        last_name: "Démo",
        city: "Antananarivo",
        sector: "Informatique & Digital",
        desired_role: demoCandidateProfile.desired_role,
        salary_expectation: "",
        cv_path: demoCandidateProfile.cv_path
      }
    : null;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("candidate_profiles")
      .select("id, first_name, last_name, city, sector, desired_role, salary_expectation, cv_path")
      .eq("user_id", user.id)
      .maybeSingle<CandidateProfileRow>();

    candidateProfile = data;

    if (candidateProfile?.id) {
      const [experienceResult, educationResult, skillResult] = await Promise.all([
        supabase
          .from("candidate_experiences")
          .select("id, title, company, city, start_date, end_date, is_current, description")
          .eq("candidate_profile_id", candidateProfile.id)
          .order("start_date", { ascending: false }),
        supabase
          .from("candidate_educations")
          .select("id, school, degree, field, city, start_date, end_date, description")
          .eq("candidate_profile_id", candidateProfile.id)
          .order("start_date", { ascending: false }),
        supabase
          .from("candidate_skills")
          .select("kind, label")
          .eq("candidate_profile_id", candidateProfile.id)
          .order("kind", { ascending: true })
      ]);

      experiences = (experienceResult.data ?? []) as CandidateExperienceRow[];
      educations = (educationResult.data ?? []) as CandidateEducationRow[];
      skills = (skillResult.data ?? []) as CandidateSkillRow[];
    }
  }

  const query = await searchParams;
  const saved = firstQueryValue(query.saved);
  const cvUploaded = firstQueryValue(query.cv);
  const cvDeleted = firstQueryValue(query.cvDeleted);
  const experienceSaved = firstQueryValue(query.experience);
  const educationSaved = firstQueryValue(query.education);
  const skillsSaved = firstQueryValue(query.skills);
  const passwordSaved = firstQueryValue(query.password);
  const error = firstQueryValue(query.error);
  const profileGuide = [
    {
      done: Boolean(candidateProfile?.cv_path),
      hint: candidateProfile?.cv_path ? "CV prêt à être transmis" : "Ajoutez un fichier PDF ou Word",
      label: "CV",
      Icon: FileText
    },
    {
      done: Boolean(candidateProfile?.desired_role),
      hint: candidateProfile?.desired_role || "Indiquez le poste ciblé",
      label: "Poste recherché",
      Icon: Target
    },
    {
      done: Boolean(candidateProfile?.sector && candidateProfile?.city),
      hint: [candidateProfile?.sector, candidateProfile?.city].filter(Boolean).join(" · ") || "Précisez secteur et ville",
      label: "Ciblage",
      Icon: ShieldCheck
    }
  ];

  return (
    <div className="candidateStack">
      <section className="candidateHero" aria-labelledby="profile-title">
        <p className="candidateEyebrow">Mon profil</p>
        <h1 id="profile-title">Votre dossier candidat</h1>
        <p>Déposez votre CV, complétez votre parcours et gardez un profil clair pour les recruteurs.</p>
      </section>

      <CvUploadCard cvPath={candidateProfile?.cv_path} />

      {saved ? (
        <div className="candidateNotice" role="status">
          Profil candidat enregistré.
        </div>
      ) : null}
      {cvUploaded ? (
        <div className="candidateNotice" role="status">
          CV candidat enregistré.
        </div>
      ) : null}
      {cvDeleted ? (
        <div className="candidateNotice" role="status">
          CV candidat supprimé.
        </div>
      ) : null}
      {experienceSaved ? (
        <div className="candidateNotice" role="status">
          Expérience ajoutée.
        </div>
      ) : null}
      {educationSaved ? (
        <div className="candidateNotice" role="status">
          Formation ajoutée.
        </div>
      ) : null}
      {skillsSaved ? (
        <div className="candidateNotice" role="status">
          Compétences enregistrées.
        </div>
      ) : null}
      {passwordSaved ? (
        <div className="candidateNotice" role="status">
          Mot de passe mis à jour.
        </div>
      ) : null}
      {error ? (
        <div className="candidateNotice isError" role="alert">
          {error}
        </div>
      ) : null}

      <div className="candidateTabs" aria-label="Sections du profil">
        <a href="#infos">Infos personnelles</a>
        <a href="#parcours">Parcours</a>
        <a href="#competences">Compétences</a>
      </div>

      <section className="candidateProfileGuide" aria-label="Priorités du profil">
        {profileGuide.map(({ done, hint, label, Icon }) => (
          <article key={label} className={done ? "isDone" : undefined}>
            <span aria-hidden="true">
              <Icon size={18} />
            </span>
            <div>
              <strong>{label}</strong>
              <small>{hint}</small>
            </div>
            {done ? <CheckCircle2 aria-hidden="true" size={18} /> : <Circle aria-hidden="true" size={18} />}
          </article>
        ))}
      </section>

      <section className="candidateCard" id="infos" aria-labelledby="infos-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Infos personnelles</p>
            <h2 id="infos-title">Coordonnées</h2>
          </div>
        </div>

        <form action={saveCandidateProfileAndRedirect} className="candidateForm">
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
            <input name="email" type="email" defaultValue={profile.email || user.email || ""} readOnly />
          </label>
          <label>
            Téléphone
            <input name="phone" type="tel" defaultValue={profile.phone ?? ""} />
          </label>
          <label>
            Ville
            <select name="city" defaultValue={candidateProfile?.city ?? ""}>
              <option value="">Sélectionner une ville</option>
              {candidateCities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </label>
          <label>
            Secteur
            <select name="sector" defaultValue={candidateProfile?.sector ?? ""}>
              <option value="">Sélectionner un secteur</option>
              {candidateSectors.map((sector) => (
                <option key={sector}>{sector}</option>
              ))}
            </select>
          </label>
          <label>
            Poste recherché
            <input name="desired_role" defaultValue={candidateProfile?.desired_role ?? ""} />
          </label>
          <label>
            Prétention salariale
            <select name="salary_expectation" defaultValue={candidateProfile?.salary_expectation ?? ""}>
              <option value="">Sélectionner une fourchette</option>
              {salaryRanges.map((range) => (
                <option key={range}>{range}</option>
              ))}
            </select>
          </label>
          <div className="candidateFormActions">
            <button type="submit">Enregistrer le profil</button>
          </div>
        </form>
      </section>

      <section className="candidateCard" id="parcours" aria-labelledby="journey-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Parcours</p>
            <h2 id="journey-title">Expériences et formations</h2>
          </div>
        </div>
        <div className="candidatePanelGrid">
          <div>
            <div className="candidateEmptyState">
              <h3>{experiences.length > 0 ? "Expériences" : "Aucune expérience ajoutée"}</h3>
              <p>Ajoutez vos expériences pour aider les recruteurs à comprendre votre parcours.</p>
            </div>
            {experiences.length > 0 ? (
              <div className="candidateAlertList">
                {experiences.map((experience) => (
                  <article key={experience.id}>
                    <div>
                      <strong>{experience.title}</strong>
                      <p>
                        {[experience.company, experience.city].filter(Boolean).join(" · ")}
                      </p>
                      <small>{formatPeriod(experience.start_date, experience.end_date, experience.is_current)}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            <form action={addCandidateExperienceAndRedirect} className="candidateForm compact">
              <label>
                Poste
                <input name="title" placeholder="Designer UI/UX" required />
              </label>
              <label>
                Entreprise
                <input name="company" placeholder="Media Click" required />
              </label>
              <label>
                Ville
                <input name="city" placeholder="Antananarivo" />
              </label>
              <label>
                Début
                <input name="start_date" type="date" />
              </label>
              <label>
                Fin
                <input name="end_date" type="date" />
              </label>
              <label>
                <input name="is_current" type="checkbox" /> Poste actuel
              </label>
              <label>
                Description
                <textarea name="description" placeholder="Missions, résultats, responsabilités..." />
              </label>
              <div className="candidateFormActions">
                <button type="submit">Ajouter une expérience</button>
              </div>
            </form>
          </div>
          <div>
            <div className="candidateEmptyState">
              <h3>{educations.length > 0 ? "Formations" : "Aucune formation ajoutée"}</h3>
              <p>Ajoutez vos diplômes, certificats ou formations professionnelles.</p>
            </div>
            {educations.length > 0 ? (
              <div className="candidateAlertList">
                {educations.map((education) => (
                  <article key={education.id}>
                    <div>
                      <strong>{education.degree}</strong>
                      <p>
                        {[education.school, education.field, education.city].filter(Boolean).join(" · ")}
                      </p>
                      <small>{formatPeriod(education.start_date, education.end_date)}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            <form action={addCandidateEducationAndRedirect} className="candidateForm compact">
              <label>
                École
                <input name="school" placeholder="Université d'Antananarivo" required />
              </label>
              <label>
                Diplôme
                <input name="degree" placeholder="Licence, Master, certificat..." required />
              </label>
              <label>
                Domaine
                <input name="field" placeholder="Design, gestion, informatique..." />
              </label>
              <label>
                Ville
                <input name="city" placeholder="Antananarivo" />
              </label>
              <label>
                Début
                <input name="start_date" type="date" />
              </label>
              <label>
                Fin
                <input name="end_date" type="date" />
              </label>
              <label>
                Description
                <textarea name="description" placeholder="Mention, spécialisation, projet marquant..." />
              </label>
              <div className="candidateFormActions">
                <button type="submit">Ajouter une formation</button>
              </div>
            </form>
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
        <form action={saveCandidateSkillsAndRedirect} className="candidateForm">
          <div className="candidateSkillGrid">
            <label>
              Compétences techniques
              <textarea
                name="hard_skills"
                defaultValue={skillsText(skills, "hard")}
                placeholder="Excel, React, comptabilité, conduite..."
              />
            </label>
            <label>
              Soft skills
              <textarea
                name="soft_skills"
                defaultValue={skillsText(skills, "soft")}
                placeholder="Leadership, rigueur, relation client..."
              />
            </label>
            <label>
              Langues
              <textarea
                name="languages"
                defaultValue={skillsText(skills, "language")}
                placeholder="Malagasy, français, anglais..."
              />
            </label>
          </div>
          <div className="candidateFormActions">
            <button type="submit">Enregistrer les compétences</button>
          </div>
        </form>
      </section>

      {candidateProfile?.cv_path ? (
        <section className="candidateCard" aria-labelledby="cv-management-title">
          <div className="candidateSectionHeader">
            <div>
              <p className="candidateEyebrow">CV</p>
              <h2 id="cv-management-title">Gestion du fichier</h2>
            </div>
          </div>
          <form action={deleteCandidateCvAndRedirect} className="candidateForm compact">
            <p>Supprimez le CV actuel si vous souhaitez repartir avec un nouveau fichier.</p>
            <div className="candidateFormActions">
              <button type="submit">Supprimer le CV</button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="candidateCard candidateSecurityCard" aria-labelledby="security-title">
        <div className="candidateSectionHeader">
          <div>
            <p className="candidateEyebrow">Sécurité</p>
            <h2 id="security-title">Accès au compte</h2>
          </div>
        </div>
        <form action={updateCandidatePasswordAndRedirect} className="candidateForm compact">
          <label>
            Nouveau mot de passe
            <input name="password" type="password" minLength={8} autoComplete="new-password" />
          </label>
          <label>
            Confirmation
            <input name="password_confirm" type="password" minLength={8} autoComplete="new-password" />
          </label>
          <div className="candidateFormActions">
            <button type="submit">Mettre à jour le mot de passe</button>
          </div>
        </form>
      </section>
    </div>
  );
}
