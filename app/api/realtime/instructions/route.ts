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

  const practiceSession = await db.session.findUnique({
    where: { id: sessionId },
    include: { image: true },
  });

  if (!practiceSession || practiceSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (practiceSession.status !== "CONVERSING") {
    return NextResponse.json(
      { error: "Session must be in CONVERSING state" },
      { status: 400 }
    );
  }

  const transcript = (practiceSession.transcript as ChatMessage[]) || [];
  const presentationEntry = transcript.find((m) => m.role === "presentation");

  const instructions = buildSystemPrompt(
    practiceSession.image.culturalContext,
    practiceSession.image.theme,
    practiceSession.image.talkingPoints,
    presentationEntry?.content,
    (practiceSession.image as Record<string, unknown>).aiAnalysis as AiAnalysis | null,
    { mode: "voice" }
  );

  console.log(`[REALTIME:INSTRUCTIONS] Built conversation prompt (${instructions.length} chars) for session=${sessionId}`);

  return NextResponse.json({ instructions });
}
