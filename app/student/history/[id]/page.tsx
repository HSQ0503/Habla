import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";

type ChatMessage = {
  role: "student" | "examiner" | "presentation";
  content: string;
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const practiceSession = await db.session.findUnique({
    where: { id },
    include: { image: true },
  });

  if (!practiceSession || practiceSession.userId !== session!.user.id) {
    notFound();
  }

  const theme = themeColors[practiceSession.image.theme] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: practiceSession.image.theme,
  };

  const transcript = (practiceSession.transcript as ChatMessage[]) || [];
  const presentationText = transcript.find((m) => m.role === "presentation")?.content;
  const conversation = transcript.filter((m) => m.role !== "presentation");

  const scores = [
    { label: "Criterion A", value: practiceSession.scoreA },
    { label: "Criterion B1", value: practiceSession.scoreB1 },
    { label: "Criterion B2", value: practiceSession.scoreB2 },
    { label: "Criterion C", value: practiceSession.scoreC },
  ];
  const hasScores = scores.some((s) => s.value !== null);

  const statusLabel: Record<string, { text: string; color: string }> = {
    PREPARING: { text: "Preparing", color: "text-yellow-600 bg-yellow-50" },
    PRESENTING: { text: "Presenting", color: "text-blue-600 bg-blue-50" },
    CONVERSING: { text: "Conversing", color: "text-purple-600 bg-purple-50" },
    COMPLETED: { text: "Completed", color: "text-green-600 bg-green-50" },
    TERMINATED: { text: "Terminated", color: "text-red-600 bg-red-50" },
  };
  const status = statusLabel[practiceSession.status] || {
    text: practiceSession.status,
    color: "text-gray-600 bg-gray-50",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/student/history"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to History
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
          {theme.label}
        </span>
        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>
          {status.text}
        </span>
        <span className="text-sm text-gray-400">
          {practiceSession.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Image */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={practiceSession.image.url}
          alt={practiceSession.image.culturalContext}
          className="w-full max-h-64 object-contain bg-gray-100"
        />
        <div className="p-4">
          <p className="text-sm text-gray-600">{practiceSession.image.culturalContext}</p>
        </div>
      </div>

      {/* Scores */}
      {hasScores && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {scores.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {s.value !== null ? s.value : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Presentation */}
      {presentationText && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Your Presentation
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {presentationText}
          </p>
        </div>
      )}

      {/* Conversation transcript */}
      {conversation.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
            Conversation Transcript
          </h2>
          <div className="space-y-4">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                    msg.role === "student"
                      ? "bg-gray-100 text-gray-900 rounded-br-md"
                      : "bg-indigo-50 text-indigo-900 rounded-bl-md"
                  }`}
                >
                  <p className="text-xs font-medium mb-1 opacity-60">
                    {msg.role === "student" ? "You" : "Examiner"}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/student/practice"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Start New Practice
        </Link>
        <Link
          href="/student/history"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          View All Sessions
        </Link>
      </div>
    </div>
  );
}
