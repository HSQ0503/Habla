"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";
import { CriterionBars, ScoreTrend } from "@/components/dashboard/DashboardCharts";

type StudentData = {
  student: {
    id: string;
    name: string;
    email: string;
    teacherNotes: string | null;
    memberSince: string;
  };
  stats: {
    totalSessions: number;
    avgScore: number | null;
    bestScore: number | null;
    lastActive: string | null;
  };
  criterionAvgs: { A: number | null; B1: number | null; B2: number | null; C: number | null };
  scores: { date: string; total: number; A: number; B1: number; B2: number; C: number }[];
  sessions: {
    id: string;
    image: { id: string; url: string; theme: string };
    scoreA: number | null;
    scoreB1: number | null;
    scoreB2: number | null;
    scoreC: number | null;
    total: number;
    violationCount: number;
    completedAt: string | null;
  }[];
};

function scoreHue(total: number) {
  if (total >= 20) return { color: "oklch(0.4 0.1 155)", bg: "var(--sage-soft)", border: "oklch(0.82 0.07 155)" };
  if (total >= 12) return { color: "oklch(0.42 0.13 65)", bg: "var(--gold-soft)", border: "oklch(0.82 0.09 65)" };
  return { color: "oklch(0.42 0.14 25)", bg: "var(--rose-soft)", border: "oklch(0.82 0.09 25)" };
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout>(undefined);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/teacher/students/${studentId}`);
    if (res.ok) {
      const d = await res.json();
      setData(d);
      setNotes(d.student.teacherNotes || "");
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  function handleNotesChange(value: string) {
    setNotes(value);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/teacher/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherNotes: value }),
      });
      setSaving(false);
    }, 1000);
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

  if (!data) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
          Student not found or not in your class.
        </p>
      </div>
    );
  }

  const { student, stats, criterionAvgs, scores, sessions } = data;

  const criteriaList = [
    { key: "A", label: "Language", max: 12, avg: criterionAvgs.A },
    { key: "B1", label: "Visual Stimulus", max: 6, avg: criterionAvgs.B1 },
    { key: "B2", label: "Conversation", max: 6, avg: criterionAvgs.B2 },
    { key: "C", label: "Interactive Skills", max: 6, avg: criterionAvgs.C },
  ];
  const withPct = criteriaList
    .filter((c) => c.avg !== null)
    .map((c) => ({ ...c, pct: (c.avg! / c.max) * 100 }));
  const strongest = withPct.length > 0 ? withPct.reduce((a, b) => (a.pct > b.pct ? a : b)) : null;
  const weakest = withPct.length > 0 ? withPct.reduce((a, b) => (a.pct < b.pct ? a : b)) : null;

  return (
    <div>
      <Link
        href="/teacher/class"
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
        Back to class
      </Link>

      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Student</div>
        <h1 className="display" style={{ fontSize: "clamp(30px, 3vw, 40px)", margin: 0 }}>
          {student.name}
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-3)", margin: "6px 0 0" }}>{student.email}</p>
        <p className="mono" style={{ fontSize: 11, color: "var(--ink-4)", margin: "4px 0 0" }}>
          Member since {new Date(student.memberSince).toLocaleDateString()}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div className="stat">
          <div className="stat-label">Total sessions</div>
          <div className="stat-value">{stats.totalSessions}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Average</div>
          <div className="stat-value">
            {stats.avgScore !== null ? (
              <>
                {stats.avgScore}
                <span style={{ fontSize: 16, color: "var(--ink-4)", fontWeight: 500 }}>/30</span>
              </>
            ) : (
              "—"
            )}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Best</div>
          <div className="stat-value">
            {stats.bestScore !== null ? (
              <>
                {stats.bestScore}
                <span style={{ fontSize: 16, color: "var(--ink-4)", fontWeight: 500 }}>/30</span>
              </>
            ) : (
              "—"
            )}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Last active</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : "—"}
          </div>
        </div>
      </div>

      <ScoreTrend scores={scores.map((s) => ({ date: s.date, total: s.total })).reverse()} />
      {criterionAvgs.A !== null && <CriterionBars avgs={criterionAvgs} />}

      {strongest && weakest && strongest.key !== weakest.key && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div
            className="card"
            style={{
              padding: 18,
              background: "var(--sage-soft)",
              borderColor: "oklch(0.82 0.07 155)",
            }}
          >
            <div className="eyebrow" style={{ color: "oklch(0.4 0.1 155)", marginBottom: 4 }}>
              Strongest area
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "oklch(0.35 0.1 155)", margin: 0 }}>
              {strongest.label}
            </p>
            <p className="mono" style={{ fontSize: 12, color: "oklch(0.4 0.1 155)", margin: "4px 0 0" }}>
              {strongest.avg?.toFixed(1)}/{strongest.max} ({Math.round(strongest.pct)}%)
            </p>
          </div>
          <div
            className="card"
            style={{
              padding: 18,
              background: "var(--gold-soft)",
              borderColor: "oklch(0.82 0.09 65)",
            }}
          >
            <div className="eyebrow" style={{ color: "oklch(0.42 0.13 65)", marginBottom: 4 }}>
              Needs improvement
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "oklch(0.38 0.13 65)", margin: 0 }}>
              {weakest.label}
            </p>
            <p className="mono" style={{ fontSize: 12, color: "oklch(0.42 0.13 65)", margin: "4px 0 0" }}>
              {weakest.avg?.toFixed(1)}/{weakest.max} ({Math.round(weakest.pct)}%)
            </p>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div className="eyebrow">Teacher notes</div>
          {saving && (
            <span style={{ fontSize: 11, color: "var(--ink-4)" }}>Saving…</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add private notes about this student…"
          rows={3}
          className="input"
          style={{ resize: "none" }}
        />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="eyebrow">Session history</div>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{sessions.length} total</span>
        </div>

        {sessions.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
              No completed sessions yet.
            </p>
          </div>
        ) : (
          <div>
            {sessions.map((s) => {
              const theme = themeColors[s.image.theme];
              const hue = scoreHue(s.total);
              return (
                <Link
                  key={s.id}
                  href={`/teacher/students/${studentId}/sessions/${s.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--line-2)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image.url}
                    alt=""
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      objectFit: "cover",
                      border: "1px solid var(--line)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
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
                            style={{ width: 5, height: 5, borderRadius: "50%", background: theme.accent }}
                          />
                          {theme.label}
                        </span>
                      )}
                      <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                        {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ""}
                      </span>
                      {s.violationCount > 0 && (
                        <span className="badge badge-rose" style={{ fontSize: 10 }}>
                          {s.violationCount} violation{s.violationCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                        {s.total}/30
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                        A:{s.scoreA} B1:{s.scoreB1} B2:{s.scoreB2} C:{s.scoreC}
                      </span>
                    </div>
                  </div>
                  <svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth={2}
                    stroke="var(--ink-4)"
                    style={{ flexShrink: 0 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
