"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DataPoint = {
  date: string;
  A: number | null;
  B1: number | null;
  B2: number | null;
  C: number | null;
};

const CRITERION_COLORS = {
  A: "#6366f1",
  B1: "#3b82f6",
  B2: "#8b5cf6",
  C: "#14b8a6",
};

export default function CriterionTrendChart({
  data,
  height = 250,
}: {
  data: DataPoint[];
  height?: number;
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
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          iconType="circle"
          iconSize={8}
        />
        <Line
          type="monotone"
          dataKey="A"
          name="Language (/12)"
          stroke={CRITERION_COLORS.A}
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="B1"
          name="Visual (/6)"
          stroke={CRITERION_COLORS.B1}
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="B2"
          name="Conversation (/6)"
          stroke={CRITERION_COLORS.B2}
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="C"
          name="Interactive (/6)"
          stroke={CRITERION_COLORS.C}
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
