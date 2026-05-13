import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, ShieldCheck, Send, UserRound } from "lucide-react";

import { getVerifiedCompanyConnectBySlug } from "@/features/companies/career-queries";
import { submitCompanyConnectAndRedirect } from "@/features/companies/connect-actions";
import { CompanyLogo, PublicFooter, PublicHeader } from "@/features/public/components";

export const dynamic = "force-dynamic";

type CompanyConnectPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CompanyConnectPage({ params, searchParams }: CompanyConnectPageProps) {
  const { slug } = await params;
  const company = await getVerifiedCompanyConnectBySlug(slug);

  if (!company) {
    notFound();
  }

  const query = await searchParams;
  const sent = firstQueryValue(query.sent);
  const error = firstQueryValue(query.error);
  const connectTitle = company.career_connect_title || `Rejoindre le vivier ${company.name}`;
  const connectDescription =
    company.career_connect_description ||
    "Déposez votre CV pour être recontacté quand une opportunité correspond à votre profil.";

  return (
    <>
      <PublicHeader active="/emploi" />
      <main>
        <section className="page-hero company-connect-hero">
          <div className="container company-connect-heading">
            <Link className="back-link" href={`/entreprises/${company.slug}`}>
              <ArrowLeft size={17} aria-hidden="true" />
              Retour à la page entreprise
            </Link>
            <CompanyLogo name={company.name} logoPath={company.logo_path} large />
            <span className="eyebrow">Connect entreprise</span>
            <h1>{connectTitle}</h1>
            <p>{connectDescription}</p>
          </div>
        </section>

        <section className="section">
          <div className="container company-connect-layout">
            <form
              className="company-connect-form"
              action={submitCompanyConnectAndRedirect.bind(null, company.slug)}
            >
              <div className="cooptation-form-heading">
                <span className="icon-tile">
                  <UserRound size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2>Votre profil</h2>
                  <p>Votre CV sera transmis uniquement à {company.name} et à l'équipe JobMada.</p>
                </div>
              </div>

              {sent ? (
                <div className="notice-line" role="status">
                  {sent}
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
                <div className="form-field full">
                  <label htmlFor="full_name">Nom complet *</label>
                  <input className="input" id="full_name" name="full_name" autoComplete="name" required />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email *</label>
                  <input className="input" id="email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="form-field">
                  <label htmlFor="phone">Téléphone</label>
                  <input className="input" id="phone" name="phone" autoComplete="tel" />
                </div>
                <div className="form-field full">
                  <label htmlFor="desired_role">Poste recherché</label>
                  <input className="input" id="desired_role" name="desired_role" placeholder="Ex: Développeur, Comptable, RH..." />
                </div>
                <div className="form-field full">
                  <label htmlFor="message">Message</label>
                  <textarea className="textarea" id="message" name="message" rows={4} />
                </div>
                <div className="form-field full">
                  <label htmlFor="cv">CV *</label>
                  <input
                    className="input file-input"
                    id="cv"
                    name="cv"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    required
                  />
                  <small>PDF, DOC ou DOCX, 10MB maximum.</small>
                </div>
                <label className="connect-consent full">
                  <input name="consent_accepted" type="checkbox" required />
                  <span>J'accepte d'être contacté par {company.name} au sujet d'opportunités de recrutement.</span>
                </label>
              </div>

              <button className="btn btn-primary company-connect-submit" type="submit">
                <Send size={18} aria-hidden="true" />
                Envoyer mon profil
              </button>
            </form>

            <aside className="side-stack">
              <div className="side-card">
                <FileText size={22} aria-hidden="true" />
                <h3>Sans postuler à une offre</h3>
                <p>Connect crée une candidature spontanée rattachée à l'entreprise, utile pour les prochaines ouvertures.</p>
              </div>
              <div className="side-card">
                <ShieldCheck size={22} aria-hidden="true" />
                <h3>CV privé</h3>
                <p>Le fichier n'est pas public. Il est réservé au propriétaire de l'entreprise et aux administrateurs JobMada.</p>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
