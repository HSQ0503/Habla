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
  image: {
    url: string;
    theme: string;
  };
};

const THEMES = [
  { value: "", label: "All Themes" },
  { value: "IDENTITIES", label: "Identities" },
  { value: "EXPERIENCES", label: "Experiences" },
  { value: "HUMAN_INGENUITY", label: "Human Ingenuity" },
  { value: "SOCIAL_ORGANIZATION", label: "Social Organization" },
  { value: "SHARING_THE_PLANET", label: "Sharing the Planet" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Score" },
  { value: "lowest", label: "Lowest Score" },
];

function totalScore(s: SessionItem) {
  if (s.scoreA === null) return null;
  return (s.scoreA ?? 0) + (s.scoreB1 ?? 0) + (s.scoreB2 ?? 0) + (s.scoreC ?? 0);
}

function scoreColor(total: number) {
  if (total >= 20) return "text-green-600";
  if (total >= 12) return "text-yellow-600";
  return "text-red-500";
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

    if (themeFilter) {
      result = result.filter((s) => s.image.theme === themeFilter);
    }

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

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
        <>
          {/* Filter/Sort bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={themeFilter}
              onChange={(e) => { setThemeFilter(e.target.value); setVisibleCount(10); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {themeFilter && (
              <span className="text-xs text-gray-500">
                {displayedSessions.length} result{displayedSessions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {displayedSessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">No sessions match this filter.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((s) => {
                const theme = themeColors[s.image.theme] || {
                  bg: "bg-gray-100",
                  text: "text-gray-700",
                  label: s.image.theme,
                };
                const total = totalScore(s);
                const roundedTotal = total !== null ? Math.round(total * 10) / 10 : null;
                const duration = formatDuration(s.prepStartedAt, s.completedAt);
                const isTerminated = s.status === "TERMINATED";

                return (
                  <Link
                    key={s.id}
                    href={`/student/history/${s.id}`}
                    className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                  >
                    {/* Image thumbnail */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image.url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                    />

                    {/* Middle: theme, date, duration */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${theme.bg} ${theme.text}`}>
                          {theme.label}
                        </span>
                        {isTerminated && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                            Terminated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>
                          {new Date(s.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {duration && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>{duration}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: scores */}
                    <div className="shrink-0 text-right">
                      {roundedTotal !== null ? (
                        <>
                          <p className={`text-lg font-semibold ${scoreColor(roundedTotal)}`}>
                            {roundedTotal}<span className="text-sm font-normal text-gray-400">/30</span>
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-400">A:{s.scoreA}</span>
                            <span className="text-xs text-gray-400">B1:{s.scoreB1}</span>
                            <span className="text-xs text-gray-400">B2:{s.scoreB2}</span>
                            <span className="text-xs text-gray-400">C:{s.scoreC}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-4">
              <button
                onClick={() => setVisibleCount((c) => c + 10)}
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Load More ({displayedSessions.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
