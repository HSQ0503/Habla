import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";

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

  // Average score across all criteria
  let avgScore: number | null = null;
  if (totalCompleted > 0) {
    const scores = completedSessions
      .map(
        (s: {
          scoreA: number | null;
          scoreB1: number | null;
          scoreB2: number | null;
          scoreC: number | null;
        }): number | null => {
          const vals = [s.scoreA, s.scoreB1, s.scoreB2, s.scoreC].filter(
            (v): v is number => v !== null
          );
          return vals.length > 0
            ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length
            : null;
        }
      )
      .filter((v: number | null): v is number => v !== null);
    if (scores.length > 0) {
      avgScore =
        Math.round(
          (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10
        ) / 10;
    }
  }

  const lastSessionDate = completedSessions[0]?.completedAt;

  const recentSessions = completedSessions.slice(0, 3);

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
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                {avgScore !== null ? avgScore : "—"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">Average Score</p>
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
              {recentSessions.map(
                (s: {
                  id: string;
                  image: { theme: string };
                  scoreA: number | null;
                  scoreB1: number | null;
                  scoreB2: number | null;
                  scoreC: number | null;
                  completedAt: Date | null;
                }) => {
                const theme = themeColors[s.image.theme] || {
                  bg: "bg-gray-100",
                  text: "text-gray-700",
                  label: s.image.theme,
                };
                const scores = [s.scoreA, s.scoreB1, s.scoreB2, s.scoreC].filter(
                  (v): v is number => v !== null
                );
                const avg =
                  scores.length > 0
                    ? Math.round(
                        (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) *
                          10
                      ) / 10
                    : null;

                return (
                  <Link
                    key={s.id}
                    href={`/student/history/${s.id}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
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
                    </div>
                    <div className="flex items-center gap-4">
                      {avg !== null && (
                        <span className="text-sm font-medium text-gray-900">
                          {avg}/10
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
