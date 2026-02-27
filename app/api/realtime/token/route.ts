import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildSystemPrompt } from "@/lib/examiner-prompt";
import type { ChatMessage, AiAnalysis } from "@/lib/types";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  console.log(`[REALTIME:TOKEN] User ${session.user.id} requesting token for session=${sessionId}`);

  const practiceSession = await db.session.findUnique({
    where: { id: sessionId },
    include: { image: true },
  });

  if (!practiceSession || practiceSession.userId !== session.user.id) {
    console.log(`[REALTIME:TOKEN] Unauthorized or session not found: session=${sessionId}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isPresentingOrConversing = practiceSession.status === "PRESENTING" || practiceSession.status === "CONVERSING";
  if (!isPresentingOrConversing) {
    console.log(`[REALTIME:TOKEN] Session=${sessionId} not in PRESENTING/CONVERSING state (current: ${practiceSession.status})`);
    return NextResponse.json(
      { error: "Session must be in PRESENTING or CONVERSING state" },
      { status: 400 }
    );
  }

  let instructions: string;
  let turnDetection: { type: string; threshold: number; prefix_padding_ms: number; silence_duration_ms: number };

  if (practiceSession.status === "PRESENTING") {
    // Minimal prompt — AI must NOT speak during presentation
    instructions = `You are an IB Individual Oral examiner. The student is now giving their presentation. LISTEN SILENTLY. Do NOT speak, do NOT respond, do NOT interrupt. You will be given instructions when the conversation phase begins.`;
    turnDetection = {
      type: "server_vad",
      threshold: 0.9,
      prefix_padding_ms: 300,
      silence_duration_ms: 5000,
    };
  } else {
    // CONVERSING — full examiner prompt
    const transcript = (practiceSession.transcript as ChatMessage[]) || [];
    const presentationEntry = transcript.find((m) => m.role === "presentation");

    instructions = buildSystemPrompt(
      practiceSession.image.culturalContext,
      practiceSession.image.theme,
      practiceSession.image.talkingPoints,
      presentationEntry?.content,
      (practiceSession.image as Record<string, unknown>).aiAnalysis as AiAnalysis | null,
      { mode: "voice" }
    );
    turnDetection = {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 800,
    };
  }

  console.log(`[REALTIME:TOKEN] Built voice prompt for ${practiceSession.status} (${instructions.length} chars) session=${sessionId}`);

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime",
          instructions,
          audio: {
            output: { voice: "alloy" },
          },
          input_audio_transcription: {
            model: "gpt-4o-mini-transcription",
          },
          turn_detection: turnDetection,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[REALTIME:TOKEN] OpenAI API error: ${response.status} ${errorData}`);
      return NextResponse.json(
        { error: "Failed to create voice session" },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log(`[REALTIME:TOKEN] Token created for session=${sessionId}`);

    return NextResponse.json({ token: data.value });
  } catch (err) {
    console.error(`[REALTIME:TOKEN] Failed to create client secret:`, err);
    return NextResponse.json(
      { error: "Failed to create voice session" },
      { status: 500 }
    );
  }
}
