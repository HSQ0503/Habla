"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type CriterionData = {
  name: string;
  avg: number;
  max: number;
};

function getColor(avg: number, max: number) {
  const pct = max > 0 ? avg / max : 0;
  if (pct >= 0.6) return "#22c55e";
  if (pct >= 0.4) return "#eab308";
  return "#ef4444";
}

export default function CriterionBarsChart({
  data,
  height = 200,
}: {
  data: CriterionData[];
  height?: number;
}) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
          formatter={(value, _name, props) => [
            `${Number(value).toFixed(1)}/${(props as { payload: CriterionData }).payload.max}`,
            "Average",
          ]}
        />
        <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.avg, entry.max)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
