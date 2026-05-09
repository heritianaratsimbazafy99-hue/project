import Link from "next/link";
import { BriefcaseBusiness, Circle, Layers, Star, TrendingUp, UsersRound, Zap } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

const plans = [
  ["Gratuit", "0 Ar/mois", "2 offres/mois, visibles 7 jours"],
  ["Starter", "80 000 Ar/mois", "10 offres/mois et statistiques"],
  ["Booster", "350 000 Ar/mois", "Offres illimitées et CVthèque"],
  ["Agence", "950 000 Ar/mois", "Sourcing avancé et support dédié"]
] as const;

export default async function RecruiterSubscriptionPage() {
  await requireRole(["recruiter"]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Mon abonnement</h1>
          <p>Gérez votre plan et suivez vos quotas.</p>
        </div>
      </div>

      <section className="panel plan-current">
        <div className="plan-current-head">
          <span className="icon-tile">
            <Circle aria-hidden="true" size={18} />
          </span>
          <div>
            <h2>
              Plan Gratuit <span className="status-badge ok">ACTIF</span>
            </h2>
            <p>0 Ar/mois · 2 offres/mois · Visible 7 jours</p>
          </div>
        </div>
        <div className="panel-footer">
          <span>Passez à un plan supérieur pour débloquer plus de fonctionnalités.</span>
          <Link className="btn btn-primary" href="#plans-recruteur">
            Voir les plans →
          </Link>
        </div>
      </section>

      <section className="panel quota-panel">
        <h2>
          <TrendingUp aria-hidden="true" size={20} />
          Quotas restants
        </h2>
        <div className="quota-grid">
          {([
            ["Offres", "1/2", 50, BriefcaseBusiness],
            ["Vedette", "—", 0, Star],
            ["Urgent", "—", 0, Zap],
            ["Remontée", "—", 0, TrendingUp],
            ["CVthèque", "—", 0, UsersRound],
            ["Campagnes", "Bientôt", 0, Layers]
          ] as const).map(([label, value, width, Icon]) => (
            <div key={String(label)}>
              <span>
                <Icon aria-hidden="true" size={16} /> {label}
              </span>
              <strong>{value}</strong>
              <div className="quota-bar">
                <span style={{ width: `${width}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel" id="plans-recruteur">
        <div className="panel-title-row">
          <h2>
            <Layers aria-hidden="true" size={20} />
            Changer de plan
          </h2>
          <div className="billing-toggle">
            <button className="active" type="button">
              Mensuel
            </button>
            <button type="button">Trimestriel -15%</button>
          </div>
        </div>
        <div className="pricing-grid">
          {plans.map(([name, price, feature]) => (
            <article className="price-card" key={name}>
              <h3>{name}</h3>
              <strong>{price}</strong>
              <p>{feature}</p>
              <button className={name === "Gratuit" ? "btn btn-outline" : "btn btn-primary"} type="button">
                {name === "Gratuit" ? "Plan actuel" : "Choisir"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel latest-empty">
        <h2>Historique des transactions</h2>
        <div className="empty-state">Aucune transaction pour le moment</div>
      </section>
    </>
  );
}
