export function CvUploadCard() {
  return (
    <section className="candidateCard cvUploadCard" aria-labelledby="cv-upload-title">
      <div>
        <p className="candidateEyebrow">CV</p>
        <h2 id="cv-upload-title">Déposer votre CV</h2>
        <p>Ajoutez un CV au format PDF ou Word. Taille maximale : 5MB.</p>
      </div>

      <label className="cvDropzone">
        <span>Glissez votre fichier ici ou choisissez un fichier</span>
        <small>PDF, DOC ou DOCX</small>
        <input type="file" name="cv" accept=".pdf,.doc,.docx,application/pdf" />
      </label>
    </section>
  );
}
