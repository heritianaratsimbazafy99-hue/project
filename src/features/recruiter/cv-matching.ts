export type CandidateMatchInput = {
  id: string;
  city?: string | null;
  sector?: string | null;
  desired_role?: string | null;
  candidate_skills?: Array<{ label: string | null; kind?: string | null }> | null;
};

export type JobMatchInput = {
  id: string;
  title?: string | null;
  city?: string | null;
  sector?: string | null;
  contract?: string | null;
  summary?: string | null;
  description?: string | null;
  missions?: string | null;
  profile?: string | null;
};

export type CandidateJobMatch = {
  score: number;
  reasons: string[];
};

export type CandidateWithJobMatch<T extends CandidateMatchInput> = T & {
  match: CandidateJobMatch;
};

const stopWords = new Set([
  "a",
  "avec",
  "base",
  "de",
  "des",
  "du",
  "en",
  "et",
  "la",
  "le",
  "les",
  "pour",
  "un",
  "une"
]);

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokensFrom(value: string | null | undefined) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function overlapCount(left: string[], right: Set<string>) {
  return left.filter((token) => right.has(token)).length;
}

function sameValue(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeText(left).trim();
  const normalizedRight = normalizeText(right).trim();

  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

export function calculateCandidateJobMatch(
  candidate: CandidateMatchInput,
  job: JobMatchInput
): CandidateJobMatch {
  const reasons: string[] = [];
  let score = 0;
  const jobTitleTokens = new Set(tokensFrom(job.title));
  const candidateRoleTokens = tokensFrom(candidate.desired_role);
  const roleOverlap = overlapCount(candidateRoleTokens, jobTitleTokens);

  if (roleOverlap > 0) {
    score += roleOverlap === candidateRoleTokens.length ? 30 : 25;
    reasons.push("Poste cible proche de l'offre");
  }

  if (sameValue(candidate.city, job.city)) {
    score += 15;
    reasons.push("Ville alignée");
  }

  if (sameValue(candidate.sector, job.sector)) {
    score += 20;
    reasons.push("Secteur aligné");
  }

  const jobTextTokens = new Set(
    [
      job.title,
      job.sector,
      job.city,
      job.contract,
      job.summary,
      job.description,
      job.missions,
      job.profile
    ].flatMap((value) => tokensFrom(value))
  );
  const matchingSkills = (candidate.candidate_skills ?? [])
    .map((skill) => skill.label)
    .filter((label): label is string => Boolean(label?.trim()))
    .filter((label) => tokensFrom(label).some((token) => jobTextTokens.has(token)));

  if (matchingSkills.length > 0) {
    score += Math.min(30, matchingSkills.length * 10);
    reasons.push(`${matchingSkills.length} compétence${matchingSkills.length > 1 ? "s" : ""} clé${matchingSkills.length > 1 ? "s" : ""} détectée${matchingSkills.length > 1 ? "s" : ""}`);
  }

  const candidateTextTokens = [
    candidate.desired_role,
    candidate.sector,
    candidate.city,
    ...(candidate.candidate_skills ?? []).map((skill) => skill.label)
  ].flatMap((value) => tokensFrom(value));
  const textOverlap = overlapCount(candidateTextTokens, jobTextTokens);

  if (textOverlap >= 4) {
    score += 5;
    reasons.push("Signaux complémentaires cohérents");
  }

  if (reasons.length === 0) {
    reasons.push("Profil à qualifier manuellement");
  }

  return {
    score: Math.min(100, score),
    reasons
  };
}

export function sortCandidatesByJobMatch<T extends CandidateMatchInput>(
  candidates: T[],
  job: JobMatchInput
): Array<CandidateWithJobMatch<T>> {
  return candidates
    .map((candidate) => ({
      ...candidate,
      match: calculateCandidateJobMatch(candidate, job)
    }))
    .sort((left, right) => right.match.score - left.match.score);
}
