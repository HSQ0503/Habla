import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";
import { CriterionBars, ScoreTrend } from "@/components/dashboard/DashboardCharts";

function scoreHue(total: number) {
  if (total >= 20) return { color: "oklch(0.4 0.1 155)", bg: "var(--sage-soft)", border: "oklch(0.82 0.07 155)" };
  if (total >= 12) return { color: "oklch(0.42 0.13 65)", bg: "var(--gold-soft)", border: "oklch(0.82 0.09 65)" };
  return { color: "oklch(0.42 0.14 25)", bg: "var(--rose-soft)", border: "oklch(0.82 0.09 25)" };
}

function formatDuration(startDate: Date | null, endDate: Date | null) {
  if (!startDate || !endDate) return null;
  const diffMs = endDate.getTime() - startDate.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const completedSessions = await db.session.findMany({
    where: { userId, status: "COMPLETED" },
    include: { image: { select: { theme: true } } },
    orderBy: { completedAt: "desc" },
  });

  const totalCompleted = completedSessions.length;
  const scored = completedSessions.filter(
    (s) => s.scoreA !== null && s.scoreB1 !== null && s.scoreB2 !== null && s.scoreC !== null
  );
  const totals = scored.map(
    (s) => (s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0)
  );

  const avgScore =
    totals.length > 0
      ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10
      : null;
  const bestScore = totals.length > 0 ? Math.round(Math.max(...totals) * 10) / 10 : null;
  const lastSessionDate = completedSessions[0]?.completedAt;

  const avgA =
    scored.length > 0
      ? Math.round((scored.reduce((a, s) => a + (s.scoreA ?? 0), 0) / scored.length) * 10) / 10
      : null;
  const avgB1 =
    scored.length > 0
      ? Math.round((scored.reduce((a, s) => a + (s.scoreB1 ?? 0), 0) / scored.length) * 10) / 10
      : null;
  const avgB2 =
    scored.length > 0
      ? Math.round((scored.reduce((a, s) => a + (s.scoreB2 ?? 0), 0) / scored.length) * 10) / 10
      : null;
  const avgC =
    scored.length > 0
      ? Math.round((scored.reduce((a, s) => a + (s.scoreC ?? 0), 0) / scored.length) * 10) / 10
      : null;

  const scoreTrendData = scored
    .slice()
    .reverse()
    .map((s) => ({
      date: (s.completedAt ?? s.createdAt).toISOString(),
      total:
        Math.round(
          ((s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0)) * 10
        ) / 10,
    }));

  const recentSessions = completedSessions.slice(0, 5);
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Dashboard</div>
        <h1 className="display" style={{ fontSize: "clamp(32px, 3.4vw, 42px)", margin: 0 }}>
          Welcome back, <em>{firstName}</em>.
        </h1>
        <p style={{ color: "var(--ink-3)", marginTop: 10, fontSize: 16 }}>
          Track your progress and start a new IO practice session.
        </p>
      </div>

      {totalCompleted === 0 ? (
        <div
          className="card"
          style={{
            padding: "60px 28px",
            textAlign: "center",
            background:
              "radial-gradient(circle at 50% 0%, var(--indigo-softer) 0%, var(--card) 70%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--indigo-softer)",
              border: "1.5px solid var(--ink)",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={30} height={30} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="var(--ink)">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <h2 className="display" style={{ fontSize: 26, margin: "0 0 10px" }}>
            Ready for your first practice?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "var(--ink-3)",
              maxWidth: 380,
              margin: "0 auto 28px",
              lineHeight: 1.5,
            }}
          >
            Choose an image, take 15 minutes to prepare, and practice your IO with the AI examiner.
          </p>
          <Link href="/student/practice" className="btn-primary">
            Start new practice
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div className="stat">
              <div className="stat-label">Sessions completed</div>
              <div className="stat-value">{totalCompleted}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Average score</div>
              <div className="stat-value">
                {avgScore !== null ? (
                  <>
                    {avgScore}
                    <span style={{ fontSize: 18, color: "var(--ink-4)", fontWeight: 500 }}>/30</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Best score</div>
              <div className="stat-value">
                {bestScore !== null ? (
                  <>
                    {bestScore}
                    <span style={{ fontSize: 18, color: "var(--ink-4)", fontWeight: 500 }}>/30</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Last practice</div>
              <div className="stat-value" style={{ fontSize: 26 }}>
                {lastSessionDate
                  ? new Date(lastSessionDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </div>
            </div>
          </div>

          {avgA !== null && <CriterionBars avgs={{ A: avgA, B1: avgB1, B2: avgB2, C: avgC }} />}

          <ScoreTrend scores={scoreTrendData} />

          <div
            className="card-soft"
            style={{
              padding: 20,
              marginBottom: 32,
              background: "var(--indigo-softer)",
              border: "1px solid var(--accent-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--accent-2)" }}>
                Ready for more practice?
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-3)" }}>
                Start a new session to keep improving.
              </p>
            </div>
            <Link href="/student/practice" className="btn-primary">
              Start new practice
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div className="eyebrow">Recent sessions</div>
              <Link
                href="/student/history"
                style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)" }}
              >
                View all →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentSessions.map((s) => {
                const theme = themeColors[s.image.theme];
                const hasScores =
                  s.scoreA !== null && s.scoreB1 !== null && s.scoreB2 !== null && s.scoreC !== null;
                const total = hasScores
                  ? Math.round(
                      ((s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0)) * 10
                    ) / 10
                  : null;
                const duration = formatDuration(s.prepStartedAt, s.completedAt);
                const hue = total !== null ? scoreHue(total) : null;

                return (
                  <Link
                    key={s.id}
                    href={`/student/history/${s.id}`}
                    className="card-soft"
                    style={{
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      transition: "border-color 150ms ease, box-shadow 150ms ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      {theme && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: theme.soft,
                            color: theme.accent,
                            border: `1px solid ${theme.accent}20`,
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
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
                      <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
                        {s.completedAt
                          ? new Date(s.completedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                      {duration && (
                        <span
                          className="mono"
                          style={{ fontSize: 11, color: "var(--ink-4)" }}
                        >
                          {duration}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexShrink: 0,
                      }}
                    >
                      {hasScores && (
                        <div
                          className="mono"
                          style={{
                            display: "none",
                            gap: 10,
                            fontSize: 11,
                            color: "var(--ink-4)",
                          }}
                          data-hide-sm
                        >
                          <span>A:{s.scoreA}</span>
                          <span>B1:{s.scoreB1}</span>
                          <span>B2:{s.scoreB2}</span>
                          <span>C:{s.scoreC}</span>
                        </div>
                      )}
                      {total !== null && hue && (
                        <span
                          style={{
                            padding: "4px 10px",
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
                      )}
                      <svg
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth={2}
                        stroke="var(--ink-4)"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
