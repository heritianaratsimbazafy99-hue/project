import Link from "next/link";
import { FileSearch, LockKeyhole, ShieldCheck, Zap } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CompanySubscriptionRow = {
  id: string;
  subscriptions?: { plan: string; cv_access_enabled: boolean } | Array<{ plan: string; cv_access_enabled: boolean }> | null;
};

function firstSubscription(company: CompanySubscriptionRow | null) {
  const subscriptions = company?.subscriptions;
  return Array.isArray(subscriptions) ? subscriptions[0] : subscriptions;
}

export default async function RecruiterCvLibraryPage() {
  const { user, isDemo } = await requireRole(["recruiter"]);
  let company: CompanySubscriptionRow | null = null;

  if (!isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("companies")
      .select("id, subscriptions(plan, cv_access_enabled)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<CompanySubscriptionRow>();

    company = data;
  }

  const subscription = firstSubscription(company);
  const hasCvAccess = Boolean(subscription?.cv_access_enabled);
  const planLabel = subscription?.plan ? subscription.plan.toUpperCase() : "GRATUIT";

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>CVthèque JobMada</h1>
          <p>Accès aux profils candidat selon votre plan et les autorisations JobMada.</p>
        </div>
      </div>

      <section className="cv-stats" aria-label="Statistiques CVthèque">
        {([
          [planLabel, "Plan actuel", FileSearch],
          [hasCvAccess ? "Activé" : "Non activé", "Accès CVthèque", LockKeyhole],
          ["V1", "Accès contrôlé", ShieldCheck]
        ] as const).map(([value, label, Icon]) => (
          <article className="metric-card" key={String(label)}>
            <span className="icon-tile">
              <Icon aria-hidden="true" size={18} />
            </span>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="limited-cv">
        <div className="notice-line">
          <Zap aria-hidden="true" size={18} />
          <strong>CVthèque non disponible en libre recherche</strong>
          <span>La V1 affiche uniquement les candidats ayant postulé à vos offres dans l'espace candidatures.</span>
        </div>
        <div className="upgrade-card">
          <strong>ACCÈS CVTHÈQUE</strong>
          <p>Demandez un plan avec accès CVthèque pour activer la recherche de profils lorsqu'elle sera validée pour votre entreprise.</p>
          <Link className="btn btn-primary" href="/recruteur/abonnement">
            Voir les plans
          </Link>
          <Link className="btn btn-outline" href="/recruteur/candidatures">
            Voir mes candidatures
          </Link>
        </div>
      </section>
    </>
  );
}
