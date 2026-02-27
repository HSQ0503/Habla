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
      if (res.ok) {
        setStats(await res.json());
      }
      setLoading(false);
    }
    load();
  }, []);

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

  if (!stats) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">Failed to load progress data.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Progress</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your improvement over time across all IB IO criteria.
        </p>
      </div>

      {/* Summary stats row */}
      {stats.totalSessions > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-semibold text-gray-900">{stats.totalSessions}</p>
            <p className="text-xs text-gray-500">Sessions</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-semibold text-gray-900">
              {stats.averageScore !== null ? stats.averageScore : "—"}
              {stats.averageScore !== null && <span className="text-sm text-gray-400">/30</span>}
            </p>
            <p className="text-xs text-gray-500">Average</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-semibold text-gray-900">
              {stats.bestScore !== null ? stats.bestScore : "—"}
              {stats.bestScore !== null && <span className="text-sm text-gray-400">/30</span>}
            </p>
            <p className="text-xs text-gray-500">Best</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-semibold text-indigo-600">{stats.currentStreak}</p>
            <p className="text-xs text-gray-500">Day Streak</p>
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
