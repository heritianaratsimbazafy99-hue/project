import Link from "next/link";
import { CheckCircle2, FileText, Gift, ShieldCheck, UserRound, Users } from "lucide-react";

import { submitCooptationReferralAndRedirect } from "@/features/cooptation/actions";
import { PublicFooter, PublicHeader } from "@/features/public/components";

export const dynamic = "force-dynamic";

type CooptationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CooptationPage({ searchParams }: CooptationPageProps) {
  const query = await searchParams;
  const sent = firstQueryValue(query.sent);
  const error = firstQueryValue(query.error);

  return (
    <>
      <PublicHeader active="/cooptation" />
      <main>
        <section className="page-hero cooptation-hero">
          <div className="container cooptation-hero-grid">
            <div>
              <span className="eyebrow">Cooptation ouverte à tous</span>
              <h1>
                Cooptez un talent, <span className="underline">JobMada s'occupe du reste</span>
              </h1>
              <p>
                Recommandez une personne avec son CV. Si le candidat est reçu en entretien grâce à votre recommandation,
                vous recevez une récompense.
              </p>
              <div className="cooptation-hero-actions">
                <a className="btn btn-primary" href="#cooptation-form">
                  Cooptez maintenant
                </a>
                <Link className="btn btn-outline" href="/emploi">
                  Voir les offres
                </Link>
              </div>
            </div>
            <aside className="cooptation-reward-card" aria-label="Avantage cooptation">
              <span className="icon-tile">
                <Gift size={22} aria-hidden="true" />
              </span>
              <strong>Récompense à l'entretien</strong>
              <p>Le coopteur est récompensé quand le candidat recommandé est reçu en entretien par une entreprise.</p>
            </aside>
          </div>
        </section>

        <section className="section">
          <div className="container cooptation-layout">
            <div className="cooptation-story">
              <div className="section-head">
                <h2 className="section-title">
                  <span className="icon-tile">
                    <Users size={18} aria-hidden="true" />
                  </span>
                  Comment <strong>ça marche ?</strong>
                </h2>
              </div>
              <div className="cooptation-steps">
                {[
                  {
                    Icon: UserRound,
                    title: "Vous recommandez",
                    body: "Vous indiquez vos coordonnées, celles du candidat et le poste ou secteur visé."
                  },
                  {
                    Icon: FileText,
                    title: "Vous ajoutez le CV",
                    body: "Le CV est stocké dans un espace privé, accessible uniquement à l'équipe JobMada."
                  },
                  {
                    Icon: CheckCircle2,
                    title: "On suit l'entretien",
                    body: "Si le candidat est reçu en entretien, votre récompense devient éligible."
                  }
                ].map(({ Icon, title, body }) => (
                  <article key={title}>
                    <span>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="cooptation-security-note">
                <ShieldCheck size={18} aria-hidden="true" />
                <p>Ouvert à tous, sans création de compte. Les informations transmises servent uniquement au suivi de la cooptation.</p>
              </div>
            </div>

            <form
              id="cooptation-form"
              className="cooptation-form-card"
              action={submitCooptationReferralAndRedirect}
            >
              <div className="cooptation-form-heading">
                <span className="icon-tile">
                  <Gift size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2>Envoyer une cooptation</h2>
                  <p>Ajoutez un CV et les coordonnées utiles pour que JobMada puisse suivre le dossier.</p>
                </div>
              </div>

              {sent ? (
                <div className="notice-line" role="status">
                  Cooptation envoyée. Merci pour votre recommandation.
                </div>
              ) : null}
              {error ? (
                <div className="notice-line is-error" role="alert">
                  {error}
                </div>
              ) : null}

              <label className="cooptation-honeypot" aria-hidden="true">
                Entreprise
                <input name="company" tabIndex={-1} autoComplete="off" />
              </label>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="referrer_name">Votre nom *</label>
                  <input className="input" id="referrer_name" name="referrer_name" autoComplete="name" required />
                </div>
                <div className="form-field">
                  <label htmlFor="referrer_email">Votre email *</label>
                  <input className="input" id="referrer_email" name="referrer_email" type="email" autoComplete="email" required />
                </div>
                <div className="form-field full">
                  <label htmlFor="referrer_phone">Votre téléphone</label>
                  <input className="input" id="referrer_phone" name="referrer_phone" autoComplete="tel" />
                </div>
                <div className="form-field">
                  <label htmlFor="candidate_name">Nom du candidat *</label>
                  <input className="input" id="candidate_name" name="candidate_name" required />
                </div>
                <div className="form-field">
                  <label htmlFor="target_role">Poste ou secteur visé</label>
                  <input className="input" id="target_role" name="target_role" placeholder="Ex: Comptable, BPO, Développeur..." />
                </div>
                <div className="form-field">
                  <label htmlFor="candidate_email">Email candidat</label>
                  <input className="input" id="candidate_email" name="candidate_email" type="email" />
                </div>
                <div className="form-field">
                  <label htmlFor="candidate_phone">Téléphone candidat</label>
                  <input className="input" id="candidate_phone" name="candidate_phone" />
                </div>
                <div className="form-field full">
                  <label htmlFor="candidate_city">Ville du candidat</label>
                  <input className="input" id="candidate_city" name="candidate_city" placeholder="Ex: Antananarivo" />
                </div>
                <div className="form-field full">
                  <label htmlFor="message">Pourquoi recommandez-vous ce profil ?</label>
                  <textarea className="textarea" id="message" name="message" rows={4} />
                </div>
                <div className="form-field full">
                  <label htmlFor="candidate_cv">CV du candidat *</label>
                  <input
                    className="input file-input"
                    id="candidate_cv"
                    name="candidate_cv"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    required
                  />
                  <small>PDF, DOC ou DOCX, 10MB maximum.</small>
                </div>
              </div>
              <button className="btn btn-primary cooptation-submit" type="submit">
                Envoyer la cooptation
              </button>
            </form>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
