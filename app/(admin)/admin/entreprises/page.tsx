import { reviewCompany } from "@/features/admin/actions";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompanyStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type PendingCompanyRow = {
  id: string;
  name: string;
  sector: string | null;
  city: string | null;
  status: CompanyStatus;
  created_at: string;
  owner:
    | {
        display_name: string | null;
        email: string | null;
      }
    | Array<{
        display_name: string | null;
        email: string | null;
      }>
    | null;
};

const statusLabels: Record<CompanyStatus, string> = {
  incomplete: "Incomplète",
  pending_review: "En revue",
  verified: "Vérifiée",
  rejected: "Rejetée"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MG", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function getOwnerLabel(owner: PendingCompanyRow["owner"]) {
  const profile = Array.isArray(owner) ? owner[0] : owner;

  return profile?.display_name || profile?.email || "Owner inconnu";
}

export default async function AdminCompaniesPage() {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, sector, city, status, created_at, owner:profiles(display_name, email)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Impossible de charger les entreprises à modérer.");
  }

  const companies = (data ?? []) as unknown as PendingCompanyRow[];

  return (
    <div className="adminStack">
      <section className="adminHero compact" aria-labelledby="admin-companies-title">
        <p className="adminEyebrow">Entreprises</p>
        <h1 id="admin-companies-title">Entreprises à modérer</h1>
        <p>Validez les fiches entreprise avant qu'elles soutiennent les candidatures publiques.</p>
      </section>

      {companies.length > 0 ? (
        <div className="adminTable companies" role="table" aria-label="Entreprises en attente">
          <div className="adminTableHeader" role="row">
            <span role="columnheader">Entreprise</span>
            <span role="columnheader">Propriétaire</span>
            <span role="columnheader">Statut</span>
            <span role="columnheader">Créée</span>
            <span role="columnheader">Décision</span>
          </div>
          {companies.map((company) => (
            <article key={company.id} className="adminTableRow" role="row">
              <div role="cell">
                <strong>{company.name}</strong>
                <span>
                  {company.sector || "Secteur à préciser"} · {company.city || "Ville à préciser"}
                </span>
              </div>
              <span role="cell">{getOwnerLabel(company.owner)}</span>
              <span className="adminStatus" role="cell">
                {statusLabels[company.status]}
              </span>
              <time role="cell" dateTime={company.created_at}>
                {formatDate(company.created_at)}
              </time>
              <div className="adminActions" role="cell">
                <form action={reviewCompany.bind(null, company.id, "approve")}>
                  <button type="submit">Approuver</button>
                </form>
                <form action={reviewCompany.bind(null, company.id, "reject")}>
                  <button className="isDanger" type="submit">
                    Rejeter
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="adminEmptyState" aria-labelledby="admin-companies-empty-title">
          <h2 id="admin-companies-empty-title">Aucune entreprise en attente</h2>
          <p>Les fiches soumises pour vérification seront listées ici.</p>
        </section>
      )}
    </div>
  );
}
