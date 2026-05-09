import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicFooter, PublicHeader } from "@/features/public/components";
import { publicSectors } from "@/features/public/demo-data";

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

  return (
    <>
      <PublicHeader />
      <main>
        <section className="auth-shell">
          <div className="auth-art">
            <h1>{isRecruiter ? "Publiez votre première offre en 2 minutes." : "Votre prochain emploi commence ici."}</h1>
            <p>
              {isRecruiter
                ? "Créez votre espace recruteur, gérez vos offres et trouvez des profils qualifiés."
                : "Créez votre profil, déposez votre CV et postulez en un clic."}
            </p>
          </div>
          <div className="auth-card">
            <span className="eyebrow">{isRecruiter ? "JobMada Recruteur" : "Espace candidat"}</span>
            <h1>{isRecruiter ? "Créer un compte recruteur" : "Créer mon profil"}</h1>
            <form>
              <input className="input" placeholder={isRecruiter ? "Nom de l'entreprise" : "Nom complet"} />
              <input className="input" placeholder="Email" type="email" />
              <input className="input" placeholder="Mot de passe" type="password" />
              <select className="select" defaultValue="">
                <option value="">{isRecruiter ? "Secteur d'activité" : "Métier recherché"}</option>
                {publicSectors.slice(0, 8).map(([sector]) => (
                  <option key={sector}>{sector}</option>
                ))}
              </select>
              <Link className="btn btn-primary" href="/connexion">
                {isRecruiter ? "Commencer gratuitement" : "Créer mon profil gratuitement"}
              </Link>
            </form>
            <div className="auth-links">
              <Link href="/connexion">J'ai déjà un compte</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
