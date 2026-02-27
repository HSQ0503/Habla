import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacherClass = await db.class.findFirst({
    where: { teacherId: session.user.id },
  });
  if (!teacherClass) {
    return NextResponse.json({ students: [] });
  }

  const students = await db.user.findMany({
    where: { classId: teacherClass.id, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      sessions: {
        where: { status: "COMPLETED", scoreA: { not: null } },
        select: { scoreA: true, scoreB1: true, scoreB2: true, scoreC: true, completedAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = students.map((s) => {
    const scored = s.sessions;
    const avgScore =
      scored.length > 0
        ? scored.reduce(
            (sum, ses) =>
              sum + (ses.scoreA || 0) + (ses.scoreB1 || 0) + (ses.scoreB2 || 0) + (ses.scoreC || 0),
            0
          ) / scored.length
        : null;
    const lastActive =
      scored.length > 0
        ? scored.reduce((latest, ses) => {
            const d = ses.completedAt ? new Date(ses.completedAt) : new Date(0);
            return d > latest ? d : latest;
          }, new Date(0))
        : null;

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      joinedAt: s.createdAt,
      sessionCount: scored.length,
      avgScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
      lastActive,
    };
  });

  return NextResponse.json({ students: result });
}
