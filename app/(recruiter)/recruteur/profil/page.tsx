import { Save, UserRound } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function RecruiterProfilePage() {
  const { profile } = await requireRole(["recruiter"]);
  const [firstName = "", lastName = ""] = (profile.display_name || "").replace("JobMada", "").trim().split(" ");

  return (
    <div className="profile-page">
      <div className="dashboard-welcome">
        <div>
          <h1>Mon profil</h1>
          <p>Gérez vos informations personnelles.</p>
        </div>
      </div>

      <form className="panel form-grid profile-panel">
        <h2 className="form-field full">
          <UserRound aria-hidden="true" size={20} />
          Informations personnelles
        </h2>
        <div className="form-field">
          <label>Prénom</label>
          <input className="input" defaultValue={firstName} />
        </div>
        <div className="form-field">
          <label>Nom</label>
          <input className="input" defaultValue={lastName} />
        </div>
        <div className="form-field full">
          <label>Email</label>
          <input className="input" defaultValue={profile.email ?? ""} disabled />
          <small>L'email est lié à votre compte et ne peut pas être modifié.</small>
        </div>
        <div className="form-field full">
          <button className="btn btn-primary" type="button">
            <Save aria-hidden="true" size={18} />
            Enregistrer
          </button>
        </div>
      </form>

      <form className="panel form-grid profile-panel">
        <h2 className="form-field full">Changer le mot de passe</h2>
        <div className="form-field full">
          <label>Mot de passe actuel</label>
          <input className="input" type="password" placeholder="Votre mot de passe actuel" />
        </div>
        <div className="form-field">
          <label>Nouveau mot de passe</label>
          <input className="input" type="password" placeholder="Nouveau mot de passe" />
        </div>
        <div className="form-field">
          <label>Confirmer le mot de passe</label>
          <input className="input" type="password" placeholder="Confirmer le mot de passe" />
        </div>
        <div className="form-field full">
          <button className="btn btn-outline" type="button">
            Modifier le mot de passe
          </button>
        </div>
      </form>
    </div>
  );
}
