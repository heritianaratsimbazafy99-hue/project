import Link from "next/link";
import { FileText, Inbox, Mail, Phone, UserRound, Zap } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CompanyRow = {
  id: string;
};

type ConnectLeadRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  desired_role: string | null;
  message: string | null;
  cv_path: string;
  status: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  new: "Nouveau",
  reviewed: "Vu",
  contacted: "Contacté",
  archived: "Archivé"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function RecruiterTalentPoolPage() {
  const { user, isDemo } = await requireRole(["recruiter"]);
  let leads: ConnectLeadRow[] = [];
  const cvLinks = new Map<string, string>();

  if (isDemo) {
    leads = [
      {
        id: "demo-connect-miora",
        full_name: "Miora Rakoto",
        email: "miora@example.com",
        phone: "+261 34 11 222 33",
        desired_role: "Product designer",
        message: "Intéressée par vos prochains recrutements produit.",
        cv_path: "demo/cv.pdf",
        status: "new",
        created_at: new Date().toISOString()
      }
    ];
  } else {
    const supabase = await createSupabaseServerClient();
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<CompanyRow>();

    if (company) {
      const { data } = await supabase
        .from("company_connect_profiles")
        .select("id, full_name, email, phone, desired_role, message, cv_path, status, created_at")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .returns<ConnectLeadRow[]>();

      leads = data ?? [];

      await Promise.all(
        leads.map(async (lead) => {
          const { data: signedCv } = await supabase.storage.from("company-connect-cvs").createSignedUrl(lead.cv_path, 3600);
          if (signedCv?.signedUrl) {
            cvLinks.set(lead.id, signedCv.signedUrl);
          }
        })
      );
    }
  }

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Vivier Connect</h1>
          <p>Les profils spontanés transmis depuis votre site carrière entreprise.</p>
        </div>
      </div>

      <div className="segmented selection-tabs" aria-label="Vue active">
        <span className="active">
          <Inbox aria-hidden="true" size={18} />
          Profils Connect ({leads.length})
        </span>
      </div>

      {leads.length > 0 ? (
        <section className="cv-grid">
          {leads.map((lead) => (
            <article className="cv-card connect-lead-card" key={lead.id}>
              <div className="candidate-card-head">
                <div className="avatar" aria-hidden="true">
                  {initials(lead.full_name)}
                </div>
                <div>
                  <strong>{lead.full_name}</strong>
                  <p>{lead.desired_role || "Profil spontané"}</p>
                </div>
              </div>
              <div className="connect-lead-meta">
                <span>
                  <Mail size={16} aria-hidden="true" />
                  {lead.email}
                </span>
                {lead.phone ? (
                  <span>
                    <Phone size={16} aria-hidden="true" />
                    {lead.phone}
                  </span>
                ) : null}
                <span className="pill">{statusLabels[lead.status] ?? lead.status}</span>
              </div>
              {lead.message ? <p>{lead.message}</p> : null}
              <div className="connect-lead-actions">
                {cvLinks.get(lead.id) ? (
                  <a className="btn btn-outline" href={cvLinks.get(lead.id)} target="_blank" rel="noreferrer">
                    <FileText aria-hidden="true" size={18} />
                    Ouvrir le CV
                  </a>
                ) : (
                  <span className="btn btn-outline" aria-disabled="true">
                    <FileText aria-hidden="true" size={18} />
                    CV privé
                  </span>
                )}
                <small>Reçu le {formatDate(lead.created_at)}</small>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state selection-empty">
          <Zap aria-hidden="true" size={26} />
          <h2>Aucun profil Connect</h2>
          <p>Activez Connect sur votre site carrière pour recevoir des CV même hors candidature à une offre.</p>
          <Link className="btn btn-primary" href="/recruteur/entreprise">
            Configurer mon site carrière
          </Link>
        </section>
      )}
    </>
  );
}
