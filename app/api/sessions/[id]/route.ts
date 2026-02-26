import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { advanceSession } from "@/lib/session-state-machine";

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

  try {
    const updated = await advanceSession(id, status);

    // Save presentation text into transcript when moving to CONVERSING
    if (status === "CONVERSING" && presentationText) {
      const transcript = (updated.transcript as { role: string; content: string }[]) || [];
      transcript.unshift({ role: "presentation", content: presentationText });
      await db.session.update({
        where: { id },
        data: { transcript: transcript as unknown as import("@prisma/client").Prisma.InputJsonValue },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid transition";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
