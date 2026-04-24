"use client";

import { useState, useEffect } from "react";
import ProgressCharts from "@/components/progress/ProgressCharts";

type StatsData = {
  totalSessions: number;
  averageScore: number | null;
  bestScore: number | null;
  currentStreak: number;
  averageCriterionScores: {
    A: number | null;
    B1: number | null;
    B2: number | null;
    C: number | null;
  };
  allScores: {
    date: string;
    scoreA: number;
    scoreB1: number;
    scoreB2: number;
    scoreC: number;
    total: number;
    theme: string;
  }[];
  weeklyFrequency: { week: string; sessions: number }[];
  themePerformance: { theme: string; avg: number; count: number }[];
};

export default function ProgressPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/students/stats");
      if (res.ok) setStats(await res.json());
      setLoading(false);
    }
    load();
  }, []);

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

  if (!stats) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
          Failed to load progress data.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Your improvement</div>
        <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 38px)", margin: 0 }}>
          Progress.
        </h1>
        <p style={{ color: "var(--ink-3)", marginTop: 8, fontSize: 15 }}>
          Track your improvement over time across all IB IO criteria.
        </p>
      </div>

      {stats.totalSessions > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div className="stat" style={{ textAlign: "center" }}>
            <div className="stat-value">{stats.totalSessions}</div>
            <div className="stat-label">Sessions</div>
          </div>
          <div className="stat" style={{ textAlign: "center" }}>
            <div className="stat-value">
              {stats.averageScore !== null ? (
                <>
                  {stats.averageScore}
                  <span style={{ fontSize: 16, color: "var(--ink-4)", fontWeight: 500 }}>/30</span>
                </>
              ) : (
                "—"
              )}
            </div>
            <div className="stat-label">Average</div>
          </div>
          <div className="stat" style={{ textAlign: "center" }}>
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
            <div className="stat-label">Best</div>
          </div>
          <div className="stat" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ color: "var(--accent)" }}>
              {stats.currentStreak}
            </div>
            <div className="stat-label">Day streak</div>
          </div>
        </div>
      )}

      <ProgressCharts
        allScores={stats.allScores}
        averageCriterionScores={stats.averageCriterionScores}
        themePerformance={stats.themePerformance}
        weeklyFrequency={stats.weeklyFrequency}
        currentStreak={stats.currentStreak}
      />
    </div>
  );
}
