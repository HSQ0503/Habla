import type { ChatMessage, FeedbackResult } from "@/lib/types";
import { gradeSession } from "@/lib/analysis/ib-grader";
import { analyzeTenses } from "@/lib/analysis/tense-detection";
import { analyzeResponseDepth } from "@/lib/analysis/response-depth";
import { analyzeVocabulary } from "@/lib/analysis/vocabulary-scorer";
import { analyzeSpeakingPace } from "@/lib/analysis/speaking-pace";

type SessionWithImage = {
  transcript: unknown;
  image: {
    url: string;
    theme: string;
    culturalContext: string;
    talkingPoints: string[];
    aiAnalysis?: unknown;
  };
  prepStartedAt: Date | null;
  presentStartedAt: Date | null;
  converseStartedAt: Date | null;
  completedAt: Date | null;
};

/**
 * Orchestrates all analysis modules in parallel and returns combined feedback.
 * The IB rubric grades are authoritative; quantitative modules are supplementary.
 */
export async function generateFeedback(
  session: SessionWithImage
): Promise<FeedbackResult> {
  console.log("[FEEDBACK] Starting feedback generation pipeline");

  const transcript = (session.transcript as ChatMessage[]) || [];

  // Extract presentation and conversation from transcript
  const presentationEntry = transcript.find((m) => m.role === "presentation");
  const presentationText = presentationEntry?.content || "";
  const conversationMessages = transcript.filter(
    (m) => m.role === "student" || m.role === "examiner"
  );
  const studentMessages = conversationMessages
    .filter((m) => m.role === "student")
    .map((m) => m.content);

  // All student text combined (presentation + conversation responses)
  const allStudentText = [presentationText, ...studentMessages]
    .filter(Boolean)
    .join(" ");

  console.log(`[FEEDBACK] Transcript: ${transcript.length} total messages, ${studentMessages.length} student messages, ${conversationMessages.length - studentMessages.length} examiner messages`);
  console.log(`[FEEDBACK] Presentation: ${presentationText.split(/\s+/).filter(Boolean).length} words`);
  console.log(`[FEEDBACK] Total student text: ${allStudentText.split(/\s+/).filter(Boolean).length} words`);

  const timestamps = {
    prepStartedAt: session.prepStartedAt,
    presentStartedAt: session.presentStartedAt,
    converseStartedAt: session.converseStartedAt,
    completedAt: session.completedAt,
  };

  console.log("[FEEDBACK] Running all analyses in parallel: ibGrader, tenses, depth, vocabulary, pace");
  const startTime = Date.now();

  // Run all analyses in parallel
  const [ibGrades, tenses, depth, vocabulary, pace] = await Promise.all([
    gradeSession(transcript, presentationText, session.image.aiAnalysis, timestamps),
    Promise.resolve(analyzeTenses(allStudentText)),
    Promise.resolve(analyzeResponseDepth(studentMessages)),
    Promise.resolve(analyzeVocabulary(allStudentText)),
    Promise.resolve(analyzeSpeakingPace(transcript, timestamps)),
  ]);

  const elapsed = Date.now() - startTime;
  console.log(`[FEEDBACK] All analyses complete in ${elapsed}ms`);
  console.log(`[FEEDBACK] IB Grades: A=${ibGrades.criterionA.mark}/12, B1=${ibGrades.criterionB1.mark}/6, B2=${ibGrades.criterionB2.mark}/6, C=${ibGrades.criterionC.mark}/6, total=${ibGrades.totalMark}/30`);
  console.log(`[FEEDBACK] Tenses: ${tenses.totalTensesUsed} found, variety=${tenses.varietyScore}/10, dominant=${tenses.dominantTense}, missing=[${tenses.missingTenses.join(", ")}]`);
  console.log(`[FEEDBACK] Depth: overall=${depth.overallScore}/10, avgLength=${depth.averageResponseLength} words, strongest=${depth.strongestFactor}, weakest=${depth.weakestFactor}`);
  console.log(`[FEEDBACK] Vocabulary: level=${vocabulary.estimatedLevel}, diversity=${vocabulary.lexicalDiversity}, complexity=${vocabulary.complexityScore}/10, advanced=[${vocabulary.advancedWords.slice(0, 5).join(", ")}${vocabulary.advancedWords.length > 5 ? "..." : ""}]`);
  console.log(`[FEEDBACK] Pace: overall=${pace.overallWPM} WPM, presentation=${pace.presentationWPM} WPM, conversation=${pace.conversationWPM} WPM, fluency=${pace.fluencyRating} (${pace.fluencyScore}/10)`);

  return {
    ibGrades,
    quantitative: { tenses, depth, vocabulary, pace },
  };
}
