import type { ChatMessage, FeedbackResult } from "@/lib/types";
import { gradeSession } from "@/lib/analysis/ib-grader";
import { analyzeTenses } from "@/lib/analysis/tense-detection";
import { analyzeResponseDepth } from "@/lib/analysis/response-depth";
import { analyzeVocabulary } from "@/lib/analysis/vocabulary-scorer";
import { analyzeSpeakingPace } from "@/lib/analysis/speaking-pace";

type SessionWithImage = {
  transcript: unknown;
  image: {
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

  const timestamps = {
    prepStartedAt: session.prepStartedAt,
    presentStartedAt: session.presentStartedAt,
    converseStartedAt: session.converseStartedAt,
    completedAt: session.completedAt,
  };

  // Run all analyses in parallel
  const [ibGrades, tenses, depth, vocabulary, pace] = await Promise.all([
    gradeSession(transcript, presentationText, session.image.aiAnalysis, timestamps),
    Promise.resolve(analyzeTenses(allStudentText)),
    Promise.resolve(analyzeResponseDepth(studentMessages)),
    Promise.resolve(analyzeVocabulary(allStudentText)),
    Promise.resolve(analyzeSpeakingPace(transcript, timestamps)),
  ]);

  return {
    ibGrades,
    quantitative: { tenses, depth, vocabulary, pace },
  };
}
