import { reviewPlanChangeRequestAndRefresh } from "@/features/subscriptions/actions";
import { planEntitlements } from "@/features/subscriptions/plans";
import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlanChangeRequestStatus, SubscriptionPlan } from "@/types/database";

export const dynamic = "force-dynamic";

type AdminSubscriptionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type PlanChangeRequestRow = {
  id: string;
  requested_plan: SubscriptionPlan;
  status: PlanChangeRequestStatus;
  requested_at: string;
  review_note: string | null;
  company:
    | {
        name: string;
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
      }
    | Array<{
        name: string;
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
      }>
    | null;
};

const statusLabels: Record<PlanChangeRequestStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
  canceled: "Annulée"
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function ownerLabel(request: PlanChangeRequestRow) {
  const company = firstRelation(request.company);
  const owner = firstRelation(company?.owner);

  return owner?.display_name || owner?.email || "Recruteur inconnu";
}

function companyName(request: PlanChangeRequestRow) {
  return firstRelation(request.company)?.name || "Entreprise inconnue";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MG", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export default async function AdminSubscriptionsPage({ searchParams }: AdminSubscriptionsPageProps) {
  await requireRole(["admin"]);
  const query = await searchParams;
  const updated = firstQueryValue(query.updated);
  const errorMessage = firstQueryValue(query.error);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("plan_change_requests")
    .select("id, requested_plan, status, requested_at, review_note, company:companies(name, owner:profiles(display_name, email))")
    .order("requested_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Impossible de charger les demandes d'abonnement.");
  }

  const requests = (data ?? []) as unknown as PlanChangeRequestRow[];

  return (
    <div className="adminStack">
      <section className="adminHero compact" aria-labelledby="admin-subscriptions-title">
        <p className="adminEyebrow">Abonnements</p>
        <h1 id="admin-subscriptions-title">Demandes de changement de plan</h1>
        <p>Validez manuellement les demandes de plan avant d'ouvrir les quotas et accès CVthèque.</p>
      </section>

      {updated ? <div className="notice-line">{updated}</div> : null}
      {errorMessage ? <div className="notice-line is-error">{errorMessage}</div> : null}

      {requests.length > 0 ? (
        <div className="adminTable" role="table" aria-label="Demandes de plan">
          <div className="adminTableHeader" role="row">
            <span role="columnheader">Entreprise</span>
            <span role="columnheader">Plan demandé</span>
            <span role="columnheader">Statut</span>
            <span role="columnheader">Demandé le</span>
            <span role="columnheader">Décision</span>
          </div>
          {requests.map((request) => {
            const entitlement = planEntitlements[request.requested_plan];

            return (
              <article key={request.id} className="adminTableRow" role="row">
                <div role="cell">
                  <strong>{companyName(request)}</strong>
                  <span>{ownerLabel(request)}</span>
                </div>
                <span role="cell">
                  {entitlement.label} · {entitlement.jobQuota >= 999 ? "illimité" : `${entitlement.jobQuota} offres`}
                </span>
                <span className="adminStatus" role="cell">
                  {statusLabels[request.status]}
                </span>
                <time role="cell" dateTime={request.requested_at}>
                  {formatDate(request.requested_at)}
                </time>
                <div className="adminActions" role="cell">
                  {request.review_note ? <span className="adminActionHint">Note: {request.review_note}</span> : null}
                  {request.status === "pending" ? (
                    <>
                      <form action={reviewPlanChangeRequestAndRefresh.bind(null, request.id, "approve")}>
                        <button type="submit">Approuver</button>
                      </form>
                      <form action={reviewPlanChangeRequestAndRefresh.bind(null, request.id, "reject")}>
                        <label>
                          Note de rejet
                          <textarea name="note" required minLength={5} placeholder="Expliquez la décision." />
                        </label>
                        <button className="isDanger" type="submit">
                          Rejeter
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="adminEmptyState" aria-labelledby="admin-subscriptions-empty-title">
          <h2 id="admin-subscriptions-empty-title">Aucune demande en attente</h2>
          <p>Les demandes créées depuis l'espace recruteur apparaîtront ici.</p>
        </section>
      )}
    </div>
  );
}
