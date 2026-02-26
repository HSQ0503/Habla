import type { DepthAnalysis, FactorScore } from "@/lib/types";

/**
 * Analyzes the depth and quality of student conversation responses.
 * Evaluates 6 factors: word count, sentence count, elaboration markers,
 * examples, opinions, and justifications.
 *
 * Weighted scoring: word count 15%, sentences 10%, elaboration 20%,
 * examples 20%, opinions 15%, justifications 20%
 */

const ELABORATION_MARKERS = [
  // Spanish
  "por ejemplo", "además", "sin embargo", "también", "es decir",
  "por otro lado", "en cambio", "no obstante", "asimismo", "de hecho",
  "en otras palabras", "a su vez", "por lo tanto", "en primer lugar",
  "en segundo lugar", "finalmente", "al mismo tiempo",
  // English (in case student code-switches)
  "for example", "additionally", "however", "also", "furthermore",
  "on the other hand", "that is to say", "in fact", "moreover",
];

const EXAMPLE_MARKERS = [
  "por ejemplo", "como", "tal como", "un ejemplo de esto",
  "como por ejemplo", "un caso", "se puede ver en",
  "for example", "like", "such as", "an example of this",
];

const OPINION_MARKERS = [
  "creo que", "en mi opinión", "pienso que", "me parece que",
  "considero que", "para mí", "desde mi punto de vista",
  "a mi parecer", "opino que", "según mi opinión",
  "i think", "in my opinion", "i believe", "it seems to me",
];

const JUSTIFICATION_MARKERS = [
  "porque", "ya que", "debido a", "por eso", "por lo tanto",
  "puesto que", "dado que", "como consecuencia", "por esta razón",
  "a causa de", "en consecuencia", "así que", "de modo que",
  "because", "since", "due to", "therefore", "as a result",
];

function countMarkers(text: string, markers: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const marker of markers) {
    let idx = 0;
    while ((idx = lower.indexOf(marker, idx)) !== -1) {
      count++;
      idx += marker.length;
    }
  }
  return count;
}

function countSentences(text: string): number {
  return text.split(/[.!?¿¡]+/).filter((s) => s.trim().length > 0).length;
}

function scoreFromRange(value: number, low: number, high: number): number {
  if (value <= low) return 0;
  if (value >= high) return 10;
  return Math.round(((value - low) / (high - low)) * 10);
}

export function analyzeResponseDepth(studentMessages: string[]): DepthAnalysis {
  if (studentMessages.length === 0) {
    const emptyFactors: FactorScore[] = [
      { name: "Word Count", score: 0, count: 0 },
      { name: "Sentences", score: 0, count: 0 },
      { name: "Elaboration", score: 0, count: 0 },
      { name: "Examples", score: 0, count: 0 },
      { name: "Opinions", score: 0, count: 0 },
      { name: "Justifications", score: 0, count: 0 },
    ];
    return {
      overallScore: 0,
      factorScores: emptyFactors,
      averageResponseLength: 0,
      strongestFactor: "none",
      weakestFactor: "none",
    };
  }

  let totalWords = 0;
  let totalSentences = 0;
  let totalElaboration = 0;
  let totalExamples = 0;
  let totalOpinions = 0;
  let totalJustifications = 0;

  for (const msg of studentMessages) {
    const words = msg.split(/\s+/).filter(Boolean).length;
    totalWords += words;
    totalSentences += countSentences(msg);
    totalElaboration += countMarkers(msg, ELABORATION_MARKERS);
    totalExamples += countMarkers(msg, EXAMPLE_MARKERS);
    totalOpinions += countMarkers(msg, OPINION_MARKERS);
    totalJustifications += countMarkers(msg, JUSTIFICATION_MARKERS);
  }

  const n = studentMessages.length;
  const avgWords = totalWords / n;
  const avgSentences = totalSentences / n;

  // Score each factor (0-10)
  const wordScore = scoreFromRange(avgWords, 5, 60);
  const sentenceScore = scoreFromRange(avgSentences, 1, 5);
  const elaborationScore = scoreFromRange(totalElaboration / n, 0, 2);
  const exampleScore = scoreFromRange(totalExamples / n, 0, 1.5);
  const opinionScore = scoreFromRange(totalOpinions / n, 0, 1);
  const justificationScore = scoreFromRange(totalJustifications / n, 0, 1.5);

  const factorScores: FactorScore[] = [
    { name: "Word Count", score: wordScore, count: totalWords },
    { name: "Sentences", score: sentenceScore, count: totalSentences },
    { name: "Elaboration", score: elaborationScore, count: totalElaboration },
    { name: "Examples", score: exampleScore, count: totalExamples },
    { name: "Opinions", score: opinionScore, count: totalOpinions },
    { name: "Justifications", score: justificationScore, count: totalJustifications },
  ];

  // Weighted overall: word count 15%, sentences 10%, elaboration 20%, examples 20%, opinions 15%, justifications 20%
  const weights = [0.15, 0.10, 0.20, 0.20, 0.15, 0.20];
  const scores = [wordScore, sentenceScore, elaborationScore, exampleScore, opinionScore, justificationScore];
  const overallScore = Math.round(
    scores.reduce((sum, s, i) => sum + s * weights[i], 0) * 10
  ) / 10;

  const sorted = [...factorScores].sort((a, b) => b.score - a.score);
  const strongestFactor = sorted[0].name;
  const weakestFactor = sorted[sorted.length - 1].name;

  return {
    overallScore,
    factorScores,
    averageResponseLength: Math.round(avgWords),
    strongestFactor,
    weakestFactor,
  };
}
