import Link from "next/link";
import { Building2, Eye, FileText, LockKeyhole, LogIn, Mail } from "lucide-react";

import { signInWithPassword } from "@/features/auth/actions";
import { PublicHeader } from "@/features/public/components";

export const dynamic = "force-dynamic";

type ConnexionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConnexionPage({ searchParams }: ConnexionPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const signup = Array.isArray(params.signup) ? params.signup[0] : params.signup;

  return (
    <>
      <PublicHeader variant="auth" />
      <main className="login-main">
        <section className="login-card-shell" aria-labelledby="login-title">
          <div className="login-card">
            <div className="login-heading">
              <h1 id="login-title">
                Content de <strong>vous revoir</strong>
              </h1>
              <p>Connectez-vous pour accéder à votre espace</p>
            </div>
            {error ? (
              <div className="login-alert" role="alert">
                <strong>Connexion impossible</strong>
                <p>Vérifiez votre email, votre mot de passe ou la configuration Supabase.</p>
              </div>
            ) : null}
            {signup === "check-email" ? (
              <div className="login-alert login-success" role="status">
                <strong>Compte créé</strong>
                <p>Confirmez votre email si Supabase le demande, puis connectez-vous à votre espace.</p>
              </div>
            ) : null}
            <form className="login-form" action={signInWithPassword}>
              <label className="login-field">
                <span>Adresse email</span>
                <div className="login-input-wrap">
                  <Mail size={21} aria-hidden="true" />
                  <input name="email" placeholder="votre@email.com" type="email" autoComplete="email" required />
                </div>
              </label>
              <label className="login-field">
                <span className="login-label-row">
                  <span>Mot de passe</span>
                  <Link href="/connexion?reset=1">Mot de passe oublié ?</Link>
                </span>
                <div className="login-input-wrap">
                  <LockKeyhole size={21} aria-hidden="true" />
                  <input
                    name="password"
                    placeholder="Votre mot de passe"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                  <Eye size={21} aria-hidden="true" />
                </div>
              </label>
              <button className="login-submit" type="submit">
                <LogIn size={22} aria-hidden="true" />
                Se connecter
              </button>
            </form>
            <div className="login-divider">
              <span />
              <p>Pas encore de compte ?</p>
              <span />
            </div>
            <div className="login-signup-grid">
              <Link className="login-signup-card candidate" href="/inscription/candidat">
                <span>
                  <FileText size={28} aria-hidden="true" />
                </span>
                <strong>Je cherche un emploi</strong>
                <small>Créez votre profil gratuitement</small>
              </Link>
              <Link className="login-signup-card recruiter" href="/inscription/recruteur">
                <span>
                  <Building2 size={28} aria-hidden="true" />
                </span>
                <strong>Je recrute</strong>
                <small>Publiez votre première offre</small>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="login-footer-band" aria-hidden="true" />
    </>
  );
}
