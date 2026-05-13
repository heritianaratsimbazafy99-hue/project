import { Buffer } from "node:buffer";

export type CandidateCvParseSource = "openai" | "fallback";

export type ParsedCandidateCv = {
  source: CandidateCvParseSource;
  desiredRole: string | null;
  city: string | null;
  sector: string | null;
  hardSkills: string[];
  softSkills: string[];
  languages: string[];
  summary: string | null;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

const fallbackCities = [
  "Ambanja",
  "Antananarivo",
  "Antsirabe",
  "Antsiranana",
  "Fianarantsoa",
  "Mahajanga",
  "Moramanga",
  "Morondava",
  "Nosy Be",
  "Sainte-Marie",
  "Taolagnaro",
  "Toamasina",
  "Toliara",
  "Télétravail"
];

const fallbackSectors = [
  "Informatique & Digital",
  "Centres d'appels & BPO",
  "Commerce & Vente",
  "Marketing, Communication & Médias",
  "Banque, Finance & Comptabilité",
  "Gestion, Administration & Secrétariat",
  "Ressources humaines",
  "Hôtellerie, Restauration & Tourisme",
  "BTP, Construction & Immobilier",
  "Industrie & Production",
  "Logistique, Transport & Supply Chain",
  "Santé & Médical",
  "Enseignement & Formation",
  "Juridique",
  "Agriculture & Agroalimentaire",
  "Textile, Mode & Confection",
  "Énergie, Mines & Environnement",
  "Associatif, ONG & Humanitaire",
  "Artisanat & Métiers techniques",
  "Sécurité & Gardiennage",
  "Services à la personne"
];

const roleKeywords = [
  "agent",
  "assistant",
  "auditeur",
  "chargé",
  "commercial",
  "comptable",
  "consultant",
  "designer",
  "développeur",
  "developpeur",
  "directeur",
  "gestionnaire",
  "ingénieur",
  "ingenieur",
  "manager",
  "responsable",
  "technicien"
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function cleanLine(value: string) {
  return value
    .replace(/^[\s•*\-–—]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function linesFromText(text: string) {
  return text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);
}

function uniqueLabels(labels: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const label of labels.map(cleanLine).filter(Boolean)) {
    const key = normalize(label);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(label);
    }
  }

  return unique.slice(0, 12);
}

function splitLabels(value: string) {
  return uniqueLabels(
    value
      .split(/[,;|\/]|(?:\s+-\s+)/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function valueAfterLabel(lines: string[], labels: string[]) {
  const normalizedLabels = labels.map(normalize);

  for (const line of lines) {
    const normalizedLine = normalize(line);
    const matchingLabel = normalizedLabels.find((label) => normalizedLine.startsWith(`${label}:`) || normalizedLine.startsWith(`${label} -`));

    if (matchingLabel) {
      return cleanLine(line.slice(line.indexOf(":") + 1 || matchingLabel.length + 1));
    }
  }

  return null;
}

function extractDesiredRole(lines: string[]) {
  const explicitRole = valueAfterLabel(lines, [
    "poste recherché",
    "poste recherche",
    "poste ciblé",
    "poste cible",
    "titre",
    "fonction",
    "desired role"
  ]);

  if (explicitRole) {
    return explicitRole;
  }

  return (
    lines
      .slice(1, 6)
      .find((line) => roleKeywords.some((keyword) => normalize(line).includes(keyword))) ?? null
  );
}

function extractKnownValue(text: string, options: string[]) {
  const normalizedText = normalize(text);

  return options.find((option) => normalizedText.includes(normalize(option))) ?? null;
}

function extractSkillsFromLabels(lines: string[], labels: string[]) {
  const normalizedLabels = labels.map(normalize);

  for (const line of lines) {
    const normalizedLine = normalize(line);
    const matchingLabel = normalizedLabels.find((label) => normalizedLine.startsWith(`${label}:`) || normalizedLine.startsWith(`${label} -`));

    if (matchingLabel) {
      const separatorIndex = line.search(/[:\-]/);
      const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : "";

      return splitLabels(value);
    }
  }

  return [];
}

function normalizedParsedCv(parsed: Partial<ParsedCandidateCv>, source: CandidateCvParseSource): ParsedCandidateCv {
  return {
    source,
    desiredRole: parsed.desiredRole ? cleanLine(parsed.desiredRole) : null,
    city: parsed.city ? cleanLine(parsed.city) : null,
    sector: parsed.sector ? cleanLine(parsed.sector) : null,
    hardSkills: uniqueLabels(parsed.hardSkills ?? []),
    softSkills: uniqueLabels(parsed.softSkills ?? []),
    languages: uniqueLabels(parsed.languages ?? []),
    summary: parsed.summary ? cleanLine(parsed.summary).slice(0, 280) : null
  };
}

export function extractCandidateCvFallback(text: string): ParsedCandidateCv {
  const lines = linesFromText(text);
  const desiredRole = extractDesiredRole(lines);
  const city = extractKnownValue(text, fallbackCities);
  const sector = extractKnownValue(text, fallbackSectors);
  const hardSkills = extractSkillsFromLabels(lines, [
    "compétences techniques",
    "competences techniques",
    "compétences",
    "competences",
    "skills",
    "technologies"
  ]);
  const softSkills = extractSkillsFromLabels(lines, [
    "soft skills",
    "compétences comportementales",
    "competences comportementales",
    "qualités",
    "qualites"
  ]);
  const languages = extractSkillsFromLabels(lines, ["langues", "langage", "languages"]);
  const summary = [desiredRole, sector, city].filter(Boolean).join(" · ") || null;

  return normalizedParsedCv(
    {
      desiredRole,
      city,
      sector,
      hardSkills,
      softSkills,
      languages,
      summary
    },
    "fallback"
  );
}

function jsonFromModelText(text: string) {
  const trimmedText = text.trim();
  const fencedMatch = trimmedText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch?.[1] ?? trimmedText.slice(trimmedText.indexOf("{"), trimmedText.lastIndexOf("}") + 1);

  return JSON.parse(jsonText) as Partial<ParsedCandidateCv>;
}

function responseOutputText(response: OpenAIResponse) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

async function parseCandidateCvWithOpenAI(file: File, apiKey: string): Promise<ParsedCandidateCv> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/pdf";
  const base64File = fileBuffer.toString("base64");
  const model = process.env.OPENAI_CV_PARSER_MODEL || "gpt-4o-mini";
  const prompt = [
    "Analyse ce CV pour JobMada et réponds uniquement en JSON valide.",
    "Champs attendus: desiredRole, city, sector, hardSkills, softSkills, languages, summary.",
    "Utilise null pour les champs inconnus, des tableaux de chaînes pour les compétences, et un résumé court en français.",
    "Ne devine pas une information absente du CV."
  ].join("\n");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename: file.name || "cv.pdf",
              file_data: `data:${contentType};base64,${base64File}`
            },
            {
              type: "input_text",
              text: prompt
            }
          ]
        }
      ],
      max_output_tokens: 650
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI CV parser failed with status ${response.status}`);
  }

  const parsedResponse = (await response.json()) as OpenAIResponse;
  const parsedText = responseOutputText(parsedResponse);

  return normalizedParsedCv(jsonFromModelText(parsedText), "openai");
}

export async function parseCandidateCvFile(file: File): Promise<ParsedCandidateCv> {
  const fallbackText = await file.text().catch(() => "");
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (apiKey) {
    try {
      return await parseCandidateCvWithOpenAI(file, apiKey);
    } catch {
      return extractCandidateCvFallback(fallbackText);
    }
  }

  return extractCandidateCvFallback(fallbackText);
}
