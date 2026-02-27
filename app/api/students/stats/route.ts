import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const completedSessions = await db.session.findMany({
    where: { userId, status: "COMPLETED" },
    include: {
      image: { select: { id: true, url: true, theme: true } },
    },
    orderBy: { completedAt: "asc" },
  });

  const scored = completedSessions.filter(
    (s) => s.scoreA !== null && s.scoreB1 !== null && s.scoreB2 !== null && s.scoreC !== null
  );

  // Total scores array
  const allScores = scored.map((s) => {
    const total = (s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0);
    return {
      date: (s.completedAt ?? s.createdAt).toISOString(),
      scoreA: s.scoreA!,
      scoreB1: s.scoreB1!,
      scoreB2: s.scoreB2!,
      scoreC: s.scoreC!,
      total: Math.round(total * 10) / 10,
      theme: s.image.theme,
    };
  });

  const totalSessions = completedSessions.length;
  const averageScore =
    allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b.total, 0) / allScores.length) * 10) / 10
      : null;
  const bestScore =
    allScores.length > 0
      ? Math.max(...allScores.map((s) => s.total))
      : null;

  // Criterion averages
  const avgA = scored.length > 0 ? scored.reduce((a, s) => a + (s.scoreA ?? 0), 0) / scored.length : null;
  const avgB1 = scored.length > 0 ? scored.reduce((a, s) => a + (s.scoreB1 ?? 0), 0) / scored.length : null;
  const avgB2 = scored.length > 0 ? scored.reduce((a, s) => a + (s.scoreB2 ?? 0), 0) / scored.length : null;
  const avgC = scored.length > 0 ? scored.reduce((a, s) => a + (s.scoreC ?? 0), 0) / scored.length : null;

  // Streak: consecutive days going backward from today
  let currentStreak = 0;
  if (completedSessions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDates = new Set(
      completedSessions.map((s) => {
        const d = new Date(s.completedAt ?? s.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    const checkDate = new Date(today);
    // Check today first, then go backward
    while (sessionDates.has(checkDate.getTime())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    // If no session today, check if streak starts from yesterday
    if (currentStreak === 0) {
      checkDate.setTime(today.getTime());
      checkDate.setDate(checkDate.getDate() - 1);
      while (sessionDates.has(checkDate.getTime())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
  }

  // Recent sessions (last 5, newest first)
  const recentSessions = completedSessions
    .slice()
    .reverse()
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      theme: s.image.theme,
      imageUrl: s.image.url,
      scoreA: s.scoreA,
      scoreB1: s.scoreB1,
      scoreB2: s.scoreB2,
      scoreC: s.scoreC,
      total: s.scoreA !== null ? (s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0) : null,
      completedAt: (s.completedAt ?? s.createdAt).toISOString(),
      prepStartedAt: s.prepStartedAt?.toISOString() ?? null,
      converseStartedAt: s.converseStartedAt?.toISOString() ?? null,
    }));

  // Weekly frequency (last 8 weeks)
  const weeklyFrequency: { week: string; sessions: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = completedSessions.filter((s) => {
      const d = new Date(s.completedAt ?? s.createdAt);
      return d >= weekStart && d < weekEnd;
    }).length;

    weeklyFrequency.push({
      week: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sessions: count,
    });
  }

  // Theme performance
  const themeMap = new Map<string, { total: number; count: number }>();
  for (const s of allScores) {
    const existing = themeMap.get(s.theme) ?? { total: 0, count: 0 };
    existing.total += s.total;
    existing.count++;
    themeMap.set(s.theme, existing);
  }
  const themeLabels: Record<string, string> = {
    IDENTITIES: "Identities",
    EXPERIENCES: "Experiences",
    HUMAN_INGENUITY: "Human Ingenuity",
    SOCIAL_ORGANIZATION: "Social Organization",
    SHARING_THE_PLANET: "Sharing the Planet",
  };
  const themePerformance = Array.from(themeMap.entries()).map(([theme, { total, count }]) => ({
    theme: themeLabels[theme] || theme,
    avg: Math.round((total / count) * 10) / 10,
    count,
  }));

  return NextResponse.json({
    totalSessions,
    averageScore,
    bestScore,
    currentStreak,
    averageCriterionScores: {
      A: avgA !== null ? Math.round(avgA * 10) / 10 : null,
      B1: avgB1 !== null ? Math.round(avgB1 * 10) / 10 : null,
      B2: avgB2 !== null ? Math.round(avgB2 * 10) / 10 : null,
      C: avgC !== null ? Math.round(avgC * 10) / 10 : null,
    },
    recentSessions,
    allScores,
    weeklyFrequency,
    themePerformance,
  });
}
