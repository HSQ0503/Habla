"use client";

import dynamic from "next/dynamic";

const ScoreTrendChart = dynamic(() => import("@/components/charts/ScoreTrendChart"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 200,
        background: "var(--paper-2)",
        borderRadius: 12,
        animation: "pulse-dot 2s ease-in-out infinite",
      }}
    />
  ),
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
  if (pct >= 0.6) return "oklch(0.55 0.14 155)";
  if (pct >= 0.4) return "oklch(0.62 0.13 65)";
  return "oklch(0.6 0.16 25)";
}

export function CriterionBars({ avgs }: { avgs: CriterionAvgs }) {
  const criteria = [
    { label: "Language", key: "A" as const, max: 12 },
    { label: "Visual Stimulus", key: "B1" as const, max: 6 },
    { label: "Conversation", key: "B2" as const, max: 6 },
    { label: "Interactive Skills", key: "C" as const, max: 6 },
  ];

  return (
    <div className="card" style={{ padding: 22, marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 16 }}>Criterion averages</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 18,
        }}
      >
        {criteria.map((c) => {
          const avg = avgs[c.key];
          if (avg === null) return null;
          const pct = c.max > 0 ? (avg / c.max) * 100 : 0;
          const color = barColor(avg, c.max);
          return (
            <div key={c.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>{c.label}</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600 }}>
                  {avg}/{c.max}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "var(--paper-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: color,
                    borderRadius: 99,
                    width: `${Math.min(pct, 100)}%`,
                    transition: "width 500ms ease",
                  }}
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
    <div className="card" style={{ padding: 22, marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div className="eyebrow">Score trend</div>
        <span
          className="mono"
          style={{ fontSize: 14, fontWeight: 600, color: "var(--indigo)" }}
        >
          {recent[recent.length - 1].total}/30
        </span>
      </div>
      <ScoreTrendChart data={recent} height={180} />
    </div>
  );
}
