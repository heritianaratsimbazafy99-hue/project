import Link from "next/link";

import { signInWithPassword } from "@/features/auth/actions";
import { PublicFooter, PublicHeader } from "@/features/public/components";

export const dynamic = "force-dynamic";

type ConnexionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConnexionPage({ searchParams }: ConnexionPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <>
      <PublicHeader />
      <main>
        <section className="auth-shell">
          <div className="auth-art">
            <h1>Votre espace JobMada vous attend.</h1>
            <p>Connectez-vous pour retrouver vos candidatures, vos offres recruteur ou votre file de revue admin.</p>
          </div>
          <div className="auth-card">
            <span className="eyebrow">Connexion</span>
            <h1>Accéder à mon compte</h1>
            {error ? (
              <div className="empty-state" role="alert" style={{ padding: 16, marginTop: 18 }}>
                <strong>Connexion impossible</strong>
                <p>Vérifiez votre email, votre mot de passe ou la configuration Supabase.</p>
              </div>
            ) : null}
            <form action={signInWithPassword}>
              <input className="input" name="email" placeholder="Email" type="email" autoComplete="email" required />
              <input
                className="input"
                name="password"
                placeholder="Mot de passe"
                type="password"
                autoComplete="current-password"
                required
              />
              <button className="btn btn-primary" type="submit">
                Se connecter
              </button>
            </form>
            <div className="auth-links">
              <Link href="/inscription/candidat">Créer un profil candidat</Link>
              <Link href="/inscription/recruteur">Créer un espace recruteur</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
