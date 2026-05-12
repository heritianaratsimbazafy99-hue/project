import { Check, Eye, FileCheck2, LockKeyhole } from "lucide-react";

import { openCandidateCvAndRedirect, uploadCandidateCvAndRedirect } from "@/features/candidate/actions";

type CvUploadCardProps = {
  cvPath?: string | null;
  city?: string | null;
  desiredRole?: string | null;
  profileName?: string | null;
  skillCount?: number;
};

function cvFileName(cvPath: string) {
  return cvPath.split("/").pop() || "CV enregistré";
}

export function CvUploadCard({
  city,
  cvPath,
  desiredRole,
  profileName,
  skillCount = 0
}: CvUploadCardProps) {
  const hasCv = Boolean(cvPath);
  const skillLabel = skillCount > 0
    ? `${skillCount} compétence${skillCount > 1 ? "s" : ""} renseignée${skillCount > 1 ? "s" : ""}`
    : "Compétences à compléter";

  return (
    <section className="candidateCard cvUploadCard" aria-labelledby="cv-upload-title">
      <div className="cvReviewIntro">
        <span aria-hidden="true">
          <FileCheck2 size={22} />
        </span>
        <div>
          <h2 id="cv-upload-title">{hasCv ? "Votre CV est prêt dans JobMada" : "Déposez votre CV pour commencer"}</h2>
          <p>
            {hasCv
              ? "Vérifiez les informations extraites et gardez un dossier clair pour postuler rapidement."
              : "Ajoutez un fichier PDF, DOC ou DOCX pour préparer votre profil candidat."}
          </p>
        </div>
      </div>

      <div className="cvReviewSummary">
        <span>{profileName || "Profil candidat"}</span>
        <span>{desiredRole || "Poste recherché à préciser"}</span>
        <span>{city || "Ville à préciser"}</span>
        <span>{skillLabel}</span>
      </div>

      <div className="cvReviewFooter">
        <p className={hasCv ? "cvCurrent" : "cvCurrent isMissing"}>
          {hasCv ? `CV actuel : ${cvFileName(cvPath!)}` : "Aucun CV enregistré pour le moment"}
        </p>
        <div className="cvTrustList" aria-label="Garanties CV">
          <span>
            <Check aria-hidden="true" size={16} />
            Prêt pour postuler
          </span>
          <span>
            <LockKeyhole aria-hidden="true" size={16} />
            Visible seulement lors de vos candidatures
          </span>
        </div>
      </div>

      <form className="cvUploadForm" action={uploadCandidateCvAndRedirect}>
        <label className="cvDropzone">
          <span>{hasCv ? "Remplacer le CV" : "Parcourir vos fichiers"}</span>
          <small>PDF, DOC ou DOCX</small>
          <input type="file" name="cv" accept=".pdf,.doc,.docx,application/pdf" required />
        </label>
        <div className="cvUploadActions">
          <button type="submit">{hasCv ? "Mettre à jour" : "Enregistrer le CV"}</button>
          {hasCv ? (
            <button type="submit" formAction={openCandidateCvAndRedirect} formNoValidate aria-label="Ouvrir le CV actuel">
              <Eye aria-hidden="true" size={16} />
              Voir mon CV
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
