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
  "#D10A11", // Rojo UTN
  "#706F6F", // Gris institucional
  "#F28C91", // Rojo claro
  "#A8A8A8", // Gris claro
  "#B3080E", // Rojo oscuro
  "#D9D9D9",
];

export default function CuentaBancariaDonut({ data }: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 24,
        border: "1px solid #E5E7EB",
        boxShadow: "0 8px 24px rgba(0,0,0,.05)",
      }}
    >
      <h3
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "#1F2937",
          marginBottom: 20,
          borderLeft: "5px solid #D10A11",
          paddingLeft: 12,
        }}
      >
        Distribución por Cuentas Bancarias
      </h3>

      <ResponsiveContainer width="100%" height={340}>
        <PieChart
          margin={{
            top: 10,
            right: 40,
            left: 10,
            bottom: 10,
          }}
        >
          <defs>
            <filter id="shadow">
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="7"
                floodColor="#000"
                floodOpacity="0.18"
              />
            </filter>
          </defs>

          <Pie
            data={data}
            dataKey="saldo"
            nameKey="nombre"
            innerRadius="38%"
            outerRadius="68%"
            stroke="#FFFFFF"
            strokeWidth={3}
            filter="url(#shadow)"
            label={({ x, y, value }) => (
              <text
                x={x}
                y={y}
                fill="#374151"
                fontWeight={700}
                fontSize={12}
              >
                {Number(value).toFixed(2)}
              </text>
            )}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) => `$${Number(value).toFixed(2)}`}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              boxShadow: "0 8px 24px rgba(0,0,0,.08)",
            }}
          />

          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconType="circle"
            wrapperStyle={{
              fontSize: 10,
              fontWeight: 600,
              lineHeight: "22px",
              paddingLeft: 20,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}