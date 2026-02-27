"use client";

import dynamic from "next/dynamic";

const ScoreTrendChart = dynamic(() => import("@/components/charts/ScoreTrendChart"), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-gray-50 rounded-lg animate-pulse" />,
});

type ScoreData = {
  date: string;
  total: number;
};

type CriterionAvgs = {
  A: number | null;
  B1: number | null;
  B2: number | null;
  C: number | null;
};

function barColor(avg: number, max: number) {
  const pct = max > 0 ? avg / max : 0;
  if (pct >= 0.6) return "bg-green-500";
  if (pct >= 0.4) return "bg-yellow-500";
  return "bg-red-400";
}

function barBgColor(avg: number, max: number) {
  const pct = max > 0 ? avg / max : 0;
  if (pct >= 0.6) return "bg-green-100";
  if (pct >= 0.4) return "bg-yellow-100";
  return "bg-red-100";
}

export function CriterionBars({ avgs }: { avgs: CriterionAvgs }) {
  const criteria = [
    { label: "Language", key: "A" as const, max: 12 },
    { label: "Visual Stimulus", key: "B1" as const, max: 6 },
    { label: "Conversation", key: "B2" as const, max: 6 },
    { label: "Interactive Skills", key: "C" as const, max: 6 },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
        Criterion Averages
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {criteria.map((c) => {
          const avg = avgs[c.key];
          if (avg === null) return null;
          const pct = c.max > 0 ? (avg / c.max) * 100 : 0;
          return (
            <div key={c.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-600">{c.label}</span>
                <span className="text-xs font-semibold text-gray-900">
                  {avg}/{c.max}
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${barBgColor(avg, c.max)}`}>
                <div
                  className={`h-full rounded-full transition-all ${barColor(avg, c.max)}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScoreTrend({ scores }: { scores: ScoreData[] }) {
  const recent = scores.slice(-10);
  if (recent.length < 2) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Score Trend
      </h3>
      <ScoreTrendChart data={recent} height={180} />
    </div>
  );
}
