"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface Props {
  data: any[];
}

export default function CashFlowChart({ data }: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        border: "1px solid #E5E7EB",
      }}
    >
      <h3>Flujo de efectivo por mes</h3>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis
            dataKey="mes"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis />
          <Tooltip />

          <Line
            type="monotone"
            dataKey="cobrado"
            stroke="#16a34a"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
