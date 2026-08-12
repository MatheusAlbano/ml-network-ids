import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FeatureImportanceItem } from "../types/statistics";

export function FeatureImportanceChart({ data }: { data: FeatureImportanceItem[] }) {
  const chartData = [...data].reverse(); // maior importância no topo

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
        <XAxis type="number" stroke="#6b7280" fontSize={12} />
        <YAxis dataKey="feature" type="category" stroke="#6b7280" fontSize={12} width={110} />
        <Tooltip
          contentStyle={{ background: "#111722", border: "1px solid #1f2937", borderRadius: 8 }}
          labelStyle={{ color: "#9ca3af" }}
        />
        <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}