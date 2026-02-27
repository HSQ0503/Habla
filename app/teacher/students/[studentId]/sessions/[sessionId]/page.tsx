"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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

function themeLabel(theme: string) {
  return theme
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

function themeBadgeColor(theme: string) {
  const colors: Record<string, string> = {
    IDENTITIES: "bg-blue-50 text-blue-700",
    EXPERIENCES: "bg-purple-50 text-purple-700",
    HUMAN_INGENUITY: "bg-amber-50 text-amber-700",
    SOCIAL_ORGANIZATION: "bg-green-50 text-green-700",
    SHARING_THE_PLANET: "bg-teal-50 text-teal-700",
  };
  return colors[theme] || "bg-gray-50 text-gray-700";
}

export default function TeacherSessionDetailPage() {
  const { studentId, sessionId } = useParams<{ studentId: string; sessionId: string }>();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("feedback");

  // Override form state
  const [overrideScores, setOverrideScores] = useState<Record<string, string>>({});
  const [overrideJustifications, setOverrideJustifications] = useState<Record<string, string>>({});
  const [overrideSaving, setOverrideSaving] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void (async () => { await fetchData(); })();
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.feedback?.ibGrades) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-500">Session not found or feedback not yet available.</p>
      </div>
    );
  }

  const total = (data.scoreA || 0) + (data.scoreB1 || 0) + (data.scoreB2 || 0) + (data.scoreC || 0);
  const transcript = (data.transcript || []) as ChatMessage[];
  const overrides = data.feedback.overrides || {};
  const hasViolations = data.violations && data.violations.length > 0;

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "feedback", label: "Feedback", show: true },
    { key: "transcript", label: "Transcript", show: true },
    { key: "analytics", label: "Analytics", show: true },
    { key: "violations", label: `Violations (${data.violations?.length || 0})`, show: !!hasViolations },
    { key: "override", label: "Override", show: true },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/teacher/students/${studentId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Student
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.image.url}
          alt=""
          className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"
        />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs rounded-full ${themeBadgeColor(data.image.theme)}`}>
              {themeLabel(data.image.theme)}
            </span>
            <span className="text-xs text-gray-400">
              {data.completedAt ? new Date(data.completedAt).toLocaleDateString() : ""}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {total}<span className="text-lg font-normal text-gray-400">/30</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 -mb-px">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
        </nav>
      </div>

      {/* Tab content */}
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-700 font-medium">
              {data.violations.length} violation{data.violations.length !== 1 ? "s" : ""} detected during this session
            </p>
          </div>
          <div className="space-y-2">
            {data.violations.map((v) => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded-full">
                    {v.type.replace("_", " ")}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(v.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "override" && (
        <div className="space-y-6">
          {CRITERIA.map((c) => {
            const existing = overrides[c.key] as OverrideEntry | undefined;
            const currentScore = data[c.field];

            return (
              <div key={c.key} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{c.label}</h3>
                  <span className="text-sm text-gray-500">
                    Current: <span className="font-semibold text-gray-900">{currentScore ?? "—"}</span>/{c.max}
                  </span>
                </div>

                {existing && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-amber-700">
                      Overridden from <span className="line-through">{existing.originalScore}</span> to{" "}
                      <span className="font-semibold">{existing.newScore}</span>
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">{existing.justification}</p>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-24 shrink-0">
                    <label className="text-xs text-gray-500 block mb-1">New Score</label>
                    <input
                      type="number"
                      min={0}
                      max={c.max}
                      step={1}
                      value={overrideScores[c.key] || ""}
                      onChange={(e) =>
                        setOverrideScores((prev) => ({ ...prev, [c.key]: e.target.value }))
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Justification</label>
                    <textarea
                      value={overrideJustifications[c.key] || ""}
                      onChange={(e) =>
                        setOverrideJustifications((prev) => ({
                          ...prev,
                          [c.key]: e.target.value,
                        }))
                      }
                      placeholder="Explain the reason for this override..."
                      rows={2}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div className="shrink-0 pt-5">
                    <button
                      onClick={() => submitOverride(c.key)}
                      disabled={
                        !overrideScores[c.key] ||
                        !overrideJustifications[c.key]?.trim() ||
                        overrideSaving === c.key
                      }
                      className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {overrideSaving === c.key
                        ? "Saving..."
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
