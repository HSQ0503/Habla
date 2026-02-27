"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";
import FeedbackView from "@/components/practice/FeedbackView";
import TranscriptView from "@/components/practice/TranscriptView";
import type { ChatMessage, FeedbackResult } from "@/lib/types";
import SessionAnalytics from "@/components/session/SessionAnalytics";

type SessionData = {
  id: string;
  status: string;
  feedback: FeedbackResult | { error: boolean; message: string } | null;
  scoreA: number | null;
  scoreB1: number | null;
  scoreB2: number | null;
  scoreC: number | null;
  transcript: ChatMessage[];
  image: { url: string; theme: string };
  createdAt: string;
  prepStartedAt: string | null;
  completedAt: string | null;
};

function hasFeedbackResult(feedback: unknown): feedback is FeedbackResult {
  return (
    feedback !== null &&
    typeof feedback === "object" &&
    "ibGrades" in (feedback as Record<string, unknown>) &&
    "quantitative" in (feedback as Record<string, unknown>)
  );
}

function isFeedbackError(
  feedback: unknown
): feedback is { error: boolean; message: string } {
  return (
    feedback !== null &&
    typeof feedback === "object" &&
    "error" in (feedback as Record<string, unknown>) &&
    (feedback as Record<string, unknown>).error === true
  );
}

function scoreColor(total: number) {
  if (total >= 20) return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" };
  if (total >= 12) return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" };
  return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" };
}

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "<1 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const TABS = [
  { key: "feedback", label: "Feedback" },
  { key: "transcript", label: "Transcript" },
  { key: "analytics", label: "Analytics" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "feedback"
  );
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    async function load() {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) {
        setError("Session not found");
        setLoading(false);
        return;
      }
      const data: SessionData = await res.json();
      setSession(data);
      setLoading(false);

      if (data.status === "COMPLETED" && !hasFeedbackResult(data.feedback)) {
        setAnalyzing(true);
        interval = setInterval(async () => {
          const pollRes = await fetch(`/api/sessions/${id}`);
          if (!pollRes.ok) return;
          const updated: SessionData = await pollRes.json();
          setSession(updated);
          if (hasFeedbackResult(updated.feedback) || isFeedbackError(updated.feedback)) {
            setAnalyzing(false);
            if (interval) clearInterval(interval);
          }
        }, 3000);
        timeout = setTimeout(() => {
          if (interval) clearInterval(interval);
          setAnalyzing(false);
        }, 120000);
      }
    }

    load();
    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [id]);

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  async function retryAnalysis() {
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${id}/analyze`, { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        setSession((prev) =>
          prev ? { ...prev, feedback: result, scoreA: result.ibGrades.criterionA.mark } : prev
        );
      } else {
        setError("Analysis failed. Please try again.");
      }
    } catch {
      setError("Analysis failed. Please try again.");
    }
    setAnalyzing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading session...
        </div>
      </div>
    );
  }

  if (!session || error === "Session not found") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Session not found</p>
          <Link href="/student/history" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-xl border border-gray-200 p-8 max-w-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
            <svg className="animate-spin h-7 w-7 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Analyzing your performance...</h2>
          <p className="text-sm text-gray-500">
            Your transcript is being graded against the IB rubric. This usually takes 15-30 seconds.
          </p>
        </div>
      </div>
    );
  }

  if (isFeedbackError(session.feedback)) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Analysis Failed</h2>
          <p className="text-sm text-gray-500 mb-4">{session.feedback.message}</p>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <button
            onClick={retryAnalysis}
            className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const theme = themeColors[session.image.theme] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: session.image.theme,
  };
  const hasFeedback = hasFeedbackResult(session.feedback);
  const total = hasFeedback ? (session.feedback as FeedbackResult).ibGrades.totalMark : null;
  const duration = formatDuration(session.prepStartedAt, session.completedAt);
  const sc = total !== null ? scoreColor(total) : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/student/history"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to History
      </Link>

      {/* Top section: image + theme + date + score */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-start gap-4 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session.image.url}
            alt="Session image"
            className="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
                {theme.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(session.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            {duration && (
              <p className="text-xs text-gray-400 mt-0.5">Duration: {duration}</p>
            )}
          </div>
        </div>

        {/* Score banner */}
        {total !== null && sc && (
          <div className={`rounded-xl border ${sc.border} ${sc.bg} px-5 py-3 text-center shrink-0`}>
            <p className={`text-3xl font-bold ${sc.text}`}>
              {total}<span className="text-sm font-normal opacity-60">/30</span>
            </p>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      {hasFeedback && (
        <>
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === "feedback" && (
            <FeedbackView
              feedback={session.feedback as FeedbackResult}
              transcript={session.transcript || []}
              imageUrl={session.image.url}
              hideActions
            />
          )}

          {activeTab === "transcript" && (
            <TranscriptView
              transcript={session.transcript || []}
              onBack={() => switchTab("feedback")}
            />
          )}

          {activeTab === "analytics" && (
            <SessionAnalytics feedback={session.feedback as FeedbackResult} />
          )}
        </>
      )}

      {/* Fallback for sessions without feedback */}
      {!hasFeedback && (
        <>
          {/* Presentation text */}
          {session.transcript?.find((m) => m.role === "presentation") && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Your Presentation
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {session.transcript.find((m) => m.role === "presentation")?.content}
              </p>
            </div>
          )}

          {/* Conversation */}
          {session.transcript?.filter((m) => m.role !== "presentation").length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                Conversation Transcript
              </h2>
              <div className="space-y-4">
                {session.transcript
                  .filter((m) => m.role !== "presentation")
                  .map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}>
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

          {session.status === "COMPLETED" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center mb-6">
              <p className="text-sm text-gray-500 mb-3">This session hasn&apos;t been analyzed yet.</p>
              <button
                onClick={retryAnalysis}
                className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Analyze Now
              </button>
            </div>
          )}
        </>
      )}

      {/* Bottom actions */}
      <div className="flex gap-3 mt-8">
        <Link
          href={`/student/practice?theme=${session.image.theme}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Practice Again
        </Link>
        <Link
          href="/student/history"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Back to History
        </Link>
      </div>
    </div>
  );
}
