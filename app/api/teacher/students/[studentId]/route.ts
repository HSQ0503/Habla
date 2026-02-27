import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await params;

  // Verify student is in teacher's class
  const teacherClass = await db.class.findFirst({
    where: { teacherId: session.user.id },
  });
  if (!teacherClass) {
    return NextResponse.json({ error: "No class found" }, { status: 404 });
  }

  const student = await db.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      classId: true,
      teacherNotes: true,
      createdAt: true,
    },
  });
  if (!student || student.classId !== teacherClass.id) {
    return NextResponse.json({ error: "Student not in your class" }, { status: 403 });
  }

  const sessions = await db.session.findMany({
    where: { userId: studentId, status: "COMPLETED", scoreA: { not: null } },
    include: { image: { select: { id: true, url: true, theme: true } }, violations: true },
    orderBy: { completedAt: "desc" },
  });

  const scores = sessions.map((s) => ({
    date: s.completedAt?.toISOString() || s.createdAt.toISOString(),
    total: (s.scoreA || 0) + (s.scoreB1 || 0) + (s.scoreB2 || 0) + (s.scoreC || 0),
    A: s.scoreA || 0,
    B1: s.scoreB1 || 0,
    B2: s.scoreB2 || 0,
    C: s.scoreC || 0,
  }));

  const totalSessions = sessions.length;
  const avgScore =
    totalSessions > 0
      ? Math.round((scores.reduce((s, x) => s + x.total, 0) / totalSessions) * 10) / 10
      : null;
  const bestScore = totalSessions > 0 ? Math.max(...scores.map((s) => s.total)) : null;
  const lastActive = sessions[0]?.completedAt || null;

  const criterionAvgs =
    totalSessions > 0
      ? {
          A: Math.round((scores.reduce((s, x) => s + x.A, 0) / totalSessions) * 10) / 10,
          B1: Math.round((scores.reduce((s, x) => s + x.B1, 0) / totalSessions) * 10) / 10,
          B2: Math.round((scores.reduce((s, x) => s + x.B2, 0) / totalSessions) * 10) / 10,
          C: Math.round((scores.reduce((s, x) => s + x.C, 0) / totalSessions) * 10) / 10,
        }
      : { A: null, B1: null, B2: null, C: null };

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      teacherNotes: student.teacherNotes,
      memberSince: student.createdAt,
    },
    stats: { totalSessions, avgScore, bestScore, lastActive },
    criterionAvgs,
    scores,
    sessions: sessions.map((s) => ({
      id: s.id,
      image: s.image,
      feedback: s.feedback,
      scoreA: s.scoreA,
      scoreB1: s.scoreB1,
      scoreB2: s.scoreB2,
      scoreC: s.scoreC,
      total: (s.scoreA || 0) + (s.scoreB1 || 0) + (s.scoreB2 || 0) + (s.scoreC || 0),
      violationCount: s.violations.length,
      completedAt: s.completedAt,
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await params;

  const teacherClass = await db.class.findFirst({
    where: { teacherId: session.user.id },
  });
  if (!teacherClass) {
    return NextResponse.json({ error: "No class found" }, { status: 404 });
  }

  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { classId: true },
  });
  if (!student || student.classId !== teacherClass.id) {
    return NextResponse.json({ error: "Student not in your class" }, { status: 403 });
  }

  const { teacherNotes } = await request.json();
  await db.user.update({
    where: { id: studentId },
    data: { teacherNotes },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await params;

  const teacherClass = await db.class.findFirst({
    where: { teacherId: session.user.id },
  });
  if (!teacherClass) {
    return NextResponse.json({ error: "No class found" }, { status: 404 });
  }

  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { classId: true },
  });
  if (!student || student.classId !== teacherClass.id) {
    return NextResponse.json({ error: "Student not in your class" }, { status: 403 });
  }

  await db.user.update({
    where: { id: studentId },
    data: { classId: null },
  });

  return NextResponse.json({ success: true });
}
