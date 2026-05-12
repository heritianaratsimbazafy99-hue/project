import { requireRole } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  created_at: string;
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  candidate: "Candidat",
  recruiter: "Recruteur"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MG", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export default async function AdminUsersPage() {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Impossible de charger les utilisateurs.");
  }

  const users = (data ?? []) as UserRow[];

  return (
    <div className="adminStack">
      <section className="adminHero compact" aria-labelledby="admin-users-title">
        <p className="adminEyebrow">Utilisateurs</p>
        <h1 id="admin-users-title">Utilisateurs</h1>
        <p>Consultez les derniers profils inscrits sur JobMada.</p>
      </section>

      {users.length > 0 ? (
        <div className="adminTable users" role="table" aria-label="Utilisateurs inscrits">
          <div className="adminTableHeader" role="row">
            <span role="columnheader">Profil</span>
            <span role="columnheader">Rôle</span>
            <span role="columnheader">Inscription</span>
          </div>
          {users.map((user) => (
            <article key={user.id} className="adminTableRow" role="row">
              <div role="cell">
                <strong>{user.display_name || user.email || "Profil sans nom"}</strong>
                <span>{user.email || "Email indisponible"}</span>
              </div>
              <span className="adminStatus" role="cell">
                {roleLabels[user.role]}
              </span>
              <time role="cell" dateTime={user.created_at}>
                {formatDate(user.created_at)}
              </time>
            </article>
          ))}
        </div>
      ) : (
        <section className="adminEmptyState" aria-labelledby="admin-users-empty-title">
          <h2 id="admin-users-empty-title">Aucun utilisateur</h2>
          <p>Les profils créés apparaîtront ici.</p>
        </section>
      )}
    </div>
  );
}
