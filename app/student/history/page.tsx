"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";

type SessionItem = {
  id: string;
  status: string;
  scoreA: number | null;
  scoreB1: number | null;
  scoreB2: number | null;
  scoreC: number | null;
  prepStartedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  image: { url: string; theme: string };
};

const THEMES = [
  { value: "", label: "All themes" },
  { value: "IDENTITIES", label: "Identities" },
  { value: "EXPERIENCES", label: "Experiences" },
  { value: "HUMAN_INGENUITY", label: "Human Ingenuity" },
  { value: "SOCIAL_ORGANIZATION", label: "Social Organization" },
  { value: "SHARING_THE_PLANET", label: "Sharing the Planet" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest score" },
  { value: "lowest", label: "Lowest score" },
];

function totalScore(s: SessionItem) {
  if (s.scoreA === null) return null;
  return (s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0);
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
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [themeFilter, setThemeFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/sessions?limit=200");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useCallback(() => {
    let result = [...sessions];
    if (themeFilter) result = result.filter((s) => s.image.theme === themeFilter);
    switch (sort) {
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "highest":
        result.sort((a, b) => (totalScore(b) ?? -1) - (totalScore(a) ?? -1));
        break;
      case "lowest":
        result.sort((a, b) => (totalScore(a) ?? 999) - (totalScore(b) ?? 999));
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [sessions, themeFilter, sort]);

  const displayedSessions = filtered();
  const visible = displayedSessions.slice(0, visibleCount);
  const hasMore = visibleCount < displayedSessions.length;

  if (loading) {
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
        Loading…
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Your sessions</div>
        <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 38px)", margin: 0 }}>
          Session history
        </h1>
        <p style={{ color: "var(--ink-3)", marginTop: 8, fontSize: 14 }}>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 16 }}>
            No practice sessions yet.
          </p>
          <Link href="/student/practice" className="btn-primary">
            Start your first practice →
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <select
              value={themeFilter}
              onChange={(e) => {
                setThemeFilter(e.target.value);
                setVisibleCount(10);
              }}
              className="input"
              style={{ width: "auto", minWidth: 180, fontSize: 13, padding: "8px 12px" }}
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input"
              style={{ width: "auto", minWidth: 160, fontSize: 13, padding: "8px 12px" }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {themeFilter && (
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {displayedSessions.length} result{displayedSessions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {displayedSessions.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
                No sessions match this filter.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visible.map((s) => {
                const theme = themeColors[s.image.theme];
                const total = totalScore(s);
                const roundedTotal = total !== null ? Math.round(total * 10) / 10 : null;
                const duration = formatDuration(s.prepStartedAt, s.completedAt);
                const isTerminated = s.status === "TERMINATED";
                const hue = roundedTotal !== null ? scoreHue(roundedTotal) : null;

                return (
                  <Link
                    key={s.id}
                    href={`/student/history/${s.id}`}
                    className="card-soft"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 18px",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image.url}
                      alt=""
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 10,
                        objectFit: "cover",
                        background: "var(--paper-2)",
                        border: "1px solid var(--line)",
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
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
                        {isTerminated && (
                          <span className="badge badge-rose">Terminated</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-3)" }}>
                        <span>
                          {new Date(s.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {duration && (
                          <>
                            <span style={{ color: "var(--ink-4)" }}>·</span>
                            <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{duration}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      {roundedTotal !== null && hue ? (
                        <>
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "4px 10px",
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: 600,
                              background: hue.bg,
                              color: hue.color,
                              border: `1px solid ${hue.border}`,
                            }}
                          >
                            {roundedTotal}/30
                          </span>
                          <div
                            className="mono"
                            style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4, fontSize: 10, color: "var(--ink-4)" }}
                          >
                            <span>A:{s.scoreA}</span>
                            <span>B1:{s.scoreB1}</span>
                            <span>B2:{s.scoreB2}</span>
                            <span>C:{s.scoreC}</span>
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--ink-4)" }}>—</span>
                      )}
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

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                onClick={() => setVisibleCount((c) => c + 10)}
                className="btn-ghost"
              >
                Load more ({displayedSessions.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
