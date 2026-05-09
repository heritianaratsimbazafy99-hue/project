import Link from "next/link";

import { PublicFooter, PublicHeader, PublicIcons } from "@/features/public/components";

const plans = [
  {
    name: "Gratuit",
    price: "0 Ar",
    audience: "Pour tester JobMada",
    features: ["2 offres par mois", "Visibilité 7 jours", "Profil entreprise", "Pipeline basique"],
    featured: false
  },
  {
    name: "Starter",
    price: "49 000 Ar",
    audience: "Pour recruter régulièrement",
    features: ["10 offres par mois", "CVthèque limitée", "Boost sur les offres", "Support prioritaire"],
    featured: true
  },
  {
    name: "Booster",
    price: "129 000 Ar",
    audience: "Pour les équipes RH actives",
    features: ["Offres illimitées", "CVthèque complète", "Matching IA", "Statistiques avancées"],
    featured: false
  }
];

export default function PricingPage() {
  const { BriefcaseBusiness, FileText, Send, Users } = PublicIcons;

  return (
    <>
      <PublicHeader />
      <main>
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow">Tarifs recruteurs</span>
            <h1>
              Recrutez <span className="underline">sans compter</span>, payez selon vos besoins
            </h1>
            <p>De la startup qui embauche son premier collaborateur au BPO qui recrute chaque semaine.</p>
          </div>
        </section>

        <section className="section">
          <div className="container" style={{ textAlign: "center" }}>
            <div className="pricing-grid">
              {plans.map((plan) => (
                <article key={plan.name} className={`price-card ${plan.featured ? "featured" : ""}`}>
                  {plan.featured ? (
                    <span className="pill rose" style={{ position: "absolute", right: 18, top: 18 }}>
                      POPULAIRE
                    </span>
                  ) : null}
                  <span className="icon-tile">
                    <BriefcaseBusiness size={18} aria-hidden="true" />
                  </span>
                  <h3>{plan.name}</h3>
                  <p>{plan.audience}</p>
                  <div className="price">
                    {plan.price} <small>/mois</small>
                  </div>
                  <ul className="feature-list">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <Link className={`btn ${plan.featured ? "btn-primary" : "btn-outline"}`} href="/inscription/recruteur">
                    {plan.price === "0 Ar" ? "Commencer gratuitement" : `Choisir ${plan.name}`}
                  </Link>
                </article>
              ))}
            </div>
            <div className="included-strip">
              <strong>Inclus dans tous les plans</strong>
              <span>
                <FileText size={18} aria-hidden="true" /> Google Jobs
              </span>
              <span>
                <Send size={18} aria-hidden="true" /> Pipeline de suivi
              </span>
              <span>
                <Users size={18} aria-hidden="true" /> Page entreprise
              </span>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
