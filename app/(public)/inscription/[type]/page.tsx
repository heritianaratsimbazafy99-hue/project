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

import { signUpWithPassword } from "@/features/auth/actions";
import { PublicHeader } from "@/features/public/components";

export const dynamic = "force-dynamic";

type SignupPageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const signupErrorMessages: Record<string, string> = {
  exists: "Ce compte existe déjà ou Supabase a refusé l'inscription. Essayez de vous connecter.",
  missing: "Complétez tous les champs obligatoires avec un mot de passe d'au moins 8 caractères.",
  workspace: "Le compte a été créé, mais l'espace métier n'a pas pu être préparé. Réessayez dans un instant."
};

export default async function SignupPage({ params, searchParams }: SignupPageProps) {
  const { type } = await params;
  const query = await searchParams;
  const isRecruiter = type === "recruteur";
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  if (type !== "candidat" && type !== "recruteur") {
    notFound();
  }

  const stats: Array<{ value: string; label: string; Icon: LucideIcon }> = isRecruiter
    ? [
        { value: "Visible", label: "sur les offres vérifiées", Icon: UserRound },
        { value: "CVthèque", label: "selon votre plan", Icon: FileText },
        { value: "Suivi", label: "des candidatures", Icon: Send }
      ]
    : [
        { value: "Offres", label: "publiées et vérifiées", Icon: FileText },
        { value: "Recruteurs", label: "validés par JobMada", Icon: Building2 },
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

            {error ? (
              <div className="login-alert signup-alert" role="alert">
                <strong>Inscription impossible</strong>
                <p>{signupErrorMessages[error] ?? signupErrorMessages.missing}</p>
              </div>
            ) : null}

            <form className="signup-asako-form" action={signUpWithPassword}>
              <input type="hidden" name="account_type" value={isRecruiter ? "recruiter" : "candidate"} />
              {isRecruiter ? (
                <label>
                  Nom de votre entreprise
                  <span className="signup-input-wrap">
                    <Building2 size={19} aria-hidden="true" />
                    <input name="company_name" placeholder="Ex: TeknetGroup" autoComplete="organization" required />
                  </span>
                </label>
              ) : null}

              <div className="signup-form-split">
                <label>
                  Prénom
                  <span className="signup-input-wrap">
                    <UserRound size={19} aria-hidden="true" />
                    <input name="first_name" placeholder={isRecruiter ? "Rivo" : "Hery"} autoComplete="given-name" required />
                  </span>
                </label>
                <label>
                  Nom
                  <span className="signup-input-wrap">
                    <UserRound size={19} aria-hidden="true" />
                    <input name="last_name" placeholder={isRecruiter ? "Rakoto" : "Ranaivo"} autoComplete="family-name" required />
                  </span>
                </label>
              </div>

              <label>
                {isRecruiter ? "Email professionnel" : "Email"}
                <span className="signup-input-wrap">
                  <Mail size={19} aria-hidden="true" />
                  <input
                    name="email"
                    placeholder={isRecruiter ? "vous@entreprise.mg" : "vous@email.com"}
                    type="email"
                    autoComplete="email"
                    required
                  />
                </span>
              </label>

              <label>
                {isRecruiter ? "Mot de passe" : "Métier recherché"}
                <span className="signup-input-wrap">
                  {isRecruiter ? <LockKeyhole size={19} aria-hidden="true" /> : <FileText size={19} aria-hidden="true" />}
                  <input
                    name={isRecruiter ? "password" : "desired_role"}
                    placeholder={isRecruiter ? "Minimum 8 caractères" : "Designer UI/UX, Comptable..."}
                    type={isRecruiter ? "password" : "text"}
                    autoComplete={isRecruiter ? "new-password" : "organization-title"}
                    required={isRecruiter}
                    minLength={isRecruiter ? 8 : undefined}
                  />
                  {isRecruiter ? <Eye size={19} aria-hidden="true" /> : null}
                </span>
              </label>

              {!isRecruiter ? (
                <label>
                  Mot de passe
                  <span className="signup-input-wrap">
                    <LockKeyhole size={19} aria-hidden="true" />
                    <input
                      name="password"
                      placeholder="Minimum 8 caractères"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <Eye size={19} aria-hidden="true" />
                  </span>
                </label>
              ) : null}

              <button className="signup-submit" type="submit">
                <Send size={20} aria-hidden="true" />
                {isRecruiter ? "Publier ma première offre" : "Déposer mon CV"}
              </button>
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
