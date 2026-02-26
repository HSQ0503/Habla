import OpenAI from "openai";
import type { ChatMessage, IBGrades } from "@/lib/types";

const openai = new OpenAI();

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
  return Math.round(Math.abs(b.getTime() - a.getTime()) / 60000 * 10) / 10;
}

function buildGradingPrompt(
  presentationText: string,
  conversationMessages: ChatMessage[],
  imageAnalysis: unknown,
  sessionTimestamps: SessionTimestamps
): string {
  const presentStart = toDate(sessionTimestamps.presentStartedAt);
  const converseStart = toDate(sessionTimestamps.converseStartedAt);
  const completedAt = toDate(sessionTimestamps.completedAt);

  const presentationDuration =
    presentStart && converseStart ? minutesBetween(presentStart, converseStart) : 0;
  const conversationDuration =
    converseStart && completedAt ? minutesBetween(converseStart, completedAt) : 0;

  const studentMsgs = conversationMessages.filter((m) => m.role === "student");
  const examinerMsgs = conversationMessages.filter((m) => m.role === "examiner");
  const totalStudentWords = studentMsgs.reduce(
    (sum, m) => sum + (m.wordCount || m.content.split(/\s+/).filter(Boolean).length),
    0
  );
  const avgResponseLength =
    studentMsgs.length > 0 ? Math.round(totalStudentWords / studentMsgs.length) : 0;

  const formattedConversation = conversationMessages
    .map((m) => `[${m.role === "student" ? "STUDENT" : "EXAMINER"}]: ${m.content}`)
    .join("\n\n");

  const imageAnalysisStr =
    typeof imageAnalysis === "string"
      ? imageAnalysis
      : JSON.stringify(imageAnalysis, null, 2);

  return `You are a senior IB Spanish B examiner with 15 years of experience grading Individual Oral assessments. You will grade a student's IO performance based on their complete transcript.

Grade STRICTLY according to the official IB rubric descriptors below. Do not inflate scores. Be fair, consistent, and evidence-based.

IMPORTANT CONTEXT: This is a text-based practice session, so you CANNOT assess pronunciation or intonation. For Criterion A, evaluate ONLY vocabulary, grammatical structures, accuracy, and effectiveness of communication. Adjust your assessment of the 10-12 band accordingly — a student cannot reach the pronunciation-related descriptors in text mode.

=== CRITERION A: LANGUAGE (0-12 marks) ===
How successfully does the candidate command spoken language?

0: The work does not reach a standard described by the descriptors below.

1-3: Command of the language is limited. Vocabulary is sometimes appropriate to the task. Basic grammatical structures are used. Language contains errors in basic structures. Errors interfere with communication.

4-6: Command of the language is partially effective. Vocabulary is appropriate to the task. Some basic grammatical structures are used, with some attempts to use more complex structures. Language is mostly accurate in basic structures, but errors occur in more complex structures. Errors at times interfere with communication.

7-9: Command of the language is effective and mostly accurate. Vocabulary is appropriate to the task, and varied. A variety of basic and more complex grammatical structures is used. Language is mostly accurate. Occasional errors in basic and in complex grammatical structures do not interfere with communication.

10-12: Command of the language is mostly accurate and very effective. Vocabulary is appropriate to the task, and varied, including the use of idiomatic expressions. A variety of basic and more complex grammatical structures is used effectively. Language is mostly accurate. Minor errors in more complex grammatical structures do not interfere with communication.

=== CRITERION B1: MESSAGE — VISUAL STIMULUS (0-6 marks) ===
Evaluates the PRESENTATION phase ONLY.

0: The work does not reach a standard described by the descriptors below.

1-2: The presentation is mostly irrelevant to the stimulus. The presentation is limited to descriptions of the stimulus, or part of it. These descriptions may be incomplete. The presentation is not clearly linked to the target culture(s).

3-4: The presentation is mostly relevant to the stimulus. With a focus on explicit details, the candidate provides descriptions and basic personal interpretations relating to the stimulus. The presentation is mostly linked to the target culture(s).

5-6: The presentation is consistently relevant to the stimulus and draws on explicit and implicit details. The presentation provides both descriptions and personal interpretations relating to the stimulus. The presentation makes clear links to the target culture(s).

=== CRITERION B2: MESSAGE — CONVERSATION (0-6 marks) ===
Evaluates the CONVERSATION phase ONLY.

0: The work does not reach a standard described by the descriptors below.

1-2: The candidate consistently struggles to address the questions. Some responses are appropriate and are rarely developed. Responses are limited in scope and depth.

3-4: The candidate's responses are mostly relevant to the questions. Most responses are appropriate and some are developed. Responses are mostly broad in scope and depth.

5-6: The candidate's responses are consistently relevant to the questions and show some development. Responses are consistently appropriate and developed. Responses are broad in scope and depth, including personal interpretations and/or attempts to engage the interlocutor.

=== CRITERION C: INTERACTIVE SKILLS (0-6 marks) ===
Evaluates the CONVERSATION phase ONLY.

0: The work does not reach a standard described by the descriptors below.

1-2: Comprehension and interaction are limited. The candidate provides limited responses in the target language. Participation is limited. Most questions must be repeated and/or rephrased.

3-4: Comprehension and interaction are mostly sustained. The candidate provides responses in the target language and mostly demonstrates comprehension. Participation is mostly sustained.

5-6: Comprehension and interaction are consistently sustained. The candidate provides responses in the target language and demonstrates comprehension. Participation is sustained with some independent contributions.

=== END OF RUBRIC ===

IMAGE CONTEXT (what the image depicts — use this to judge relevance of student's responses):
${imageAnalysisStr}

COMPLETE TRANSCRIPT:

[PRESENTATION PHASE]
${presentationText || "(No presentation text recorded)"}

[CONVERSATION PHASE]
${formattedConversation || "(No conversation recorded)"}

SESSION DATA:
- Presentation duration: ${presentationDuration} minutes
- Conversation duration: ${conversationDuration} minutes
- Total student words: ${totalStudentWords}
- Number of examiner questions: ${examinerMsgs.length}
- Number of student responses: ${studentMsgs.length}
- Average student response length: ${avgResponseLength} words

GRADING INSTRUCTIONS:
1. Read the ENTIRE transcript carefully before assigning any scores.
2. For each criterion, first identify which band the student clearly falls into based on the descriptors.
3. Then assign a specific mark within that band based on how strongly they meet the descriptors.
4. Cite SPECIFIC quotes or examples from the transcript to justify every score. Use the student's actual words.
5. If a student is borderline between two bands, err on the side of the lower band unless there is clear evidence for the higher one.
6. For Criterion A, look specifically for: variety of tenses, vocabulary range, grammatical accuracy, use of complex structures (subjunctive, conditionals, relative clauses).
7. For Criterion B1, evaluate ONLY the presentation text — did they describe the image, interpret it, and connect it to culture?
8. For Criterion B2, evaluate ONLY the conversation — did they answer questions fully, with depth, scope, and personal interpretation?
9. For Criterion C, evaluate ONLY the conversation — did they sustain interaction, demonstrate comprehension, and contribute independently?

Respond in this EXACT JSON format with no additional text:
{
  "criterionA": {
    "mark": <number 0-12>,
    "band": "<e.g., '7-9'>",
    "justification": "<2-3 sentences with specific transcript quotes as evidence>",
    "strengths": ["<specific strength with example from transcript>", "<another>"],
    "improvements": ["<specific actionable improvement>", "<another>"]
  },
  "criterionB1": {
    "mark": <number 0-6>,
    "band": "<e.g., '3-4'>",
    "justification": "<2-3 sentences with specific transcript quotes>",
    "strengths": ["..."],
    "improvements": ["..."]
  },
  "criterionB2": {
    "mark": <number 0-6>,
    "band": "<e.g., '5-6'>",
    "justification": "<2-3 sentences with specific transcript quotes>",
    "strengths": ["..."],
    "improvements": ["..."]
  },
  "criterionC": {
    "mark": <number 0-6>,
    "band": "<e.g., '3-4'>",
    "justification": "<2-3 sentences with specific transcript quotes>",
    "strengths": ["..."],
    "improvements": ["..."]
  },
  "totalMark": <sum of all criteria out of 30>,
  "overallSummary": "<3-4 sentence overall assessment referencing specific moments from the exam>",
  "topStrengths": ["<top strength>", "<second strength>"],
  "priorityImprovements": ["<most important thing to work on>", "<second most important>", "<third>"]
}`;
}

function validateGrades(grades: IBGrades): string | null {
  if (grades.criterionA.mark < 0 || grades.criterionA.mark > 12) {
    return `Criterion A mark ${grades.criterionA.mark} out of range 0-12`;
  }
  if (grades.criterionB1.mark < 0 || grades.criterionB1.mark > 6) {
    return `Criterion B1 mark ${grades.criterionB1.mark} out of range 0-6`;
  }
  if (grades.criterionB2.mark < 0 || grades.criterionB2.mark > 6) {
    return `Criterion B2 mark ${grades.criterionB2.mark} out of range 0-6`;
  }
  if (grades.criterionC.mark < 0 || grades.criterionC.mark > 6) {
    return `Criterion C mark ${grades.criterionC.mark} out of range 0-6`;
  }
  const expectedTotal =
    grades.criterionA.mark + grades.criterionB1.mark + grades.criterionB2.mark + grades.criterionC.mark;
  if (grades.totalMark !== expectedTotal) {
    return `Total mark ${grades.totalMark} does not equal sum ${expectedTotal}`;
  }
  return null;
}

async function callGPT(prompt: string): Promise<IBGrades> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "";
  return JSON.parse(raw) as IBGrades;
}

/**
 * Grades a session transcript against the official IB rubric using GPT-4o.
 * Retries once if validation fails.
 */
export async function gradeSession(
  transcript: ChatMessage[],
  presentationText: string,
  imageAnalysis: unknown,
  sessionTimestamps: SessionTimestamps
): Promise<IBGrades> {
  const conversationMessages = transcript.filter(
    (m) => m.role === "student" || m.role === "examiner"
  );

  const prompt = buildGradingPrompt(
    presentationText,
    conversationMessages,
    imageAnalysis,
    sessionTimestamps
  );

  let grades = await callGPT(prompt);
  let validationError = validateGrades(grades);

  if (validationError) {
    console.error(`IB grading validation failed: ${validationError}. Retrying...`);
    grades = await callGPT(prompt);
    validationError = validateGrades(grades);

    if (validationError) {
      console.error(`IB grading retry also failed: ${validationError}. Fixing total.`);
      // Fix the total as a last resort
      grades.totalMark =
        grades.criterionA.mark + grades.criterionB1.mark +
        grades.criterionB2.mark + grades.criterionC.mark;
    }
  }

  return grades;
}
