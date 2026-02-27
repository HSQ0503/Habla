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

type ThemeData = {
  theme: string;
  avg: number;
  count: number;
};

const THEME_COLORS: Record<string, string> = {
  Identities: "#3b82f6",
  Experiences: "#22c55e",
  "Human Ingenuity": "#a855f7",
  "Social Organization": "#f97316",
  "Sharing the Planet": "#14b8a6",
};

export default function ThemePerformanceChart({
  data,
  height = 200,
}: {
  data: ThemeData[];
  height?: number;
}) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <XAxis
          dataKey="theme"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 30]}
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
            `${Number(value).toFixed(1)}/30 (${(props as { payload: ThemeData }).payload.count} sessions)`,
            "Average",
          ]}
        />
        <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={THEME_COLORS[entry.theme] || "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
