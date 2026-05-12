import { Save, UserRound } from "lucide-react";

import {
  changeRecruiterPasswordAndRedirect,
  saveRecruiterProfileAndRedirect
} from "@/features/recruiter/profile-actions";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

type RecruiterProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RecruiterProfilePage({ searchParams }: RecruiterProfilePageProps) {
  const { profile } = await requireRole(["recruiter"]);
  const [firstName = "", lastName = ""] = (profile.display_name || "").replace("JobMada", "").trim().split(" ");
  const query = await searchParams;
  const saved = firstQueryValue(query.saved);
  const passwordUpdated = firstQueryValue(query.password);
  const error = firstQueryValue(query.error);
  const phone = "phone" in profile ? profile.phone : "";

  return (
    <div className="profile-page">
      <div className="dashboard-welcome">
        <div>
          <h1>Mon profil</h1>
          <p>Gérez vos informations personnelles.</p>
        </div>
      </div>

      {saved ? (
        <div className="recruiterNotice" role="status">
          Profil recruteur enregistré.
        </div>
      ) : null}
      {passwordUpdated ? (
        <div className="recruiterNotice" role="status">
          Mot de passe mis à jour.
        </div>
      ) : null}
      {error ? (
        <div className="recruiterNotice isError" role="alert">
          {error}
        </div>
      ) : null}

      <form action={saveRecruiterProfileAndRedirect} className="panel form-grid profile-panel">
        <h2 className="form-field full">
          <UserRound aria-hidden="true" size={20} />
          Informations personnelles
        </h2>
        <div className="form-field">
          <label>Prénom</label>
          <input className="input" name="first_name" defaultValue={firstName} />
        </div>
        <div className="form-field">
          <label>Nom</label>
          <input className="input" name="last_name" defaultValue={lastName} />
        </div>
        <div className="form-field full">
          <label>Téléphone</label>
          <input className="input" name="phone" defaultValue={phone ?? ""} placeholder="+261 ..." />
        </div>
        <div className="form-field full">
          <label>Email</label>
          <input className="input" defaultValue={profile.email ?? ""} disabled />
          <small>L'email est lié à votre compte et ne peut pas être modifié.</small>
        </div>
        <div className="form-field full">
          <button className="btn btn-primary" type="submit">
            <Save aria-hidden="true" size={18} />
            Enregistrer
          </button>
        </div>
      </form>

      <form action={changeRecruiterPasswordAndRedirect} className="panel form-grid profile-panel">
        <h2 className="form-field full">Changer le mot de passe</h2>
        <div className="form-field">
          <label>Nouveau mot de passe</label>
          <input className="input" name="password" type="password" minLength={8} placeholder="Nouveau mot de passe" required />
        </div>
        <div className="form-field">
          <label>Confirmer le mot de passe</label>
          <input
            className="input"
            name="password_confirm"
            type="password"
            minLength={8}
            placeholder="Confirmer le mot de passe"
            required
          />
        </div>
        <div className="form-field full">
          <button className="btn btn-outline" type="submit">
            Modifier le mot de passe
          </button>
        </div>
      </form>
    </div>
  );
}
