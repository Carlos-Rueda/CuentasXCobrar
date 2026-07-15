"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface Props {
  data: any[];
}

export default function TopClientesPagosChart({ data }: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        border: "1px solid #E5E7EB",
      }}
    >
      <h3>Top 5 Clientes con Más Han Pagado</h3>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="4 4" />

          <XAxis type="number" />

          <YAxis type="category" dataKey="cliente" width={140} />

          <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />

          <Bar dataKey="total" fill="#16a34a" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
