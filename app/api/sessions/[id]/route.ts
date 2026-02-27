import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { advanceSession } from "@/lib/session-state-machine";
import { generateFeedback } from "@/lib/feedback-generator";
import type { ChatMessage } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const practiceSession = await db.session.findUnique({
    where: { id },
    include: { image: true, violations: true },
  });

  if (!practiceSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Verify ownership: student owns it or teacher of student's class
  const isOwner = practiceSession.userId === session.user.id;
  if (!isOwner && session.user.role === "TEACHER") {
    const student = await db.user.findUnique({
      where: { id: practiceSession.userId },
      select: { classId: true },
    });
    const teacherClass = await db.class.findFirst({
      where: { teacherId: session.user.id, id: student?.classId || "" },
    });
    if (!teacherClass) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (!isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strip aiAnalysis from image data — students should never see it
  if (session.user.role === "STUDENT") {
    const { aiAnalysis: _, ...imageWithoutAnalysis } = practiceSession.image as Record<string, unknown>;
    return NextResponse.json({ ...practiceSession, image: imageWithoutAnalysis });
  }

  return NextResponse.json(practiceSession);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, presentationText } = await request.json();

  // Verify ownership
  const practiceSession = await db.session.findUnique({ where: { id } });
  if (!practiceSession || practiceSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[SESSION:PATCH] User ${session.user.id} advancing session=${id} to ${status}`);

  try {
    const updated = await advanceSession(id, status);

    // Save presentation text into transcript when moving to CONVERSING
    if (status === "CONVERSING" && presentationText) {
      const wordCount = presentationText.split(/\s+/).filter(Boolean).length;
      console.log(`[SESSION:PATCH] Saving presentation text (${wordCount} words) to session=${id}`);
      const transcript =
        (updated.transcript as ChatMessage[]) || [];
      transcript.unshift({
        role: "presentation" as const,
        content: presentationText,
        timestamp: new Date().toISOString(),
        wordCount,
      });
      await db.session.update({
        where: { id },
        data: { transcript },
      });
    }

    // Auto-trigger analysis when session completes
    if (status === "COMPLETED") {
      console.log(`[SESSION:PATCH] Session=${id} completed — triggering auto-analysis`);
      const fullSession = await db.session.findUnique({
        where: { id },
        include: { image: true },
      });
      if (fullSession) {
        // Fire and forget — don't block the response
        generateFeedback(fullSession)
          .then(async (result) => {
            console.log(`[SESSION:PATCH] Auto-analysis complete for session=${id}, total=${result.ibGrades.totalMark}/30`);
            await db.session.update({
              where: { id },
              data: {
                scoreA: result.ibGrades.criterionA.mark,
                scoreB1: result.ibGrades.criterionB1.mark,
                scoreB2: result.ibGrades.criterionB2.mark,
                scoreC: result.ibGrades.criterionC.mark,
                feedback: JSON.parse(JSON.stringify(result)),
                speakingPace: result.quantitative.pace.overallWPM,
                vocabularyLevel: result.quantitative.vocabulary.estimatedLevel,
              },
            });
            console.log(`[SESSION:PATCH] Scores saved to DB for session=${id}`);
          })
          .catch((err) => {
            console.error(`[SESSION:PATCH] Auto-analysis FAILED for session=${id}:`, err);
            db.session.update({
              where: { id },
              data: {
                feedback: {
                  error: true,
                  message: err instanceof Error ? err.message : "Analysis failed",
                },
              },
            }).catch(console.error);
          });
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid transition";
    console.error(`[SESSION:PATCH] Transition failed for session=${id}: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
