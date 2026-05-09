import Link from "next/link";
import { FileSearch, Search, UsersRound, Zap } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

const demoProfiles = [
  {
    name: "Profil Marketing Senior",
    role: "Marketing digital",
    city: "Antananarivo",
    exp: "6 ans",
    skills: ["SEO", "Ads", "CRM"]
  },
  {
    name: "Candidat Frontend A",
    role: "React / UI",
    city: "Antsirabe",
    exp: "4 ans",
    skills: ["React", "Figma", "CSS"]
  },
  {
    name: "Profil Finance B",
    role: "Comptabilité",
    city: "Toamasina",
    exp: "8 ans",
    skills: ["Paie", "Sage", "Audit"]
  }
];

export default async function RecruiterCvLibraryPage() {
  await requireRole(["recruiter"]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>CVthèque JobMada</h1>
          <p>Trouvez le candidat idéal parmi nos profils qualifiés.</p>
        </div>
      </div>

      <section className="cv-stats" aria-label="Statistiques CVthèque">
        {([
          ["13 491+", "Profils disponibles", FileSearch],
          ["13 491+", "CVs analysés par l'IA", UsersRound],
          ["15+", "Secteurs couverts", Zap]
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

      <section className="cv-search-panel">
        <div className="segmented">
          <button className="active" type="button">
            <Search aria-hidden="true" size={18} />
            Recherche libre
          </button>
          <button type="button">
            <BriefcaseIcon />
            Matcher par offre
          </button>
        </div>
        <div className="panel">
          <h2>Décrivez le profil que vous cherchez</h2>
          <p>L'IA de JobMada trouve les candidats les plus pertinents pour votre recherche.</p>
          <div className="search-shell cv-search">
            <Search aria-hidden="true" size={18} />
            <input placeholder="Je recherche un développeur React, 3 ans d'expérience, Antananarivo..." />
            <button className="btn btn-primary" type="button">
              Rechercher
            </button>
          </div>
          <div className="popular-row">
            <strong>RECHERCHES POPULAIRES</strong>
            {["Développeur web", "Comptable", "Assistante RH", "Commercial"].map((label) => (
              <button type="button" key={label}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="limited-cv">
        <div className="notice-line">
          <Zap aria-hidden="true" size={18} />
          <strong>Accès limité à la CVthèque</strong>
          <span>Passez à un plan payant pour consulter les profils complets et contacter les candidats.</span>
        </div>
        <p>519 profils correspondent à votre recherche, voici les meilleurs aperçus.</p>
        <div className="cv-grid">
          {demoProfiles.map((profile) => (
            <article className="cv-card" key={profile.name}>
              <div className="candidate-card-head">
                <div className="avatar" aria-hidden="true">
                  {profile.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <strong>{profile.name}</strong>
                  <p>
                    {profile.role} · {profile.exp}
                  </p>
                </div>
              </div>
              <div className="skill-tags">
                {profile.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <p>{profile.city} · Disponible sous 15 jours</p>
              <button className="btn btn-outline" type="button">
                Ajouter à ma sélection
              </button>
            </article>
          ))}
        </div>
        <div className="upgrade-card">
          <strong>ACCÈS COMPLET CVTHÈQUE</strong>
          <p>Consultez ces profils et 40 000 autres avec un plan Starter, Booster ou Agence.</p>
          <Link className="btn btn-primary" href="/recruteur/abonnement">
            Voir tous les plans →
          </Link>
        </div>
      </section>
    </>
  );
}

function BriefcaseIcon() {
  return <FileSearch aria-hidden="true" size={18} />;
}
