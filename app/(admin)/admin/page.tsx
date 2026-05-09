import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();

  const [pendingJobsResult, pendingCompaniesResult, usersResult, applicationsResult] =
    await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true })
    ]);

  if (
    pendingJobsResult.error ||
    pendingCompaniesResult.error ||
    usersResult.error ||
    applicationsResult.error
  ) {
    throw new Error("Impossible de charger la vue admin.");
  }

  return (
    <div className="adminStack">
      <section className="adminHero" aria-labelledby="admin-overview-title">
        <p className="adminEyebrow">Modération</p>
        <h1 id="admin-overview-title">Vue d'ensemble admin</h1>
        <p>Suivez les files d'attente JobMada et validez les contenus prêts à partir en ligne.</p>
      </section>

      <section className="adminMetricGrid" aria-label="Indicateurs admin">
        <Link href="/admin/offres">
          <span>Offres en attente</span>
          <strong>{pendingJobsResult.count ?? 0}</strong>
          <p>À publier ou rejeter.</p>
        </Link>
        <Link href="/admin/entreprises">
          <span>Entreprises en attente</span>
          <strong>{pendingCompaniesResult.count ?? 0}</strong>
          <p>Fiches à vérifier.</p>
        </Link>
        <article>
          <span>Utilisateurs</span>
          <strong>{usersResult.count ?? 0}</strong>
          <p>Profils inscrits.</p>
        </article>
        <article>
          <span>Candidatures</span>
          <strong>{applicationsResult.count ?? 0}</strong>
          <p>Dossiers transmis.</p>
        </article>
      </section>
    </div>
  );
}
