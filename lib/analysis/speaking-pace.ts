import type { ChatMessage, PaceAnalysis } from "@/lib/types";

/**
 * Analyzes speaking pace from transcript timestamps and word counts.
 * Calculates WPM for presentation and conversation phases separately,
 * plus overall pace variability (standard deviation of per-message WPM).
 *
 * Fluency rating thresholds:
 * - <80 WPM: Slow (may indicate hesitation or translation)
 * - 80-150 WPM: Natural conversational pace
 * - >150 WPM: Fast (may indicate rushing)
 */

type SessionTimestamps = {
  prepStartedAt?: string | Date | null;
  presentStartedAt?: string | Date | null;
  converseStartedAt?: string | Date | null;
  completedAt?: string | Date | null;
};

function toDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  return val instanceof Date ? val : new Date(val);
}

function minutesBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / 60000;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function fluencyRatingFromWPM(wpm: number): string {
  if (wpm < 80) return "Slow";
  if (wpm <= 150) return "Natural";
  return "Fast";
}

function fluencyScoreFromWPM(wpm: number): number {
  // Bell curve scoring centered around 115 WPM (ideal conversational pace)
  if (wpm === 0) return 0;
  const ideal = 115;
  const diff = Math.abs(wpm - ideal);
  if (diff <= 20) return 10;
  if (diff <= 40) return 8;
  if (diff <= 60) return 6;
  if (diff <= 80) return 4;
  return 2;
}

export function analyzeSpeakingPace(
  transcript: ChatMessage[],
  sessionTimestamps: SessionTimestamps
): PaceAnalysis {
  console.log("[PACE] Analyzing speaking pace");
  const presentationEntry = transcript.find((m) => m.role === "presentation");
  const studentMessages = transcript.filter((m) => m.role === "student");

  // Presentation WPM
  const presentStart = toDate(sessionTimestamps.presentStartedAt);
  const converseStart = toDate(sessionTimestamps.converseStartedAt);
  let presentationWPM = 0;
  if (presentationEntry && presentStart && converseStart) {
    const presentWords = presentationEntry.wordCount ||
      presentationEntry.content.split(/\s+/).filter(Boolean).length;
    const presentMinutes = minutesBetween(presentStart, converseStart);
    if (presentMinutes > 0) {
      presentationWPM = Math.round(presentWords / presentMinutes);
    }
  }

  // Conversation WPM (aggregate)
  const completedAt = toDate(sessionTimestamps.completedAt);
  let conversationWPM = 0;
  const totalConvoWords = studentMessages.reduce(
    (sum, m) => sum + (m.wordCount || m.content.split(/\s+/).filter(Boolean).length),
    0
  );
  if (converseStart && completedAt) {
    const convoMinutes = minutesBetween(converseStart, completedAt);
    if (convoMinutes > 0) {
      conversationWPM = Math.round(totalConvoWords / convoMinutes);
    }
  }

  // Per-message WPM for variability (using timestamps between consecutive messages)
  const perMessageWPM: number[] = [];
  for (let i = 0; i < studentMessages.length; i++) {
    const msg = studentMessages[i];
    const words = msg.wordCount || msg.content.split(/\s+/).filter(Boolean).length;
    if (words === 0) continue;

    // Find the previous message's timestamp to calculate interval
    const msgTime = toDate(msg.timestamp);
    if (!msgTime) continue;

    // Find the preceding examiner or student message
    const msgIndex = transcript.indexOf(msg);
    let prevTime: Date | null = null;
    for (let j = msgIndex - 1; j >= 0; j--) {
      prevTime = toDate(transcript[j].timestamp);
      if (prevTime) break;
    }

    if (prevTime) {
      const minutes = minutesBetween(prevTime, msgTime);
      if (minutes > 0 && minutes < 10) {
        perMessageWPM.push(words / minutes);
      }
    }
  }

  const paceVariability = Math.round(standardDeviation(perMessageWPM) * 10) / 10;

  // Overall WPM (all student text across entire session)
  const presentWords = presentationEntry
    ? presentationEntry.wordCount || presentationEntry.content.split(/\s+/).filter(Boolean).length
    : 0;
  const totalWords = presentWords + totalConvoWords;
  const sessionStart = presentStart || converseStart;
  const sessionEnd = completedAt || (converseStart ? new Date() : null);
  let overallWPM = 0;
  if (sessionStart && sessionEnd) {
    const totalMinutes = minutesBetween(sessionStart, sessionEnd);
    if (totalMinutes > 0) {
      overallWPM = Math.round(totalWords / totalMinutes);
    }
  }

  const fluencyRating = fluencyRatingFromWPM(overallWPM || conversationWPM);
  const fluencyScore = fluencyScoreFromWPM(overallWPM || conversationWPM);

  console.log(`[PACE] Results: overall=${overallWPM} WPM, presentation=${presentationWPM} WPM, conversation=${conversationWPM} WPM, variability=${paceVariability}, fluency=${fluencyRating} (${fluencyScore}/10)`);

  return {
    overallWPM,
    presentationWPM,
    conversationWPM,
    paceVariability,
    fluencyRating,
    fluencyScore,
  };
}
