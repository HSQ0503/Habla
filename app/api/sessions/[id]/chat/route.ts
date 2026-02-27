import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildSystemPrompt } from "@/lib/examiner-prompt";
import OpenAI from "openai";
import type { ChatMessage, AiAnalysis, ConversationMetrics } from "@/lib/types";

const openai = new OpenAI();

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
