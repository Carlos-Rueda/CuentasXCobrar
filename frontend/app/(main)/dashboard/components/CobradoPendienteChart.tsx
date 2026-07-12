"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  data: any[];
}

export default function CobradoPendienteChart({ data }: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        border: "1px solid #E5E7EB",
      }}
    >
      <h3>Cobrado vs Pendiente</h3>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
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
          <Legend />

          <Bar dataKey="cobrado" fill="#16a34a" />

          <Bar dataKey="pendiente" fill="#dc2626" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
