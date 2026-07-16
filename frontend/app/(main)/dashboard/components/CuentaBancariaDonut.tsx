"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: any[];
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
];

export default function CuentaBancariaDonut({ data }: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        border: "1px solid #E5E7EB",
      }}
    >
      <h3>Distribución por Cuentas Bancarias</h3>

      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie
            data={data}
            dataKey="saldo"
            nameKey="nombre"
            innerRadius={60}
            outerRadius={110}
            label
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) =>
              `$${Number(value).toFixed(2)}`
            }
          />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}