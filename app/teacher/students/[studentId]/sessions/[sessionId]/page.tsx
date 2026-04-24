"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";
import FeedbackView from "@/components/practice/FeedbackView";
import TranscriptView from "@/components/practice/TranscriptView";
import SessionAnalytics from "@/components/session/SessionAnalytics";
import type { FeedbackResult, ChatMessage } from "@/lib/types";

type SessionData = {
  id: string;
  image: { url: string; theme: string };
  transcript: ChatMessage[] | null;
  feedback: FeedbackResult & { overrides?: Record<string, OverrideEntry> };
  scoreA: number | null;
  scoreB1: number | null;
  scoreB2: number | null;
  scoreC: number | null;
  completedAt: string | null;
  violations: { id: string; type: string; timestamp: string }[];
};

type OverrideEntry = {
  originalScore: number;
  newScore: number;
  justification: string;
  teacherId: string;
  overriddenAt: string;
};

type Tab = "feedback" | "transcript" | "analytics" | "violations" | "override";

const CRITERIA = [
  { key: "A", label: "A — Language", max: 12, field: "scoreA" as const },
  { key: "B1", label: "B1 — Visual Stimulus", max: 6, field: "scoreB1" as const },
  { key: "B2", label: "B2 — Conversation", max: 6, field: "scoreB2" as const },
  { key: "C", label: "C — Interactive Skills", max: 6, field: "scoreC" as const },
];

function scoreHue(total: number) {
  if (total >= 20) return { color: "oklch(0.4 0.1 155)", bg: "var(--sage-soft)", border: "oklch(0.82 0.07 155)" };
  if (total >= 12) return { color: "oklch(0.42 0.13 65)", bg: "var(--gold-soft)", border: "oklch(0.82 0.09 65)" };
  return { color: "oklch(0.42 0.14 25)", bg: "var(--rose-soft)", border: "oklch(0.82 0.09 25)" };
}

export default function TeacherSessionDetailPage() {
  const { studentId, sessionId } = useParams<{ studentId: string; sessionId: string }>();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("feedback");

  const [overrideScores, setOverrideScores] = useState<Record<string, string>>({});
  const [overrideJustifications, setOverrideJustifications] = useState<Record<string, string>>({});
  const [overrideSaving, setOverrideSaving] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  async function submitOverride(criterion: string) {
    const score = parseFloat(overrideScores[criterion]);
    const justification = overrideJustifications[criterion];
    if (isNaN(score) || !justification?.trim()) return;

    setOverrideSaving(criterion);
    const res = await fetch(`/api/sessions/${sessionId}/override`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criterion, newScore: score, justification: justification.trim() }),
    });
    if (res.ok) {
      setOverrideSuccess(criterion);
      setTimeout(() => setOverrideSuccess(null), 2000);
      await fetchData();
      setOverrideScores((prev) => ({ ...prev, [criterion]: "" }));
      setOverrideJustifications((prev) => ({ ...prev, [criterion]: "" }));
    }
    setOverrideSaving(null);
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          color: "var(--ink-3)",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!data || !data.feedback?.ibGrades) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
          Session not found or feedback not yet available.
        </p>
      </div>
    );
  }

  const total = (data.scoreA || 0) + (data.scoreB1 || 0) + (data.scoreB2 || 0) + (data.scoreC || 0);
  const transcript = (data.transcript || []) as ChatMessage[];
  const overrides = data.feedback.overrides || {};
  const hasViolations = data.violations && data.violations.length > 0;
  const theme = themeColors[data.image.theme];
  const hue = scoreHue(total);

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "feedback", label: "Feedback", show: true },
    { key: "transcript", label: "Transcript", show: true },
    { key: "analytics", label: "Analytics", show: true },
    { key: "violations", label: `Violations (${data.violations?.length || 0})`, show: !!hasViolations },
    { key: "override", label: "Override", show: true },
  ];

  return (
    <div>
      <Link
        href={`/teacher/students/${studentId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--ink-3)",
          marginBottom: 20,
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to student
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.image.url}
          alt=""
          style={{
            width: 72,
            height: 72,
            borderRadius: 12,
            objectFit: "cover",
            border: "1px solid var(--line)",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
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
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: theme.accent }} />
                {theme.label}
              </span>
            )}
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
              {data.completedAt ? new Date(data.completedAt).toLocaleDateString() : ""}
            </span>
          </div>
          <div
            className="display"
            style={{
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: hue.color,
            }}
          >
            {total}
            <span style={{ fontSize: 18, color: "var(--ink-4)", fontWeight: 500 }}>/30</span>
          </div>
        </div>
      </div>

      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
        <nav style={{ display: "flex", gap: 28, marginBottom: -1, flexWrap: "wrap" }}>
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "12px 0 14px",
                  fontSize: 14,
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  borderBottom: tab === t.key ? "2px solid var(--ink)" : "2px solid transparent",
                  color: tab === t.key ? "var(--ink)" : "var(--ink-3)",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
        </nav>
      </div>

      {tab === "feedback" && (
        <FeedbackView
          feedback={data.feedback}
          transcript={transcript}
          imageUrl={data.image.url}
          hideActions
        />
      )}

      {tab === "transcript" && (
        <TranscriptView transcript={transcript} onBack={() => setTab("feedback")} />
      )}

      {tab === "analytics" && <SessionAnalytics feedback={data.feedback} />}

      {tab === "violations" && hasViolations && (
        <div>
          <div
            className="card"
            style={{
              padding: 18,
              marginBottom: 16,
              background: "var(--rose-soft)",
              borderColor: "oklch(0.82 0.09 25)",
            }}
          >
            <p style={{ fontSize: 14, color: "oklch(0.42 0.14 25)", fontWeight: 500, margin: 0 }}>
              {data.violations.length} violation{data.violations.length !== 1 ? "s" : ""} detected during this session
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.violations.map((v) => (
              <div
                key={v.id}
                className="card-soft"
                style={{
                  padding: "12px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span className="badge badge-rose">{v.type.replace("_", " ")}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  {new Date(v.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "override" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CRITERIA.map((c) => {
            const existing = overrides[c.key] as OverrideEntry | undefined;
            const currentScore = data[c.field];

            return (
              <div key={c.key} className="card" style={{ padding: 22 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                    {c.label}
                  </h3>
                  <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
                    Current:{" "}
                    <span className="mono" style={{ fontWeight: 600, color: "var(--ink)" }}>
                      {currentScore ?? "—"}
                    </span>
                    /{c.max}
                  </span>
                </div>

                {existing && (
                  <div
                    style={{
                      background: "var(--gold-soft)",
                      border: "1px solid oklch(0.82 0.09 65)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      marginBottom: 12,
                    }}
                  >
                    <p style={{ fontSize: 12, color: "oklch(0.42 0.13 65)", margin: 0 }}>
                      Overridden from{" "}
                      <span style={{ textDecoration: "line-through" }}>{existing.originalScore}</span> to{" "}
                      <strong>{existing.newScore}</strong>
                    </p>
                    <p style={{ fontSize: 12, color: "oklch(0.42 0.13 65)", margin: "4px 0 0" }}>
                      {existing.justification}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div style={{ width: 90, flexShrink: 0 }}>
                    <label className="label">New score</label>
                    <input
                      type="number"
                      min={0}
                      max={c.max}
                      step={1}
                      value={overrideScores[c.key] || ""}
                      onChange={(e) =>
                        setOverrideScores((prev) => ({ ...prev, [c.key]: e.target.value }))
                      }
                      className="input"
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="label">Justification</label>
                    <textarea
                      value={overrideJustifications[c.key] || ""}
                      onChange={(e) =>
                        setOverrideJustifications((prev) => ({
                          ...prev,
                          [c.key]: e.target.value,
                        }))
                      }
                      placeholder="Explain the reason for this override…"
                      rows={2}
                      className="input"
                      style={{ resize: "none" }}
                    />
                  </div>
                  <div style={{ paddingTop: 22, flexShrink: 0 }}>
                    <button
                      onClick={() => submitOverride(c.key)}
                      disabled={
                        !overrideScores[c.key] ||
                        !overrideJustifications[c.key]?.trim() ||
                        overrideSaving === c.key
                      }
                      className="btn-primary"
                      style={{
                        opacity:
                          !overrideScores[c.key] ||
                          !overrideJustifications[c.key]?.trim() ||
                          overrideSaving === c.key
                            ? 0.5
                            : 1,
                      }}
                    >
                      {overrideSaving === c.key
                        ? "Saving…"
                        : overrideSuccess === c.key
                        ? "Saved!"
                        : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
