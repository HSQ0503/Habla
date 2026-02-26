import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI();

type ChatMessage = {
  role: "student" | "examiner" | "presentation";
  content: string;
};

function buildSystemPrompt(
  imageContext: string,
  theme: string,
  talkingPoints: string[],
  presentationText?: string
) {
  let prompt = `You are an IB examiner for the Individual Oral (IO). You are evaluating a student.

Protocol:
- Ask follow-up questions about the image and the student's cultural connections
- Start with questions about the image, then go deeper into the theme
- Ask about personal connections to the theme
- Vary the difficulty of your questions based on the student's responses
- Speak ONLY in English
- Be encouraging but maintain the formality of an examiner
- Ask ONE question at a time
- If the student gives short answers, ask more specific questions to get more detail
- Connect your questions to what the student has already said

The image shows: ${imageContext}
Theme: ${theme}
Suggested talking points: ${talkingPoints.join(", ")}`;

  if (presentationText) {
    prompt += `

The student gave the following presentation about the image (use this to guide your questions, reference specific points they made, and probe deeper into areas they mentioned):

"""
${presentationText}
"""`;
  }

  return prompt;
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
    transcript.push({ role: "student", content: studentMessage });
  }

  // Build OpenAI messages
  const systemPrompt = buildSystemPrompt(
    practiceSession.image.culturalContext,
    practiceSession.image.theme,
    practiceSession.image.talkingPoints,
    presentationText
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

  transcript.push({ role: "examiner", content: aiResponse });

  // Rebuild full transcript with presentation entry preserved
  const updatedTranscript: ChatMessage[] = presentationEntry
    ? [presentationEntry, ...transcript]
    : transcript;

  await db.session.update({
    where: { id },
    data: { transcript: updatedTranscript },
  });

  return NextResponse.json({ message: aiResponse, transcript });
}
