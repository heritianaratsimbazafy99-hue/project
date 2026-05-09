import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  LockKeyhole,
  Mail,
  Send,
  UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PublicHeader } from "@/features/public/components";

export const dynamic = "force-dynamic";

type SignupPageProps = {
  params: Promise<{ type: string }>;
};

export default async function SignupPage({ params }: SignupPageProps) {
  const { type } = await params;
  const isRecruiter = type === "recruteur";

  if (type !== "candidat" && type !== "recruteur") {
    notFound();
  }

  const stats: Array<{ value: string; label: string; Icon: LucideIcon }> = isRecruiter
    ? [
        { value: "5 000+", label: "visiteurs/jour", Icon: UserRound },
        { value: "40 000+", label: "CVs dans la base", Icon: FileText },
        { value: "~30", label: "candidatures/offre", Icon: Send }
      ]
    : [
        { value: "874+", label: "offres actives", Icon: FileText },
        { value: "1 392+", label: "recruteurs actifs", Icon: Building2 },
        { value: "2 min", label: "pour postuler", Icon: CheckCircle2 }
      ];

  return (
    <>
      <PublicHeader variant="auth" />
      <main>
        <section className="signup-asako-shell">
          <div className="signup-story">
            <span className="signup-kicker">{isRecruiter ? "JobMada Recruteur" : "JobMada Candidat"}</span>
            <h1>
              {isRecruiter ? (
                <>
                  Le recrutement à Madagascar, <strong>enfin simple</strong>
                </>
              ) : (
                <>
                  Votre recherche d'emploi, <strong>enfin simple</strong>
                </>
              )}
            </h1>
            <p>
              {isRecruiter
                ? "Publiez une offre, recevez des candidatures, suivez chaque profil dans votre pipeline — le tout depuis un seul outil, pensé pour vous."
                : "Créez votre profil, gardez votre CV prêt et postulez aux opportunités qui vous correspondent à Madagascar."}
            </p>
            <div className="signup-stat-grid" aria-label="Indicateurs JobMada">
              {stats.map(({ value, label, Icon }) => (
                <article key={label}>
                  <span>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <strong>{value}</strong>
                  <small>{label}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="signup-form-card">
            <div className="signup-form-heading">
              <span>
                <CheckCircle2 size={21} aria-hidden="true" />
              </span>
              <div>
                <h2>{isRecruiter ? "Créez votre espace recruteur" : "Créez votre espace candidat"}</h2>
                <p>{isRecruiter ? "Gratuit, prêt en 30 secondes" : "Gratuit, prêt à postuler"}</p>
              </div>
            </div>

            <form className="signup-asako-form">
              {isRecruiter ? (
                <label>
                  Nom de votre entreprise
                  <span className="signup-input-wrap">
                    <Building2 size={19} aria-hidden="true" />
                    <input placeholder="Ex: TeknetGroup" />
                  </span>
                </label>
              ) : null}

              <div className="signup-form-split">
                <label>
                  Prénom
                  <span className="signup-input-wrap">
                    <UserRound size={19} aria-hidden="true" />
                    <input placeholder={isRecruiter ? "Rivo" : "Hery"} />
                  </span>
                </label>
                <label>
                  Nom
                  <span className="signup-input-wrap">
                    <UserRound size={19} aria-hidden="true" />
                    <input placeholder={isRecruiter ? "Rakoto" : "Ranaivo"} />
                  </span>
                </label>
              </div>

              <label>
                {isRecruiter ? "Email professionnel" : "Email"}
                <span className="signup-input-wrap">
                  <Mail size={19} aria-hidden="true" />
                  <input placeholder={isRecruiter ? "vous@entreprise.mg" : "vous@email.com"} type="email" />
                </span>
              </label>

              <label>
                {isRecruiter ? "Mot de passe" : "Métier recherché"}
                <span className="signup-input-wrap">
                  {isRecruiter ? <LockKeyhole size={19} aria-hidden="true" /> : <FileText size={19} aria-hidden="true" />}
                  <input
                    placeholder={isRecruiter ? "Minimum 8 caractères" : "Designer UI/UX, Comptable..."}
                    type={isRecruiter ? "password" : "text"}
                  />
                  {isRecruiter ? <Eye size={19} aria-hidden="true" /> : null}
                </span>
              </label>

              {!isRecruiter ? (
                <label>
                  Mot de passe
                  <span className="signup-input-wrap">
                    <LockKeyhole size={19} aria-hidden="true" />
                    <input placeholder="Minimum 8 caractères" type="password" />
                    <Eye size={19} aria-hidden="true" />
                  </span>
                </label>
              ) : null}

              <Link className="signup-submit" href="/connexion">
                <Send size={20} aria-hidden="true" />
                {isRecruiter ? "Publier ma première offre" : "Déposer mon CV"}
              </Link>
            </form>

            <div className="signup-reassurance" aria-label="Avantages">
              <span>
                <CheckCircle2 size={15} aria-hidden="true" /> Gratuit
              </span>
              <span>
                <CheckCircle2 size={15} aria-hidden="true" /> Sans engagement
              </span>
              <span>
                <CheckCircle2 size={15} aria-hidden="true" /> 2 min
              </span>
            </div>

            <div className="signup-login-link">
              Déjà un compte ? <Link href="/connexion">Se connecter</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
