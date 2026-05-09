import Link from "next/link";
import { Clock, Star, Zap } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function RecruiterSelectionPage() {
  await requireRole(["recruiter"]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Ma sélection</h1>
          <p>Vos candidats enregistrés et vos profils consultés récemment.</p>
        </div>
      </div>

      <div className="segmented selection-tabs">
        <button className="active" type="button">
          <Star aria-hidden="true" size={18} />
          Ma sélection (0)
        </button>
        <button type="button">
          <Clock aria-hidden="true" size={18} />
          Consultés récemment (0)
        </button>
      </div>

      <section className="empty-state selection-empty">
        <Zap aria-hidden="true" size={26} />
        <h2>Passez à Starter pour enregistrer des profils</h2>
        <p>La CVthèque et les favoris candidat sont inclus dans les plans Starter, Booster et Agence.</p>
        <Link className="btn btn-primary" href="/recruteur/abonnement">
          Voir les plans
        </Link>
      </section>
    </>
  );
}
