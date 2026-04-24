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

function isFeedbackError(feedback: unknown): feedback is { error: boolean; message: string } {
  return (
    feedback !== null &&
    typeof feedback === "object" &&
    "error" in (feedback as Record<string, unknown>) &&
    (feedback as Record<string, unknown>).error === true
  );
}

function scoreHue(total: number) {
  if (total >= 20) return { color: "oklch(0.4 0.1 155)", bg: "var(--sage-soft)", border: "oklch(0.82 0.07 155)" };
  if (total >= 12) return { color: "oklch(0.42 0.13 65)", bg: "var(--gold-soft)", border: "oklch(0.82 0.09 65)" };
  return { color: "oklch(0.42 0.14 25)", bg: "var(--rose-soft)", border: "oklch(0.82 0.09 25)" };
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

function Loading({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "var(--ink-3)",
        fontSize: 14,
      }}
    >
      {label}
    </div>
  );
}

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

  if (loading) return <Loading label="Loading session…" />;

  if (!session || error === "Session not found") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p style={{ color: "var(--ink-3)", margin: 0 }}>Session not found</p>
        <Link
          href="/student/history"
          style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)" }}
        >
          ← Back to history
        </Link>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div className="card" style={{ padding: 36, maxWidth: 380, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--indigo-softer)",
              border: "1.5px solid var(--ink)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              style={{ animation: "habla-pulse-dot 1.4s ease-in-out infinite" }}
            >
              <circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="2" strokeDasharray="44" />
            </svg>
          </div>
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 8px" }}>
            Analyzing your performance…
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-3)", margin: 0 }}>
            Your transcript is being graded against the IB rubric. Usually 15–30 seconds.
          </p>
        </div>
      </div>
    );
  }

  if (isFeedbackError(session.feedback)) {
    return (
      <div style={{ maxWidth: 440, margin: "48px auto 0" }}>
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--rose-soft)",
              border: "1.5px solid oklch(0.82 0.09 25)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="oklch(0.5 0.16 25)">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 8px" }}>
            Analysis failed
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 16 }}>
            {session.feedback.message}
          </p>
          {error && (
            <p style={{ fontSize: 13, color: "oklch(0.5 0.16 25)", marginBottom: 12 }}>{error}</p>
          )}
          <button onClick={retryAnalysis} className="btn-primary">
            Retry analysis
          </button>
        </div>
      </div>
    );
  }

  const theme = themeColors[session.image.theme];
  const hasFeedback = hasFeedbackResult(session.feedback);
  const total = hasFeedback ? (session.feedback as FeedbackResult).ibGrades.totalMark : null;
  const duration = formatDuration(session.prepStartedAt, session.completedAt);
  const hue = total !== null ? scoreHue(total) : null;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <Link
        href="/student/history"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--ink-3)",
          marginBottom: 18,
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to history
      </Link>

      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 28,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", gap: 16, flex: 1, minWidth: 260 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session.image.url}
            alt="Session stimulus"
            style={{
              width: 88,
              height: 88,
              borderRadius: 12,
              objectFit: "cover",
              border: "1px solid var(--line)",
              flexShrink: 0,
            }}
          />
          <div>
            {theme && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: theme.soft,
                  color: theme.accent,
                  border: `1px solid ${theme.accent}20`,
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: theme.accent }} />
                {theme.label}
              </span>
            )}
            <h1
              className="display"
              style={{ fontSize: "clamp(22px, 2.4vw, 30px)", margin: "0 0 6px" }}
            >
              {new Date(session.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h1>
            {duration && (
              <p className="mono" style={{ fontSize: 12, color: "var(--ink-4)", margin: 0 }}>
                Duration: {duration}
              </p>
            )}
          </div>
        </div>

        {total !== null && hue && (
          <div
            className="card"
            style={{
              padding: "18px 24px",
              background: hue.bg,
              borderColor: hue.border,
              textAlign: "center",
              minWidth: 120,
            }}
          >
            <div
              className="display"
              style={{
                fontSize: 44,
                fontWeight: 600,
                color: hue.color,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {total}
              <span style={{ fontSize: 18, opacity: 0.6, fontWeight: 500 }}>/30</span>
            </div>
          </div>
        )}
      </div>

      {hasFeedback && (
        <>
          <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
            <nav style={{ display: "flex", gap: 28 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  style={{
                    padding: "12px 0 14px",
                    fontSize: 14,
                    fontWeight: 500,
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === tab.key ? "2px solid var(--ink)" : "2px solid transparent",
                    color: activeTab === tab.key ? "var(--ink)" : "var(--ink-3)",
                    cursor: "pointer",
                    transition: "color 150ms ease, border-color 150ms ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

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

      {!hasFeedback && (
        <>
          {session.transcript?.find((m) => m.role === "presentation") && (
            <div className="card" style={{ padding: 22, marginBottom: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Your presentation</div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--ink-2)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}
              >
                {session.transcript.find((m) => m.role === "presentation")?.content}
              </p>
            </div>
          )}

          {session.transcript?.filter((m) => m.role !== "presentation").length > 0 && (
            <div className="card" style={{ padding: 22, marginBottom: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Conversation transcript</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {session.transcript
                  .filter((m) => m.role !== "presentation")
                  .map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: msg.role === "student" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "82%",
                          borderRadius: 16,
                          borderTopLeftRadius: msg.role === "student" ? 16 : 6,
                          borderTopRightRadius: msg.role === "student" ? 6 : 16,
                          padding: "10px 14px",
                          background: msg.role === "student" ? "var(--ink)" : "var(--indigo-softer)",
                          color: msg.role === "student" ? "var(--paper)" : "var(--ink)",
                          border: msg.role === "student"
                            ? "1px solid var(--ink)"
                            : "1px solid oklch(0.88 0.04 280)",
                        }}
                      >
                        <p className="eyebrow" style={{
                          margin: 0,
                          marginBottom: 4,
                          fontSize: 10,
                          color: msg.role === "student" ? "oklch(0.75 0.02 275)" : "var(--ink-3)",
                        }}>
                          {msg.role === "student" ? "You" : "Examiner"}
                        </p>
                        <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {session.status === "COMPLETED" && (
            <div className="card" style={{ padding: 26, textAlign: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 14 }}>
                This session hasn&apos;t been analyzed yet.
              </p>
              <button onClick={retryAnalysis} className="btn-primary">
                Analyze now
              </button>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
        <Link
          href={`/student/practice?theme=${session.image.theme}`}
          className="btn-primary"
        >
          Practice again
        </Link>
        <Link href="/student/history" className="btn-ghost">
          Back to history
        </Link>
      </div>
    </div>
  );
}
