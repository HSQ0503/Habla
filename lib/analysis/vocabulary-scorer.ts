import type { VocabularyAnalysis } from "@/lib/types";

/**
 * Analyzes vocabulary complexity using embedded CEFR word lists.
 * Calculates lexical diversity (type-token ratio), CEFR level distribution,
 * and identifies advanced vocabulary usage.
 */

const A1_A2_WORDS = new Set([
  "ser", "estar", "tener", "hacer", "ir", "poder", "decir", "ver", "dar", "saber",
  "querer", "llegar", "pasar", "deber", "poner", "parecer", "quedar", "creer", "hablar", "llevar",
  "dejar", "seguir", "encontrar", "llamar", "venir", "pensar", "salir", "volver", "tomar", "conocer",
  "vivir", "sentir", "tratar", "mirar", "contar", "empezar", "esperar", "buscar", "existir", "entrar",
  "casa", "familia", "amigo", "amiga", "escuela", "colegio", "padre", "madre", "hermano", "hermana",
  "hijo", "hija", "agua", "comida", "tiempo", "día", "noche", "año", "hombre", "mujer",
  "niño", "niña", "ciudad", "país", "mundo", "cosa", "vida", "forma", "parte", "lugar",
  "trabajo", "nombre", "punto", "momento", "grande", "bueno", "malo", "nuevo", "primero", "último",
  "pequeño", "mejor", "mismo", "largo", "mucho", "poco", "otro", "todo", "más", "menos",
  "bien", "también", "aquí", "donde", "cuando", "como", "pero", "porque", "si", "muy",
]);

const B1_B2_WORDS = new Set([
  "desarrollo", "sociedad", "influencia", "cultura", "economía", "educación", "gobierno", "ambiente",
  "comunicación", "tecnología", "investigación", "organización", "población", "situación", "experiencia",
  "resultado", "relación", "problema", "sistema", "proceso", "recurso", "oportunidad", "comunidad",
  "diferencia", "importancia", "significado", "perspectiva", "responsabilidad", "diversidad", "tradición",
  "costumbre", "identidad", "patrimonio", "intercambio", "transformación", "globalización", "desafío",
  "contribuir", "establecer", "mantener", "desarrollar", "representar", "considerar", "reconocer",
  "producir", "permitir", "conseguir", "pertenecer", "alcanzar", "demostrar", "expresar", "reflejar",
  "promover", "generar", "afectar", "influir", "participar", "implementar", "analizar", "comparar",
  "interpretar", "valorar", "observar", "destacar", "integrar", "impactar", "fortalecer", "enriquecer",
  "significativo", "importante", "fundamental", "cultural", "social", "económico", "político", "ambiental",
  "contemporáneo", "tradicional", "diverso", "complejo", "específico", "particular", "general", "actual",
  "evidente", "necesario", "posible", "diferente", "principal", "esencial", "relevante", "considerable",
  "sin embargo", "además", "por lo tanto", "no obstante", "en cambio", "mientras tanto",
]);

const C1_C2_WORDS = new Set([
  "subyacente", "paradigma", "idiosincrasia", "coyuntura", "hegemonía", "dicotomía", "intrínseco",
  "extrínseco", "ambivalencia", "yuxtaposición", "idiosincrático", "epistemológico", "ontológico",
  "inherente", "trascendental", "multifacético", "interdisciplinario", "sociocultural", "transversal",
  "reivindicación", "empoderamiento", "resiliencia", "sostenibilidad", "equidad", "interculturalidad",
  "cosmovisión", "deconstruir", "resignificar", "contextualizar", "problematizar", "conceptualizar",
  "connotar", "denotar", "subyacer", "trascender", "concatenar", "dilucidar", "elucidar",
  "paradigmático", "axiológico", "heurístico", "dialéctico", "fenomenológico", "hermenéutico",
  "pragmático", "holístico", "sistémico", "heterogéneo", "homogéneo", "antagónico",
  "sinergia", "disyuntiva", "premisa", "constructo", "discurso", "enunciado", "semántico",
  "pragmática", "retórica", "ethos", "pathos", "logos", "metanarrativa", "neoliberalismo",
  "posmodernidad", "interseccionalidad", "alteridad", "otredad", "hibridación", "mestizaje",
  "aculturación", "transculturación", "etnocentrismo", "relativismo", "determinismo", "esencialismo",
  "indagar", "escudriñar", "discernir", "articular", "esbozar", "entrever",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\wáéíóúüñ\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

export function analyzeVocabulary(text: string): VocabularyAnalysis {
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return {
      estimatedLevel: "N/A",
      lexicalDiversity: 0,
      wordDistribution: [
        { level: "A1-A2", count: 0, percentage: 0 },
        { level: "B1-B2", count: 0, percentage: 0 },
        { level: "C1-C2", count: 0, percentage: 0 },
        { level: "Other", count: 0, percentage: 0 },
      ],
      advancedWords: [],
      complexityScore: 0,
    };
  }

  const uniqueTokens = new Set(tokens);
  const lexicalDiversity = Math.round((uniqueTokens.size / tokens.length) * 100) / 100;

  let a1a2Count = 0;
  let b1b2Count = 0;
  let c1c2Count = 0;
  let otherCount = 0;
  const advancedWords: string[] = [];

  for (const word of uniqueTokens) {
    if (C1_C2_WORDS.has(word)) {
      c1c2Count++;
      advancedWords.push(word);
    } else if (B1_B2_WORDS.has(word)) {
      b1b2Count++;
    } else if (A1_A2_WORDS.has(word)) {
      a1a2Count++;
    } else {
      otherCount++;
    }
  }

  const classified = a1a2Count + b1b2Count + c1c2Count + otherCount;
  const pct = (n: number) => (classified > 0 ? Math.round((n / classified) * 100) : 0);

  const wordDistribution = [
    { level: "A1-A2", count: a1a2Count, percentage: pct(a1a2Count) },
    { level: "B1-B2", count: b1b2Count, percentage: pct(b1b2Count) },
    { level: "C1-C2", count: c1c2Count, percentage: pct(c1c2Count) },
    { level: "Other", count: otherCount, percentage: pct(otherCount) },
  ];

  // Estimate CEFR level based on distribution and diversity
  let estimatedLevel: string;
  if (c1c2Count >= 3 && b1b2Count >= 5) {
    estimatedLevel = "C1";
  } else if (c1c2Count >= 1 && b1b2Count >= 3) {
    estimatedLevel = "B2";
  } else if (b1b2Count >= 2) {
    estimatedLevel = "B1";
  } else if (a1a2Count >= 3) {
    estimatedLevel = "A2";
  } else {
    estimatedLevel = "A1";
  }

  // Complexity score (0-10) weighted by CEFR levels and diversity
  const diversityComponent = Math.min(lexicalDiversity * 10, 4); // max 4 points
  const levelComponent =
    (a1a2Count * 0 + b1b2Count * 1.5 + c1c2Count * 3) /
    Math.max(classified, 1);
  const complexityScore = Math.min(
    10,
    Math.round((diversityComponent + Math.min(levelComponent * 4, 6)) * 10) / 10
  );

  return {
    estimatedLevel,
    lexicalDiversity,
    wordDistribution,
    advancedWords,
    complexityScore,
  };
}
