import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";
import { CriterionBars } from "@/components/dashboard/DashboardCharts";

function scoreHue(total: number) {
  if (total >= 20) return { color: "oklch(0.4 0.1 155)", bg: "var(--sage-soft)", border: "oklch(0.82 0.07 155)" };
  if (total >= 12) return { color: "oklch(0.42 0.13 65)", bg: "var(--gold-soft)", border: "oklch(0.82 0.09 65)" };
  return { color: "oklch(0.42 0.14 25)", bg: "var(--rose-soft)", border: "oklch(0.82 0.09 25)" };
}

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);
  const teacherId = session!.user.id;

  const teacherClass = await db.class.findFirst({
    where: { teacherId },
    select: { id: true },
  });

  const classFilter = teacherClass
    ? { user: { classId: teacherClass.id } }
    : { userId: "__none__" };

  const [imageCount, studentCount, sessionCount, scoreAgg, recentSessions] = await Promise.all([
    db.image.count(),
    teacherClass
      ? db.user.count({ where: { role: "STUDENT", classId: teacherClass.id } })
      : 0,
    db.session.count({ where: classFilter }),
    teacherClass
      ? db.session.aggregate({
          where: { ...classFilter, status: "COMPLETED", scoreA: { not: null } },
          _avg: { scoreA: true, scoreB1: true, scoreB2: true, scoreC: true },
        })
      : null,
    teacherClass
      ? db.session.findMany({
          where: { ...classFilter, status: "COMPLETED", scoreA: { not: null } },
          include: {
            user: { select: { id: true, name: true } },
            image: { select: { theme: true } },
          },
          orderBy: { completedAt: "desc" },
          take: 10,
        })
      : [],
  ]);

  const classAvg =
    scoreAgg?._avg?.scoreA != null
      ? Math.round(
          ((scoreAgg._avg.scoreA || 0) +
            (scoreAgg._avg.scoreB1 || 0) +
            (scoreAgg._avg.scoreB2 || 0) +
            (scoreAgg._avg.scoreC || 0)) *
            10
        ) / 10
      : null;

  const criterionAvgs =
    scoreAgg?._avg?.scoreA != null
      ? {
          A: Math.round((scoreAgg._avg.scoreA || 0) * 10) / 10,
          B1: Math.round((scoreAgg._avg.scoreB1 || 0) * 10) / 10,
          B2: Math.round((scoreAgg._avg.scoreB2 || 0) * 10) / 10,
          C: Math.round((scoreAgg._avg.scoreC || 0) * 10) / 10,
        }
      : null;

  const teacherFirst = session?.user?.name?.split(" ")[0];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Dashboard</div>
        <h1 className="display" style={{ fontSize: "clamp(32px, 3.4vw, 42px)", margin: 0 }}>
          Welcome back, <em>{teacherFirst}</em>.
        </h1>
        <p style={{ color: "var(--ink-3)", marginTop: 10, fontSize: 16 }}>
          Here&apos;s an overview of your classroom activity.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <div className="stat">
          <div className="stat-label">Images in library</div>
          <div className="stat-value">{imageCount}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Students enrolled</div>
          <div className="stat-value">{studentCount}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Practice sessions</div>
          <div className="stat-value">{sessionCount}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Class average</div>
          <div className="stat-value">
            {classAvg !== null ? (
              <>
                {classAvg}
                <span style={{ fontSize: 18, color: "var(--ink-4)", fontWeight: 500 }}>/30</span>
              </>
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Quick actions</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          <Link
            href="/teacher/images"
            className="card-soft"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--indigo-softer)",
                border: "1px solid var(--accent-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="var(--accent-2)">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="display" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                Manage images
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-3)" }}>
                Upload, review, and organize practice images
              </p>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="var(--ink-4)">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
          <Link
            href="/teacher/class"
            className="card-soft"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--sage-soft)",
                border: "1px solid oklch(0.82 0.07 155)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="oklch(0.4 0.1 155)">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="display" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                View class
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-3)" }}>
                See student enrollment and class details
              </p>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="var(--ink-4)">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Recent activity</div>
        <div className="card" style={{ overflow: "hidden" }}>
          {recentSessions.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
                No practice sessions yet.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Theme</th>
                  <th style={{ textAlign: "right" }}>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => {
                  const total =
                    (s.scoreA || 0) + (s.scoreB1 || 0) + (s.scoreB2 || 0) + (s.scoreC || 0);
                  const hue = scoreHue(total);
                  const theme = themeColors[s.image.theme];
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link
                          href={`/teacher/students/${s.user.id}/sessions/${s.id}`}
                          style={{ color: "var(--ink)", fontWeight: 500 }}
                        >
                          {s.user.name}
                        </Link>
                      </td>
                      <td>
                        {theme && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "2px 9px",
                              borderRadius: 999,
                              background: theme.soft,
                              color: theme.accent,
                              border: `1px solid ${theme.accent}20`,
                              fontSize: 11.5,
                              fontWeight: 500,
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: theme.accent,
                              }}
                            />
                            {theme.label}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "3px 9px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            background: hue.bg,
                            color: hue.color,
                            border: `1px solid ${hue.border}`,
                          }}
                        >
                          {total}/30
                        </span>
                      </td>
                      <td style={{ color: "var(--ink-4)", fontSize: 12 }}>
                        {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {criterionAvgs && <CriterionBars avgs={criterionAvgs} />}
    </div>
  );
}
