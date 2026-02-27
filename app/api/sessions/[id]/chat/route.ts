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
- Your questions must sound like SPOKEN language, not written essay prompts. Keep questions under 20 words when possible.
- NEVER use academic phrasing like "How might the collaboration between different art forms enhance cultural expression." Instead say: "In the image, music and dance are together. How do people in your culture use music or dance?"
- When the student gives a short answer (under 15 words), do NOT change the topic. Instead, dig deeper into what they just said. Use their exact words. Example: if they say "the black piano creates emphasis", ask "What kind of emphasis? What feeling does it give you?"
- Mix question types: start with easy concrete questions, then gradually move to abstract ones. Never ask two abstract questions in a row.
- If the student says they don't understand, simplify DRAMATICALLY. Use basic words. Break the question into a smaller, more specific question.
- If the student goes off-topic, redirect them back to the image and theme.

IMAGE CONTEXT (for your reference only — do NOT reveal this information to the student):
${imageContextBlock}

QUESTION STRATEGY:
Your goal is to get the student talking as much as possible. Shorter, simpler questions produce longer, richer answers.

Phase 1 — Warm-up (first 2 questions):
Reference something specific the student said in their presentation. Ask them to explain ONE specific point further.
Keep questions concrete and simple. Under 15 words.
Examples: "You talked about the shadow being larger than the dancer. Why do you think that matters?"

Phase 2 — Image Details (next 2-3 questions):
Ask about specific things IN the image. Point to details.
Connect their answers to culture with simple follow-ups.
Examples: "What do you notice about how the two people are positioned?" → then → "Does that remind you of any relationship in your own life?"

Phase 3 — Personal Connection (next 2-3 questions):
Ask about their own life and experiences. These are the easiest questions for students to answer in depth.
Examples: "You mentioned being Chinese. How does your family think about hard work?" NOT "How do these values manifest in your cultural background?"

Phase 4 — Opinion & Depth (next 2-3 questions):
NOW ask bigger questions — but still in simple language.
Examples: "Do you think identity is something we choose, or something others give us?" NOT "What is your opinion on the potential pressures of balancing one's identity on external expectations?"

Phase 5 — Final (1 question):
One clear, open question that lets them show range.
Examples: "If you could change one thing about how people see each other, what would it be?"

CRITICAL RULES:
- ADAPT your vocabulary to the student's level. If they use simple words, you use simple words. If they demonstrate advanced vocabulary, you can match it.
- After EVERY student response, your next question must reference something they just said. Never ignore their answer to ask a pre-planned question.
- Prefer "you" questions over "people" questions. "What do YOU think about..." is better than "How might one consider..."
- Track which criteria you still need evidence for. If you haven't heard complex grammar, ask a question that requires it. If you haven't heard cultural connections, ask for them.
- Vary your question types: open-ended, specific, comparative, hypothetical, opinion-based.
- If the student consistently gives short answers (under 15 words), ask progressively more specific questions to draw out longer responses. Example: Instead of "Tell me more", ask "You said [their exact words]. What do you mean by that?"
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

  console.log(`[CHAT] User ${session.user.id} sending message to session=${id}`);

  const practiceSession = await db.session.findUnique({
    where: { id },
    include: { image: true },
  });

  if (!practiceSession || practiceSession.userId !== session.user.id) {
    console.log(`[CHAT] Unauthorized or session not found: session=${id}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (practiceSession.status !== "CONVERSING") {
    console.log(`[CHAT] Session=${id} not in CONVERSING state (current: ${practiceSession.status})`);
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
    const wordCount = studentMessage.split(/\s+/).filter(Boolean).length;
    console.log(`[CHAT] Student message (${wordCount} words): "${studentMessage.substring(0, 100)}${studentMessage.length > 100 ? "..." : ""}"`);
    transcript.push({
      role: "student",
      content: studentMessage,
      timestamp: new Date().toISOString(),
      wordCount,
    });
  } else {
    console.log(`[CHAT] No student message — requesting initial examiner question`);
  }

  console.log(`[CHAT] Transcript has ${transcript.length} conversation messages`);

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

  console.log(`[CHAT] Calling GPT-4o with ${openaiMessages.length} messages`);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: openaiMessages,
    max_tokens: 300,
    temperature: 0.7,
  });

  const aiResponse = completion.choices[0]?.message?.content || "";
  console.log(`[CHAT] Examiner response (${completion.usage?.total_tokens || "?"} tokens): "${aiResponse.substring(0, 150)}${aiResponse.length > 150 ? "..." : ""}"`);

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

  console.log(`[CHAT] Metrics: studentWords=${metrics.totalStudentWords}, studentMsgs=${metrics.totalStudentMessages}, examinerMsgs=${metrics.totalExaminerMessages}, avgLength=${metrics.averageResponseLength}`);

  const existingFeedback =
    (practiceSession.feedback as Record<string, unknown>) || {};
  await db.session.update({
    where: { id },
    data: {
      transcript: updatedTranscript,
      feedback: { ...existingFeedback, conversationMetrics: metrics },
    },
  });

  console.log(`[CHAT] Session=${id} updated with new transcript and metrics`);

  return NextResponse.json({ message: aiResponse, transcript });
}
