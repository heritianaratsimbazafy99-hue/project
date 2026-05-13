"use client";

import { Sparkles } from "lucide-react";

function fieldValue(name: string) {
  const field = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${name}"]`);

  return field?.value.trim() ?? "";
}

function setFieldValue(name: string, value: string) {
  const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);

  if (!field) {
    return;
  }

  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function buildDraft() {
  const title = fieldValue("title") || "ce poste";
  const contract = fieldValue("contract") || "contrat";
  const city = fieldValue("city") || "Madagascar";
  const sector = fieldValue("sector") || "secteur";

  return {
    summary: `${title} - ${contract} base a ${city}, pour renforcer une equipe ${sector}.`,
    description: `Nous recherchons un profil ${title} pour accompagner la croissance de notre equipe a ${city}. Le poste s'inscrit dans un environnement ${sector}, avec des objectifs clairs, une forte collaboration interne et un impact direct sur les operations.`,
    missions: `- Piloter les missions principales liees au poste de ${title}.
- Collaborer avec les equipes internes et les parties prenantes.
- Suivre les priorites, livrables et indicateurs de performance.
- Proposer des ameliorations concretes pour gagner en qualite et en efficacite.`,
    profile: `- Experience pertinente sur un poste similaire.
- Bonne comprehension du secteur ${sector}.
- Sens de l'organisation, autonomie et communication claire.
- Capacite a travailler dans un contexte dynamique a ${city}.`
  };
}

export function JobDescriptionAssistant() {
  function applyDraft() {
    const draft = buildDraft();

    setFieldValue("summary", draft.summary);
    setFieldValue("description", draft.description);
    setFieldValue("missions", draft.missions);
    setFieldValue("profile", draft.profile);
  }

  return (
    <div className="ai-row full is-unlocked">
      <div>
        <strong>Améliorer avec l'IA</strong>
        <p>Assistant inclus dans votre plan : générez une première base éditable à partir des champs renseignés.</p>
      </div>
      <button className="btn btn-soft" type="button" onClick={applyDraft}>
        <Sparkles aria-hidden="true" size={17} />
        Générer un brouillon IA
      </button>
    </div>
  );
}
