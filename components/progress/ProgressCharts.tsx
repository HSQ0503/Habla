"use client";

import dynamic from "next/dynamic";

const ScoreTrendChart = dynamic(() => import("@/components/charts/ScoreTrendChart"), {
  ssr: false,
  loading: () => <div className="h-[250px] bg-gray-50 rounded-lg animate-pulse" />,
});

const CriterionTrendChart = dynamic(() => import("@/components/charts/CriterionTrendChart"), {
  ssr: false,
  loading: () => <div className="h-[250px] bg-gray-50 rounded-lg animate-pulse" />,
});

const ThemePerformanceChart = dynamic(() => import("@/components/charts/ThemePerformanceChart"), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-gray-50 rounded-lg animate-pulse" />,
});

const FrequencyChart = dynamic(() => import("@/components/charts/FrequencyChart"), {
  ssr: false,
  loading: () => <div className="h-[150px] bg-gray-50 rounded-lg animate-pulse" />,
});

type ScoreEntry = {
  date: string;
  scoreA: number;
  scoreB1: number;
  scoreB2: number;
  scoreC: number;
  total: number;
  theme: string;
};

type CriterionAvgs = {
  A: number | null;
  B1: number | null;
  B2: number | null;
  C: number | null;
};

type ThemeData = {
  theme: string;
  avg: number;
  count: number;
};

type WeekData = {
  week: string;
  sessions: number;
};

type Props = {
  allScores: ScoreEntry[];
  averageCriterionScores: CriterionAvgs;
  themePerformance: ThemeData[];
  weeklyFrequency: WeekData[];
  currentStreak: number;
};

function getTrend(firstThree: number[], lastThree: number[]) {
  if (firstThree.length === 0 || lastThree.length === 0) return null;
  const firstAvg = firstThree.reduce((a, b) => a + b, 0) / firstThree.length;
  const lastAvg = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;
  const diff = lastAvg - firstAvg;
  if (diff > 0.5) return { label: "Improving", color: "text-green-600", arrow: "\u2191" };
  if (diff < -0.5) return { label: "Declining", color: "text-red-500", arrow: "\u2193" };
  return { label: "Stable", color: "text-gray-500", arrow: "\u2192" };
}

function generateTips(avgs: CriterionAvgs, vocabLevel?: string): string[] {
  const tips: { priority: number; text: string }[] = [];

  if (avgs.A !== null && avgs.A < 7) {
    tips.push({
      priority: 12 - avgs.A,
      text: "Focus on using more varied vocabulary and complex grammar structures. Try incorporating different tenses.",
    });
  }
  if (avgs.B1 !== null && avgs.B1 < 4) {
    tips.push({
      priority: 6 - avgs.B1,
      text: "In your presentations, make sure to describe the image in detail AND connect it to the culture it represents.",
    });
  }
  if (avgs.B2 !== null && avgs.B2 < 4) {
    tips.push({
      priority: 6 - avgs.B2,
      text: "Develop your conversation responses more. Use examples, give reasons with 'because', and share personal opinions.",
    });
  }
  if (avgs.C !== null && avgs.C < 4) {
    tips.push({
      priority: 6 - avgs.C,
      text: "Practice sustaining longer responses. Try to elaborate on your answers without waiting for the next question.",
    });
  }
  if (vocabLevel && ["A1", "A2"].includes(vocabLevel)) {
    tips.push({
      priority: 5,
      text: "Expand your vocabulary. Before each session, review topic-specific words related to the theme.",
    });
  }

  return tips
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((t) => t.text);
}

export default function ProgressCharts({
  allScores,
  averageCriterionScores,
  themePerformance,
  weeklyFrequency,
  currentStreak,
}: Props) {
  if (allScores.length < 3) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Not enough data yet</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Complete at least 3 scored sessions to see your progress analytics.
          You have {allScores.length} so far.
        </p>
      </div>
    );
  }

  const scoreTrendData = allScores.map((s) => ({ date: s.date, total: s.total }));

  const criterionTrendData = allScores.map((s) => ({
    date: s.date,
    A: s.scoreA,
    B1: s.scoreB1,
    B2: s.scoreB2,
    C: s.scoreC,
  }));

  // Strengths & weaknesses
  const criteria = [
    { key: "A" as const, label: "Language", max: 12 },
    { key: "B1" as const, label: "Visual Stimulus", max: 6 },
    { key: "B2" as const, label: "Conversation", max: 6 },
    { key: "C" as const, label: "Interactive Skills", max: 6 },
  ];

  const withAvgs = criteria
    .filter((c) => averageCriterionScores[c.key] !== null)
    .map((c) => ({
      ...c,
      avg: averageCriterionScores[c.key]!,
      pct: averageCriterionScores[c.key]! / c.max,
    }));

  const strongest = withAvgs.length > 0 ? withAvgs.reduce((a, b) => (a.pct > b.pct ? a : b)) : null;
  const weakest = withAvgs.length > 0 ? withAvgs.reduce((a, b) => (a.pct < b.pct ? a : b)) : null;

  // Trends per criterion (first 3 vs last 3)
  const scoreKeys = ["scoreA", "scoreB1", "scoreB2", "scoreC"] as const;
  const criterionTrends = criteria.map((c, i) => {
    const key = scoreKeys[i];
    const vals = allScores.map((s) => s[key]);
    const first3 = vals.slice(0, 3);
    const last3 = vals.slice(-3);
    return { ...c, trend: getTrend(first3, last3) };
  });

  const tips = generateTips(averageCriterionScores);

  return (
    <div className="space-y-6">
      {/* Score Trend - main chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Score Trend</h3>
        <p className="text-xs text-gray-500 mb-3">Total score out of 30 over all sessions</p>
        <ScoreTrendChart data={scoreTrendData} height={250} benchmark={20} />
      </div>

      {/* Criterion Trends */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Per-Criterion Trends</h3>
        <p className="text-xs text-gray-500 mb-3">Individual criterion scores over time</p>
        <CriterionTrendChart data={criterionTrendData} height={250} />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {strongest && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Strongest Area</p>
            <p className="text-lg font-semibold text-green-800">{strongest.label}</p>
            <p className="text-sm text-green-700">Average: {strongest.avg}/{strongest.max}</p>
          </div>
        )}
        {weakest && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">Focus Area</p>
            <p className="text-lg font-semibold text-amber-800">{weakest.label}</p>
            <p className="text-sm text-amber-700">Average: {weakest.avg}/{weakest.max}</p>
          </div>
        )}
      </div>

      {/* Per-criterion trend indicators */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Criterion Movement</h3>
        <p className="text-xs text-gray-500 mb-4">Comparing your first 3 sessions vs your last 3</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {criterionTrends.map((c) => (
            <div key={c.key} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              {c.trend ? (
                <p className={`text-sm font-semibold ${c.trend.color}`}>
                  {c.trend.arrow} {c.trend.label}
                </p>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Theme Performance */}
      {themePerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Theme Performance</h3>
          <p className="text-xs text-gray-500 mb-3">Average score per theme</p>
          <ThemePerformanceChart data={themePerformance} height={200} />
        </div>
      )}

      {/* Practice Frequency */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Practice Frequency</h3>
            <p className="text-xs text-gray-500">Sessions per week (last 8 weeks)</p>
          </div>
          {currentStreak > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">{currentStreak}</p>
              <p className="text-xs text-gray-500">day streak</p>
            </div>
          )}
        </div>
        <FrequencyChart data={weeklyFrequency} height={150} />
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-indigo-900 mb-3">Personalized Tips</h3>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
