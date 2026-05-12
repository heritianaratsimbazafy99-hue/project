import Link from "next/link";
import { KeyRound, LockKeyhole, Save } from "lucide-react";

import { updatePasswordFromRecovery } from "@/features/auth/actions";
import { PublicHeader } from "@/features/public/components";

export const dynamic = "force-dynamic";

type PasswordRecoveryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function recoveryErrorMessage(error: string | undefined) {
  if (error === "short") {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }

  if (error === "mismatch") {
    return "Les deux mots de passe ne correspondent pas.";
  }

  if (error === "update_failed") {
    return "Le mot de passe n'a pas pu être mis à jour. Demandez un nouveau lien.";
  }

  return null;
}

export default async function PasswordRecoveryPage({ searchParams }: PasswordRecoveryPageProps) {
  const query = await searchParams;
  const error = recoveryErrorMessage(firstQueryValue(query.error));

  return (
    <>
      <PublicHeader variant="auth" />
      <main className="login-main">
        <section className="login-card-shell" aria-labelledby="recovery-title">
          <div className="login-card">
            <div className="login-heading">
              <h1 id="recovery-title">
                Nouveau <strong>mot de passe</strong>
              </h1>
              <p>Choisissez un nouveau mot de passe pour votre compte JobMada.</p>
            </div>
            {error ? (
              <div className="login-alert" role="alert">
                <strong>Réinitialisation impossible</strong>
                <p>{error}</p>
              </div>
            ) : null}
            <form className="login-form" action={updatePasswordFromRecovery}>
              <label className="login-field">
                <span>Nouveau mot de passe</span>
                <div className="login-input-wrap">
                  <LockKeyhole size={21} aria-hidden="true" />
                  <input name="password" type="password" autoComplete="new-password" minLength={8} required />
                </div>
              </label>
              <label className="login-field">
                <span>Confirmer le mot de passe</span>
                <div className="login-input-wrap">
                  <KeyRound size={21} aria-hidden="true" />
                  <input name="password_confirm" type="password" autoComplete="new-password" minLength={8} required />
                </div>
              </label>
              <button className="login-submit" type="submit">
                <Save size={22} aria-hidden="true" />
                Mettre à jour
              </button>
            </form>
            <div className="login-divider">
              <span />
              <p>Lien expiré ?</p>
              <span />
            </div>
            <Link className="login-submit login-secondary-link" href="/connexion?reset=1">
              Demander un nouveau lien
            </Link>
          </div>
        </section>
      </main>
      <footer className="login-footer-band" aria-hidden="true" />
    </>
  );
}
