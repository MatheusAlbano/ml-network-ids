import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ROCCurveData } from "../types/statistics";

export function ROCCurveChart({ data }: { data: ROCCurveData }) {
  const chartData = data.fpr.map((fpr, i) => ({
    fpr: Number(fpr.toFixed(3)),
    tpr: Number(data.tpr[i].toFixed(3)),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="fpr"
          type="number"
          domain={[0, 1]}
          stroke="#6b7280"
          fontSize={12}
          label={{ value: "Taxa de Falso Positivo", position: "insideBottom", offset: -5, fill: "#6b7280", fontSize: 11 }}
        />
        <YAxis
          domain={[0, 1]}
          stroke="#6b7280"
          fontSize={12}
          label={{ value: "Taxa de Verdadeiro Positivo", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ background: "#111722", border: "1px solid #1f2937", borderRadius: 8 }}
          labelStyle={{ color: "#9ca3af" }}
        />
        <Line type="monotone" dataKey="tpr" stroke="#3b82f6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}