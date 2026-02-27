import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";
import { CriterionBars, ScoreTrend } from "@/components/dashboard/DashboardCharts";

function scoreColor(total: number) {
  if (total >= 20) return "text-green-600";
  if (total >= 12) return "text-yellow-600";
  return "text-red-500";
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
    include: {
      image: { select: { theme: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  const totalCompleted = completedSessions.length;

  // Scored sessions with all 4 criterion scores
  const scored = completedSessions.filter(
    (s) => s.scoreA !== null && s.scoreB1 !== null && s.scoreB2 !== null && s.scoreC !== null
  );

  // Total scores (sum of all criteria, out of 30)
  const totals = scored.map((s) => (s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0));

  const avgScore =
    totals.length > 0
      ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10
      : null;

  const bestScore =
    totals.length > 0
      ? Math.round(Math.max(...totals) * 10) / 10
      : null;

  const lastSessionDate = completedSessions[0]?.completedAt;

  // Criterion averages
  const avgA = scored.length > 0 ? Math.round((scored.reduce((a, s) => a + (s.scoreA ?? 0), 0) / scored.length) * 10) / 10 : null;
  const avgB1 = scored.length > 0 ? Math.round((scored.reduce((a, s) => a + (s.scoreB1 ?? 0), 0) / scored.length) * 10) / 10 : null;
  const avgB2 = scored.length > 0 ? Math.round((scored.reduce((a, s) => a + (s.scoreB2 ?? 0), 0) / scored.length) * 10) / 10 : null;
  const avgC = scored.length > 0 ? Math.round((scored.reduce((a, s) => a + (s.scoreC ?? 0), 0) / scored.length) * 10) / 10 : null;

  // Score trend data (chronological)
  const scoreTrendData = scored
    .slice()
    .reverse()
    .map((s) => ({
      date: (s.completedAt ?? s.createdAt).toISOString(),
      total: Math.round(((s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0)) * 10) / 10,
    }));

  const recentSessions = completedSessions.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your progress and start a new IO practice session.
        </p>
      </div>

      {totalCompleted === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-16 h-16 mx-auto text-indigo-200 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Ready for your first IO practice?
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Choose an image, prepare your thoughts, and practice your oral presentation with an AI examiner.
          </p>
          <Link
            href="/student/practice"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Start New Practice
          </Link>
        </div>
      ) : (
        <>
          {/* Stats - 4 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg text-indigo-600 bg-indigo-50">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{totalCompleted}</p>
              <p className="text-sm text-gray-500 mt-0.5">Sessions Completed</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg text-green-600 bg-green-50">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {avgScore !== null ? <>{avgScore}<span className="text-sm font-normal text-gray-400">/30</span></> : "—"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">Average Score</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg text-amber-600 bg-amber-50">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.996.078-1.927.228-2.25.75l3.659 3.659M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.996.078 1.927.228 2.25.75l-3.659 3.659M18.75 4.236V2.721m0 1.515-2.023.331M5.25 4.236l2.022.331m11.455 0c-.373 1.838-1.193 3.502-2.354 4.904M7.272 4.567c.373 1.838 1.193 3.502 2.354 4.904m6.879 0a12.14 12.14 0 0 1-2.505 2.021m-6.879-6.925c.373 1.838 1.193 3.502 2.354 4.904m4.525 0a12.14 12.14 0 0 1-4.525 0" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {bestScore !== null ? <>{bestScore}<span className="text-sm font-normal text-gray-400">/30</span></> : "—"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">Best Score</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg text-purple-600 bg-purple-50">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {lastSessionDate
                  ? new Date(lastSessionDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">Last Practice</p>
            </div>
          </div>

          {/* Criterion averages */}
          {avgA !== null && (
            <CriterionBars avgs={{ A: avgA, B1: avgB1, B2: avgB2, C: avgC }} />
          )}

          {/* Score trend chart */}
          <ScoreTrend scores={scoreTrendData} />

          {/* CTA */}
          <div className="mb-8">
            <Link
              href="/student/practice"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Start New Practice
            </Link>
          </div>

          {/* Recent sessions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Recent Sessions
              </h2>
              <Link
                href="/student/history"
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {recentSessions.map((s) => {
                const theme = themeColors[s.image.theme] || {
                  bg: "bg-gray-100",
                  text: "text-gray-700",
                  label: s.image.theme,
                };
                const hasScores = s.scoreA !== null && s.scoreB1 !== null && s.scoreB2 !== null && s.scoreC !== null;
                const total = hasScores
                  ? Math.round(((s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0)) * 10) / 10
                  : null;
                const duration = formatDuration(s.prepStartedAt, s.completedAt);

                return (
                  <Link
                    key={s.id}
                    href={`/student/history/${s.id}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${theme.bg} ${theme.text}`}>
                        {theme.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {s.completedAt
                          ? new Date(s.completedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                      {duration && (
                        <span className="text-xs text-gray-400">{duration}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {/* Criterion dots */}
                      {hasScores && (
                        <div className="hidden sm:flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">A:{s.scoreA}</span>
                          <span className="text-xs text-gray-400">B1:{s.scoreB1}</span>
                          <span className="text-xs text-gray-400">B2:{s.scoreB2}</span>
                          <span className="text-xs text-gray-400">C:{s.scoreC}</span>
                        </div>
                      )}
                      {total !== null && (
                        <span className={`text-sm font-semibold ${scoreColor(total)}`}>
                          {total}/30
                        </span>
                      )}
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
