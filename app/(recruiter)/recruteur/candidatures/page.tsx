import { BriefcaseBusiness, Eye, UsersRound } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function RecruiterApplicationsPage() {
  await requireRole(["recruiter"]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Candidatures reçues</h1>
          <p>0 candidatures au total</p>
        </div>
      </div>

      <section className="dashboard-grid applications-kpis" aria-label="Indicateurs candidatures">
        {([
          ["Total", "0", UsersRound, "0 candidatures"],
          ["Nouvelles", "0", BriefcaseBusiness, "Tout vu"],
          ["Consultées", "0", Eye, "Déjà vues"]
        ] as const).map(([label, value, Icon, hint]) => (
          <article className="metric-card" key={String(label)}>
            <span className="icon-tile">
              <Icon aria-hidden="true" size={18} />
            </span>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{hint}</span>
          </article>
        ))}
      </section>

      <section className="panel offers-panel">
        <div className="toolbar">
          <input className="input" placeholder="Rechercher un candidat ou une offre..." />
          <select className="select" defaultValue="all">
            <option value="all">Toutes les offres</option>
          </select>
          <select className="select" defaultValue="recent">
            <option value="recent">Plus récentes</option>
            <option value="match">Meilleur score</option>
            <option value="name">Nom A-Z</option>
          </select>
        </div>
        <div className="status-tabs">
          {["Toutes", "À traiter", "Consultées", "Shortlistées", "Rejetées"].map((label, index) => (
            <button className={index === 0 ? "active" : undefined} type="button" key={label}>
              {label}
            </button>
          ))}
        </div>
        <div className="empty-state recruiter-empty">
          <BriefcaseBusiness aria-hidden="true" size={24} />
          <p>Aucune candidature</p>
        </div>
        <div className="panel-footer">
          <span>0 candidatures affichées</span>
        </div>
      </section>
    </>
  );
}
