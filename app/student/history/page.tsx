import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const sessions = await db.session.findMany({
    where: { userId },
    include: {
      image: { select: { theme: true, culturalContext: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Session History</h1>
      <p className="text-sm text-gray-500 mb-6">
        {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
      </p>

      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 mb-4">No practice sessions yet.</p>
          <Link
            href="/student/practice"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Your First Practice
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(
            (s: {
              id: string;
              image: { theme: string };
              scoreA: number | null;
              scoreB1: number | null;
              scoreB2: number | null;
              scoreC: number | null;
              status: string;
              createdAt: Date;
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
                ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
                : null;

            const statusLabel: Record<string, { text: string; color: string }> = {
              PREPARING: { text: "Preparing", color: "text-yellow-600 bg-yellow-50" },
              PRESENTING: { text: "Presenting", color: "text-blue-600 bg-blue-50" },
              CONVERSING: { text: "Conversing", color: "text-purple-600 bg-purple-50" },
              COMPLETED: { text: "Completed", color: "text-green-600 bg-green-50" },
              TERMINATED: { text: "Terminated", color: "text-red-600 bg-red-50" },
            };

            const status = statusLabel[s.status] || {
              text: s.status,
              color: "text-gray-600 bg-gray-50",
            };

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
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${status.color}`}>
                    {status.text}
                  </span>
                  <span className="text-sm text-gray-500 truncate">
                    {new Date(s.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
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
      )}
    </div>
  );
}
