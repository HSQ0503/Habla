import type { VocabularyAnalysis } from "@/lib/types";

/**
 * Analyzes vocabulary complexity using embedded CEFR word lists.
 * Calculates lexical diversity (type-token ratio), CEFR level distribution,
 * and identifies advanced vocabulary usage.
 *
 * Supports both Spanish and English input. Multi-word phrases are matched
 * against the full text before tokenization. Single words are matched
 * after tokenization with accent normalization.
 */

// --- Spanish CEFR word lists (single words only) ---

const ES_A1_A2 = new Set([
  "ser", "estar", "tener", "hacer", "ir", "poder", "decir", "ver", "dar", "saber",
  "querer", "llegar", "pasar", "deber", "poner", "parecer", "quedar", "creer", "hablar", "llevar",
  "dejar", "seguir", "encontrar", "llamar", "venir", "pensar", "salir", "volver", "tomar", "conocer",
  "vivir", "sentir", "tratar", "mirar", "contar", "empezar", "esperar", "buscar", "existir", "entrar",
  "casa", "familia", "amigo", "amiga", "escuela", "colegio", "padre", "madre", "hermano", "hermana",
  "hijo", "hija", "agua", "comida", "tiempo", "dia", "noche", "ano", "hombre", "mujer",
  "nino", "nina", "ciudad", "pais", "mundo", "cosa", "vida", "forma", "parte", "lugar",
  "trabajo", "nombre", "punto", "momento", "grande", "bueno", "malo", "nuevo", "primero", "ultimo",
  "pequeno", "mejor", "mismo", "largo", "mucho", "poco", "otro", "todo", "mas", "menos",
  "bien", "tambien", "aqui", "donde", "cuando", "como", "pero", "porque", "si", "muy",
]);

const ES_B1_B2 = new Set([
  "desarrollo", "sociedad", "influencia", "cultura", "economia", "educacion", "gobierno", "ambiente",
  "comunicacion", "tecnologia", "investigacion", "organizacion", "poblacion", "situacion", "experiencia",
  "resultado", "relacion", "problema", "sistema", "proceso", "recurso", "oportunidad", "comunidad",
  "diferencia", "importancia", "significado", "perspectiva", "responsabilidad", "diversidad", "tradicion",
  "costumbre", "identidad", "patrimonio", "intercambio", "transformacion", "globalizacion", "desafio",
  "contribuir", "establecer", "mantener", "desarrollar", "representar", "considerar", "reconocer",
  "producir", "permitir", "conseguir", "pertenecer", "alcanzar", "demostrar", "expresar", "reflejar",
  "promover", "generar", "afectar", "influir", "participar", "implementar", "analizar", "comparar",
  "interpretar", "valorar", "observar", "destacar", "integrar", "impactar", "fortalecer", "enriquecer",
  "significativo", "importante", "fundamental", "cultural", "social", "economico", "politico", "ambiental",
  "contemporaneo", "tradicional", "diverso", "complejo", "especifico", "particular", "general", "actual",
  "evidente", "necesario", "posible", "diferente", "principal", "esencial", "relevante", "considerable",
]);

const ES_C1_C2 = new Set([
  "subyacente", "paradigma", "idiosincrasia", "coyuntura", "hegemonia", "dicotomia", "intrinseco",
  "extrinseco", "ambivalencia", "yuxtaposicion", "idiosincratico", "epistemologico", "ontologico",
  "inherente", "trascendental", "multifacetico", "interdisciplinario", "sociocultural", "transversal",
  "reivindicacion", "empoderamiento", "resiliencia", "sostenibilidad", "equidad", "interculturalidad",
  "cosmovision", "deconstruir", "resignificar", "contextualizar", "problematizar", "conceptualizar",
  "connotar", "denotar", "subyacer", "trascender", "concatenar", "dilucidar", "elucidar",
  "paradigmatico", "axiologico", "heuristico", "dialectico", "fenomenologico", "hermeneutico",
  "pragmatico", "holistico", "sistemico", "heterogeneo", "homogeneo", "antagonico",
  "sinergia", "disyuntiva", "premisa", "constructo", "discurso", "enunciado", "semantico",
  "pragmatica", "retorica", "metanarrativa", "neoliberalismo",
  "posmodernidad", "interseccionalidad", "alteridad", "otredad", "hibridacion", "mestizaje",
  "aculturacion", "transculturacion", "etnocentrismo", "relativismo", "determinismo", "esencialismo",
  "indagar", "escudrinar", "discernir", "articular", "esbozar", "entrever",
]);

// Multi-word Spanish phrases matched against full text
const ES_B1_B2_PHRASES = [
  "sin embargo", "ademas", "por lo tanto", "no obstante", "en cambio", "mientras tanto",
];

// --- English CEFR word lists for testing ---
// TODO: Remove English word lists for production

const EN_A1_A2 = new Set([
  "be", "is", "am", "are", "was", "were", "have", "has", "had", "do", "does", "did",
  "go", "come", "make", "take", "get", "give", "know", "think", "see", "want", "use",
  "find", "tell", "ask", "work", "call", "try", "need", "feel", "become", "leave",
  "house", "family", "friend", "school", "father", "mother", "brother", "sister",
  "child", "water", "food", "time", "day", "night", "year", "man", "woman",
  "boy", "girl", "city", "country", "world", "thing", "life", "way", "part", "place",
  "name", "good", "bad", "new", "first", "last", "small", "big", "long", "old", "young",
  "much", "many", "other", "all", "more", "less", "also", "here", "where", "when",
  "how", "but", "because", "if", "very", "well", "just", "now", "then", "people",
  "who", "we", "they", "that", "this", "the", "and", "for", "not", "with",
  "can", "will", "would", "should", "could", "about", "like", "some", "what",
]);

const EN_B1_B2 = new Set([
  "development", "society", "influence", "culture", "economy", "education", "government",
  "environment", "communication", "technology", "research", "organization", "population",
  "situation", "experience", "result", "relationship", "problem", "system", "process",
  "resource", "opportunity", "community", "difference", "importance", "meaning",
  "perspective", "responsibility", "diversity", "tradition", "custom", "identity",
  "heritage", "exchange", "transformation", "challenge", "significant", "important",
  "fundamental", "cultural", "social", "economic", "political", "environmental",
  "contemporary", "traditional", "diverse", "complex", "specific", "particular",
  "general", "current", "evident", "necessary", "possible", "different", "essential",
  "relevant", "considerable", "contribute", "establish", "maintain", "develop",
  "represent", "consider", "recognize", "produce", "achieve", "demonstrate", "express",
  "reflect", "promote", "generate", "affect", "participate", "analyze", "compare",
  "interpret", "observe", "integrate", "strengthen", "enrich", "shape", "impact",
  "value", "belief", "aspect", "issue", "factor", "concept", "approach", "structure",
  "feature", "context", "role", "effort", "purpose", "ability", "awareness",
]);

const EN_C1_C2 = new Set([
  "underlying", "paradigm", "idiosyncrasy", "hegemony", "dichotomy", "intrinsic",
  "extrinsic", "ambivalence", "juxtaposition", "epistemological", "ontological",
  "inherent", "transcendental", "multifaceted", "interdisciplinary", "sociocultural",
  "transversal", "empowerment", "resilience", "sustainability", "equity",
  "interculturality", "deconstruct", "contextualize", "problematize", "conceptualize",
  "connote", "denote", "transcend", "concatenate", "elucidate", "paradigmatic",
  "axiological", "heuristic", "dialectical", "phenomenological", "hermeneutic",
  "pragmatic", "holistic", "systemic", "heterogeneous", "homogeneous", "antagonistic",
  "synergy", "disjunctive", "premise", "construct", "discourse", "semantic",
  "rhetoric", "metanarrative", "neoliberalism", "postmodernity", "intersectionality",
  "alterity", "hybridization", "acculturation", "transculturation", "ethnocentrism",
  "relativism", "determinism", "essentialism", "scrutinize", "discern", "articulate",
]);

/**
 * Strip accents and normalize to plain ASCII for matching.
 * e.g. "además" → "ademas", "día" → "dia"
 */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Count how many times multi-word phrases appear in the full text.
 * Returns total count of phrase matches.
 */
function countPhraseMatches(normalizedText: string, phrases: string[]): number {
  let count = 0;
  for (const phrase of phrases) {
    let idx = 0;
    while ((idx = normalizedText.indexOf(phrase, idx)) !== -1) {
      count++;
      idx += phrase.length;
    }
  }
  return count;
}

function classifyWord(word: string): "A1-A2" | "B1-B2" | "C1-C2" | "Other" {
  // Check C1-C2 first (most specific)
  if (ES_C1_C2.has(word) || EN_C1_C2.has(word)) return "C1-C2";
  if (ES_B1_B2.has(word) || EN_B1_B2.has(word)) return "B1-B2";
  if (ES_A1_A2.has(word) || EN_A1_A2.has(word)) return "A1-A2";
  return "Other";
}

export function analyzeVocabulary(text: string): VocabularyAnalysis {
  const tokens = tokenize(text);
  console.log(`[VOCAB] Analyzing vocabulary: ${tokens.length} tokens`);

  if (tokens.length === 0) {
    console.log("[VOCAB] No tokens — returning empty analysis");
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
    const level = classifyWord(word);
    switch (level) {
      case "C1-C2":
        c1c2Count++;
        advancedWords.push(word);
        break;
      case "B1-B2":
        b1b2Count++;
        break;
      case "A1-A2":
        a1a2Count++;
        break;
      default:
        otherCount++;
    }
  }

  // Also count multi-word phrase matches as B1-B2
  const normalizedFull = normalize(text);
  const phraseMatches = countPhraseMatches(normalizedFull, ES_B1_B2_PHRASES);
  b1b2Count += phraseMatches;

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

  console.log(`[VOCAB] Results: level=${estimatedLevel}, diversity=${lexicalDiversity}, complexity=${complexityScore}/10`);
  console.log(`[VOCAB] Distribution: A1-A2=${a1a2Count}, B1-B2=${b1b2Count} (+${phraseMatches} phrases), C1-C2=${c1c2Count}, Other=${otherCount}`);
  if (advancedWords.length > 0) {
    console.log(`[VOCAB] Advanced words: [${advancedWords.join(", ")}]`);
  }

  return {
    estimatedLevel,
    lexicalDiversity,
    wordDistribution,
    advancedWords,
    complexityScore,
  };
}
