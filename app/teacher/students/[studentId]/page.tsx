"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
    void (async () => { await fetchData(); })();
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-500">Student not found or not in your class.</p>
      </div>
    );
  }

  const { student, stats, criterionAvgs, scores, sessions } = data;

  // Strengths & weaknesses from criterion avgs
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

  const statCards = [
    { label: "Total Sessions", value: stats.totalSessions },
    { label: "Average Score", value: stats.avgScore !== null ? `${stats.avgScore}/30` : "—" },
    { label: "Best Score", value: stats.bestScore !== null ? `${stats.bestScore}/30` : "—" },
    {
      label: "Last Active",
      value: stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : "—",
    },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        href="/teacher/class"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Class
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{student.name}</h1>
        <p className="text-sm text-gray-500">{student.email}</p>
        <p className="text-xs text-gray-400 mt-1">
          Member since {new Date(student.memberSince).toLocaleDateString()}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Score Trend */}
      <ScoreTrend scores={scores.map((s) => ({ date: s.date, total: s.total })).reverse()} />

      {/* Criterion Averages */}
      {criterionAvgs.A !== null && <CriterionBars avgs={criterionAvgs} />}

      {/* Strengths & Weaknesses */}
      {strongest && weakest && strongest.key !== weakest.key && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
              Strongest Area
            </h3>
            <p className="text-sm font-medium text-green-800">{strongest.label}</p>
            <p className="text-xs text-green-600 mt-0.5">
              {strongest.avg?.toFixed(1)}/{strongest.max} ({Math.round(strongest.pct)}%)
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              Needs Improvement
            </h3>
            <p className="text-sm font-medium text-amber-800">{weakest.label}</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {weakest.avg?.toFixed(1)}/{weakest.max} ({Math.round(weakest.pct)}%)
            </p>
          </div>
        </div>
      )}

      {/* Teacher Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Teacher Notes
          </h3>
          {saving && (
            <span className="text-xs text-gray-400">Saving...</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add private notes about this student..."
          rows={3}
          className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Session History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Session History ({sessions.length})
          </h3>
        </div>

        {sessions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No completed sessions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/teacher/students/${studentId}/sessions/${s.id}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image.url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${themeBadgeColor(s.image.theme)}`}>
                      {themeLabel(s.image.theme)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ""}
                    </span>
                    {s.violationCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-red-50 text-red-600 rounded-full">
                        {s.violationCount} violation{s.violationCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-gray-900">{s.total}/30</span>
                    <span className="text-xs text-gray-400">
                      A:{s.scoreA} B1:{s.scoreB1} B2:{s.scoreB2} C:{s.scoreC}
                    </span>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
