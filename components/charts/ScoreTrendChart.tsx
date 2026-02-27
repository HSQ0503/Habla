"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type DataPoint = {
  date: string;
  total: number;
};

export default function ScoreTrendChart({
  data,
  height = 200,
  benchmark,
}: {
  data: DataPoint[];
  height?: number;
  benchmark?: number;
}) {
  if (data.length < 2) return null;

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 30]}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        {benchmark && (
          <ReferenceLine
            y={benchmark}
            stroke="#d1d5db"
            strokeDasharray="4 4"
          />
        )}
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
          formatter={(value) => [`${value}/30`, "Score"]}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#6366f1" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
