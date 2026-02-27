import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const SCORE_RANGES: Record<string, { min: number; max: number; field: string }> = {
  A: { min: 0, max: 12, field: "scoreA" },
  B1: { min: 0, max: 6, field: "scoreB1" },
  B2: { min: 0, max: 6, field: "scoreB2" },
  C: { min: 0, max: 6, field: "scoreC" },
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { criterion, newScore, justification } = await request.json();

  if (!criterion || !SCORE_RANGES[criterion]) {
    return NextResponse.json({ error: "Invalid criterion" }, { status: 400 });
  }
  const range = SCORE_RANGES[criterion];

  if (typeof newScore !== "number" || newScore < range.min || newScore > range.max) {
    return NextResponse.json(
      { error: `Score must be between ${range.min} and ${range.max}` },
      { status: 400 }
    );
  }

  if (!justification || typeof justification !== "string" || justification.trim().length === 0) {
    return NextResponse.json({ error: "Justification is required" }, { status: 400 });
  }

  // Verify teacher owns the student's class
  const practiceSession = await db.session.findUnique({
    where: { id },
    select: { userId: true, feedback: true, scoreA: true, scoreB1: true, scoreB2: true, scoreC: true },
  });
  if (!practiceSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const student = await db.user.findUnique({
    where: { id: practiceSession.userId },
    select: { classId: true },
  });
  const teacherClass = await db.class.findFirst({
    where: { teacherId: session.user.id, id: student?.classId || "" },
  });
  if (!teacherClass) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Build override entry
  const originalScore = practiceSession[range.field as keyof typeof practiceSession] as number | null;
  const feedback = (practiceSession.feedback as Record<string, unknown>) || {};
  const overrides = (feedback.overrides as Record<string, unknown>) || {};
  overrides[criterion] = {
    originalScore,
    newScore,
    justification: justification.trim(),
    teacherId: session.user.id,
    overriddenAt: new Date().toISOString(),
  };
  feedback.overrides = overrides;

  // Update score field + feedback
  await db.session.update({
    where: { id },
    data: {
      [range.field]: newScore,
      feedback: feedback as unknown as Record<string, unknown> & { toJSON(): unknown },
    },
  });

  return NextResponse.json({ success: true });
}
