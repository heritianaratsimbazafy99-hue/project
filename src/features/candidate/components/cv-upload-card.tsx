import { FileCheck2, LockKeyhole } from "lucide-react";

import { uploadCandidateCvAndRedirect } from "@/features/candidate/actions";

type CvUploadCardProps = {
  cvPath?: string | null;
};

function cvFileName(cvPath: string) {
  return cvPath.split("/").pop() || "CV enregistré";
}

export function CvUploadCard({ cvPath }: CvUploadCardProps) {
  const hasCv = Boolean(cvPath);

  return (
    <section className="candidateCard cvUploadCard" aria-labelledby="cv-upload-title">
      <div>
        <p className="candidateEyebrow">CV</p>
        <h2 id="cv-upload-title">Déposez votre CV pour préparer votre profil</h2>
        <p>Gardez un fichier prêt à envoyer aux recruteurs. Formats acceptés : PDF, DOC ou DOCX, 5MB maximum.</p>
        <p className={hasCv ? "cvCurrent" : "cvCurrent isMissing"}>
          {hasCv ? `CV actuel : ${cvFileName(cvPath!)}` : "Aucun CV enregistré pour le moment"}
        </p>
        <div className="cvTrustList" aria-label="Garanties CV">
          <span>
            <FileCheck2 aria-hidden="true" size={16} />
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
          <span>Glissez ici ou parcourez vos fichiers</span>
          <small>PDF, DOC ou DOCX</small>
          <input type="file" name="cv" accept=".pdf,.doc,.docx,application/pdf" required />
        </label>
        <button type="submit">Enregistrer le CV</button>
      </form>
    </section>
  );
}
