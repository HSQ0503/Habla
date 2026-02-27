"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type WeekData = {
  week: string;
  sessions: number;
};

export default function FrequencyChart({
  data,
  height = 150,
}: {
  data: WeekData[];
  height?: number;
}) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
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
          formatter={(value) => [`${value}`, "Sessions"]}
        />
        <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
