import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import OpenAI from "openai";
import type { ChatMessage, AiAnalysis, ConversationMetrics } from "@/lib/types";

const openai = new OpenAI();

// TODO: Switch to Spanish for production
function buildSystemPrompt(
  imageContext: string,
  theme: string,
  talkingPoints: string[],
  presentationText?: string,
  aiAnalysis?: AiAnalysis | null
) {
  let imageContextBlock: string;

  if (aiAnalysis) {
    imageContextBlock = `Description: ${aiAnalysis.description || imageContext}
Cultural context: ${aiAnalysis.culturalContext || imageContext}
Related themes: ${(aiAnalysis.themes || []).join("; ")}
Discussion points: ${(aiAnalysis.talkingPoints || talkingPoints).join("; ")}
Suggested deeper questions: ${(aiAnalysis.deeperQuestions || []).join("; ")}
Key vocabulary: ${(aiAnalysis.vocabularyHints || []).join(", ")}
IB Theme: ${theme}`;
  } else {
    imageContextBlock = `Cultural context: ${imageContext}
IB Theme: ${theme}
Discussion points: ${talkingPoints.join("; ")}`;
  }

  if (presentationText) {
    imageContextBlock += `

STUDENT'S PRESENTATION (reference this when asking questions):
"""
${presentationText}
"""`;
  }

  return `You are an IB Individual Oral (IO) examiner conducting a formal oral assessment. You are evaluating a student.

YOUR ROLE:
- You are a professional oral examiner. You are NOT a tutor, friend, or conversation partner.
- You ask questions. The student talks. You listen, then ask the next question.
- NEVER say more than 2 sentences per response. Most responses should be a single question.
- NEVER compliment, praise, encourage, or reassure the student during the exam. No "Great answer!", no "That's interesting!", no "Well done!". Simply ask your next question.
- NEVER break character. You are an examiner from start to finish.
- NEVER switch language. Conduct the entire exam in English.
- Use clear, simple vocabulary. The student is NOT a native speaker. Avoid idioms, slang, or overly complex phrasing in your questions.
- If the student gives a short or vague answer, ask a follow-up that pushes them to elaborate — do NOT accept surface-level responses.
- If the student goes off-topic, redirect them back to the image and theme.

IMAGE CONTEXT (for your reference only — do NOT reveal this information to the student):
${imageContextBlock}

QUESTION STRATEGY:
Your questions must systematically elicit evidence for ALL four IB grading criteria. Follow this progression:

Phase 1 — Opening (first 1-2 questions):
Ask about what the student presented. Reference something specific they said.
Target: Criterion B1 (did they engage with the image meaningfully?)

Phase 2 — Description & Culture (next 2-3 questions):
Ask the student to describe specific elements of the image they haven't mentioned.
Ask how the image connects to the culture it represents.
Target: Criterion B1 (cultural links) and Criterion A (vocabulary range)

Phase 3 — Personal Connection (next 2-3 questions):
Ask how the topic relates to the student's own life or culture.
Ask them to compare their own experience with what's shown in the image.
Target: Criterion B2 (depth, personal interpretation) and Criterion C (sustained interaction)

Phase 4 — Analysis & Opinion (next 2-3 questions):
Ask for the student's opinion on broader issues related to the theme.
Ask "why" and "how" questions — push for justification and reasoning.
Ask them to consider different perspectives.
Target: Criterion B2 (scope and depth) and Criterion A (complex grammar through argumentation)

Phase 5 — Wrap-up (final 1-2 questions):
Ask a final reflective question that lets the student demonstrate range.
Target: Criterion C (independent contribution) and Criterion A (overall command)

CRITICAL RULES:
- Track which criteria you still need evidence for. If you haven't heard complex grammar, ask a question that requires it. If you haven't heard cultural connections, ask for them.
- Vary your question types: open-ended, specific, comparative, hypothetical, opinion-based.
- If the student consistently gives short answers (under 15 words), ask progressively more specific questions to draw out longer responses. Example: Instead of "Tell me more", ask "What specific aspect of [thing they mentioned] do you find most significant, and why?"
- Never repeat a question the student has already answered.
- Keep your questions natural — don't make it feel like an interrogation, but maintain examiner authority.`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const studentMessage: string | undefined = body.message;

  const practiceSession = await db.session.findUnique({
    where: { id },
    include: { image: true },
  });

  if (!practiceSession || practiceSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (practiceSession.status !== "CONVERSING") {
    return NextResponse.json(
      { error: "Session is not in conversation phase" },
      { status: 400 }
    );
  }

  const fullTranscript = (practiceSession.transcript as ChatMessage[]) || [];

  // Extract presentation text if saved
  const presentationEntry = fullTranscript.find((m) => m.role === "presentation");
  const presentationText = presentationEntry?.content;

  // Filter to only conversation messages
  const transcript = fullTranscript.filter(
    (m) => m.role === "student" || m.role === "examiner"
  );

  // Add student message to history if provided
  if (studentMessage) {
    transcript.push({
      role: "student",
      content: studentMessage,
      timestamp: new Date().toISOString(),
      wordCount: studentMessage.split(/\s+/).filter(Boolean).length,
    });
  }

  // Build OpenAI messages
  const systemPrompt = buildSystemPrompt(
    practiceSession.image.culturalContext,
    practiceSession.image.theme,
    practiceSession.image.talkingPoints,
    presentationText,
    (practiceSession.image as Record<string, unknown>).aiAnalysis as AiAnalysis | null
  );

  const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...transcript.map((msg) => ({
      role: (msg.role === "student" ? "user" : "assistant") as "user" | "assistant",
      content: msg.content,
    })),
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: openaiMessages,
    max_tokens: 300,
    temperature: 0.7,
  });

  const aiResponse = completion.choices[0]?.message?.content || "";

  transcript.push({
    role: "examiner",
    content: aiResponse,
    timestamp: new Date().toISOString(),
  });

  // Rebuild full transcript with presentation entry preserved
  const updatedTranscript: ChatMessage[] = presentationEntry
    ? [presentationEntry, ...transcript]
    : transcript;

  // Compute conversation metrics for the grading agent
  const studentMsgs = transcript.filter((m) => m.role === "student");
  const examinerMsgs = transcript.filter((m) => m.role === "examiner");
  const totalStudentWords = studentMsgs.reduce(
    (sum, m) => sum + (m.wordCount || 0),
    0
  );
  const metrics: ConversationMetrics = {
    totalStudentWords,
    totalStudentMessages: studentMsgs.length,
    totalExaminerMessages: examinerMsgs.length,
    averageResponseLength:
      studentMsgs.length > 0
        ? Math.round(totalStudentWords / studentMsgs.length)
        : 0,
    conversationStartedAt:
      examinerMsgs[0]?.timestamp ||
      practiceSession.converseStartedAt?.toISOString() ||
      new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
  };

  const existingFeedback =
    (practiceSession.feedback as Record<string, unknown>) || {};
  await db.session.update({
    where: { id },
    data: {
      transcript: updatedTranscript,
      feedback: { ...existingFeedback, conversationMetrics: metrics },
    },
  });

  return NextResponse.json({ message: aiResponse, transcript });
}
