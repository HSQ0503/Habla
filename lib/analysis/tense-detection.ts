import type { TenseAnalysis, TenseEntry } from "@/lib/types";

/**
 * Detects Spanish verb tenses using regex patterns and irregular verb lookups.
 * Returns tense distribution, variety score, and missing tenses.
 *
 * Algorithm:
 * 1. Tokenize input text into lowercase words
 * 2. Match each word against conjugation patterns for 6 tense categories
 * 3. Check irregular verb lookup table for common verbs
 * 4. Calculate variety score based on how many distinct tenses appear
 */

const IRREGULAR_VERBS: Record<string, Record<string, string[]>> = {
  ser: {
    present: ["soy", "eres", "es", "somos", "sois", "son"],
    preterite: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imperfect: ["era", "eras", "éramos", "erais", "eran"],
    subjunctive: ["sea", "seas", "seamos", "seáis", "sean"],
  },
  estar: {
    present: ["estoy", "estás", "está", "estamos", "estáis", "están"],
    preterite: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"],
    subjunctive: ["esté", "estés", "estemos", "estéis", "estén"],
  },
  ir: {
    present: ["voy", "vas", "va", "vamos", "vais", "van"],
    preterite: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imperfect: ["iba", "ibas", "íbamos", "ibais", "iban"],
    subjunctive: ["vaya", "vayas", "vayamos", "vayáis", "vayan"],
  },
  haber: {
    present: ["he", "has", "ha", "hay", "hemos", "habéis", "han"],
    preterite: ["hube", "hubiste", "hubo", "hubimos", "hubisteis", "hubieron"],
    imperfect: ["había", "habías", "habíamos", "habíais", "habían"],
    future: ["habré", "habrás", "habrá", "habremos", "habréis", "habrán"],
    conditional: ["habría", "habrías", "habríamos", "habríais", "habrían"],
    subjunctive: ["haya", "hayas", "hayamos", "hayáis", "hayan"],
  },
  tener: {
    present: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
    preterite: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
    future: ["tendré", "tendrás", "tendrá", "tendremos", "tendréis", "tendrán"],
    conditional: ["tendría", "tendrías", "tendríamos", "tendríais", "tendrían"],
    subjunctive: ["tenga", "tengas", "tengamos", "tengáis", "tengan"],
  },
  hacer: {
    present: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
    preterite: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
    future: ["haré", "harás", "hará", "haremos", "haréis", "harán"],
    conditional: ["haría", "harías", "haríamos", "haríais", "harían"],
    subjunctive: ["haga", "hagas", "hagamos", "hagáis", "hagan"],
  },
  poder: {
    present: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
    preterite: ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"],
    future: ["podré", "podrás", "podrá", "podremos", "podréis", "podrán"],
    conditional: ["podría", "podrías", "podríamos", "podríais", "podrían"],
    subjunctive: ["pueda", "puedas", "podamos", "podáis", "puedan"],
  },
  decir: {
    present: ["digo", "dices", "dice", "decimos", "decís", "dicen"],
    preterite: ["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"],
    future: ["diré", "dirás", "dirá", "diremos", "diréis", "dirán"],
    conditional: ["diría", "dirías", "diríamos", "diríais", "dirían"],
    subjunctive: ["diga", "digas", "digamos", "digáis", "digan"],
  },
  querer: {
    present: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
    preterite: ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"],
    future: ["querré", "querrás", "querrá", "querremos", "querréis", "querrán"],
    conditional: ["querría", "querrías", "querríamos", "querríais", "querrían"],
    subjunctive: ["quiera", "quieras", "queramos", "queráis", "quieran"],
  },
  saber: {
    present: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
    preterite: ["supe", "supiste", "supo", "supimos", "supisteis", "supieron"],
    future: ["sabré", "sabrás", "sabrá", "sabremos", "sabréis", "sabrán"],
    subjunctive: ["sepa", "sepas", "sepamos", "sepáis", "sepan"],
  },
  poner: {
    present: ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"],
    preterite: ["puse", "pusiste", "puso", "pusimos", "pusisteis", "pusieron"],
    future: ["pondré", "pondrás", "pondrá", "pondremos", "pondréis", "pondrán"],
    subjunctive: ["ponga", "pongas", "pongamos", "pongáis", "pongan"],
  },
  venir: {
    present: ["vengo", "vienes", "viene", "venimos", "venís", "vienen"],
    preterite: ["vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron"],
    future: ["vendré", "vendrás", "vendrá", "vendremos", "vendréis", "vendrán"],
    subjunctive: ["venga", "vengas", "vengamos", "vengáis", "vengan"],
  },
  salir: {
    present: ["salgo", "sales", "sale", "salimos", "salís", "salen"],
    future: ["saldré", "saldrás", "saldrá", "saldremos", "saldréis", "saldrán"],
    subjunctive: ["salga", "salgas", "salgamos", "salgáis", "salgan"],
  },
  dar: {
    present: ["doy", "das", "da", "damos", "dais", "dan"],
    preterite: ["di", "diste", "dio", "dimos", "disteis", "dieron"],
    subjunctive: ["dé", "des", "demos", "deis", "den"],
  },
  ver: {
    present: ["veo", "ves", "ve", "vemos", "veis", "ven"],
    preterite: ["vi", "viste", "vio", "vimos", "visteis", "vieron"],
    imperfect: ["veía", "veías", "veíamos", "veíais", "veían"],
    subjunctive: ["vea", "veas", "veamos", "veáis", "vean"],
  },
  conocer: {
    present: ["conozco", "conoces", "conoce", "conocemos", "conocéis", "conocen"],
    subjunctive: ["conozca", "conozcas", "conozcamos", "conozcáis", "conozcan"],
  },
  traer: {
    present: ["traigo", "traes", "trae", "traemos", "traéis", "traen"],
    preterite: ["traje", "trajiste", "trajo", "trajimos", "trajisteis", "trajeron"],
    subjunctive: ["traiga", "traigas", "traigamos", "traigáis", "traigan"],
  },
  creer: {
    present: ["creo", "crees", "cree", "creemos", "creéis", "creen"],
    preterite: ["creí", "creíste", "creyó", "creímos", "creísteis", "creyeron"],
  },
  leer: {
    present: ["leo", "lees", "lee", "leemos", "leéis", "leen"],
    preterite: ["leí", "leíste", "leyó", "leímos", "leísteis", "leyeron"],
  },
  oír: {
    present: ["oigo", "oyes", "oye", "oímos", "oís", "oyen"],
    preterite: ["oí", "oíste", "oyó", "oímos", "oísteis", "oyeron"],
    subjunctive: ["oiga", "oigas", "oigamos", "oigáis", "oigan"],
  },
};

// Build a flat lookup: word → tense
const irregularLookup = new Map<string, string>();
for (const forms of Object.values(IRREGULAR_VERBS)) {
  for (const [tense, words] of Object.entries(forms)) {
    for (const w of words) {
      irregularLookup.set(w.toLowerCase(), tense);
    }
  }
}

// Regular verb conjugation patterns (Spanish -ar, -er, -ir endings)
const TENSE_PATTERNS: { tense: string; pattern: RegExp }[] = [
  // Present indicative
  { tense: "present", pattern: /^[a-záéíóúüñ]+(?:o|as|a|amos|áis|an|es|e|emos|éis|en|imos|ís)$/i },
  // Preterite (past simple)
  { tense: "preterite", pattern: /^[a-záéíóúüñ]+(?:é|aste|ó|amos|asteis|aron|í|iste|ió|imos|isteis|ieron)$/i },
  // Imperfect
  { tense: "imperfect", pattern: /^[a-záéíóúüñ]+(?:aba|abas|ábamos|abais|aban|ía|ías|íamos|íais|ían)$/i },
  // Future
  { tense: "future", pattern: /^[a-záéíóúüñ]+(?:aré|arás|ará|aremos|aréis|arán|eré|erás|erá|eremos|eréis|erán|iré|irás|irá|iremos|iréis|irán)$/i },
  // Conditional
  { tense: "conditional", pattern: /^[a-záéíóúüñ]+(?:aría|arías|aríamos|aríais|arían|ería|erías|eríamos|eríais|erían|iría|irías|iríamos|iríais|irían)$/i },
  // Subjunctive present (-ar verbs: -e endings, -er/-ir verbs: -a endings)
  { tense: "subjunctive", pattern: /^[a-záéíóúüñ]+(?:ara|aras|áramos|arais|aran|iera|ieras|iéramos|ierais|ieran|ase|ases|ásemos|aseis|asen|iese|ieses|iésemos|ieseis|iesen)$/i },
];

const ALL_TENSES = ["present", "preterite", "imperfect", "future", "conditional", "subjunctive"];

const MAX_EXAMPLES = 3;

export function analyzeTenses(text: string): TenseAnalysis {
  if (!text.trim()) {
    return {
      tensesFound: [],
      totalTensesUsed: 0,
      varietyScore: 0,
      missingTenses: [...ALL_TENSES],
      dominantTense: "none",
    };
  }

  const words = text
    .toLowerCase()
    .replace(/[^\wáéíóúüñ\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const tenseCounts = new Map<string, { count: number; examples: Set<string> }>();

  for (const word of words) {
    // Check irregular lookup first
    const irregularTense = irregularLookup.get(word);
    if (irregularTense) {
      const entry = tenseCounts.get(irregularTense) || { count: 0, examples: new Set() };
      entry.count++;
      if (entry.examples.size < MAX_EXAMPLES) entry.examples.add(word);
      tenseCounts.set(irregularTense, entry);
      continue;
    }

    // Check regular patterns
    for (const { tense, pattern } of TENSE_PATTERNS) {
      if (pattern.test(word)) {
        const entry = tenseCounts.get(tense) || { count: 0, examples: new Set() };
        entry.count++;
        if (entry.examples.size < MAX_EXAMPLES) entry.examples.add(word);
        tenseCounts.set(tense, entry);
        break;
      }
    }
  }

  const tensesFound: TenseEntry[] = Array.from(tenseCounts.entries())
    .map(([tense, { count, examples }]) => ({
      tense,
      count,
      examples: Array.from(examples),
    }))
    .sort((a, b) => b.count - a.count);

  const totalTensesUsed = tensesFound.reduce((sum, t) => sum + t.count, 0);
  const foundTenseNames = new Set(tensesFound.map((t) => t.tense));
  const missingTenses = ALL_TENSES.filter((t) => !foundTenseNames.has(t));

  // Variety score: 0-10 based on number of distinct tenses (6 possible)
  const distinctCount = tensesFound.length;
  const varietyScore = Math.min(10, Math.round((distinctCount / ALL_TENSES.length) * 10));

  const dominantTense = tensesFound.length > 0 ? tensesFound[0].tense : "none";

  return {
    tensesFound,
    totalTensesUsed,
    varietyScore,
    missingTenses,
    dominantTense,
  };
}
