import { uploadCandidateCvAndRedirect } from "@/features/candidate/actions";

type CvUploadCardProps = {
  cvPath?: string | null;
};

function cvFileName(cvPath: string) {
  return cvPath.split("/").pop() || "CV enregistré";
}

export function CvUploadCard({ cvPath }: CvUploadCardProps) {
  return (
    <section className="candidateCard cvUploadCard" aria-labelledby="cv-upload-title">
      <div>
        <p className="candidateEyebrow">CV</p>
        <h2 id="cv-upload-title">Déposer votre CV</h2>
        <p>Ajoutez un CV au format PDF ou Word. Taille maximale : 5MB.</p>
        {cvPath ? <p className="cvCurrent">CV actuel : {cvFileName(cvPath)}</p> : null}
      </div>

      <form className="cvUploadForm" action={uploadCandidateCvAndRedirect}>
        <label className="cvDropzone">
          <span>Glissez votre fichier ici ou choisissez un fichier</span>
          <small>PDF, DOC ou DOCX</small>
          <input type="file" name="cv" accept=".pdf,.doc,.docx,application/pdf" required />
        </label>
        <button type="submit">Enregistrer le CV</button>
      </form>
    </section>
  );
}
