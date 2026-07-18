"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  Cell,
} from "recharts";

interface Props {
  data: any[];
}

const COLORS = [
  "#D10A11",
  "#C40A10",
  "#B3080E",
  "#99070C",
  "#7F060A",
];

export default function TopClientesDeudaChart({ data }: Props) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        padding: 24,
        border: "1px solid #E5E7EB",
        boxShadow: "0 8px 24px rgba(0,0,0,.05)",
      }}
    >
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#1F2937",
          marginBottom: 20,
          borderLeft: "5px solid #D10A11",
          paddingLeft: 12,
        }}
      >
        Top 5 Clientes con Mayor Deuda
      </h3>

      <ResponsiveContainer width="100%" height={330}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 35,
            left: 10,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient
              id="deudaGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#D10A11" />
              <stop offset="100%" stopColor="#F04A4A" />
            </linearGradient>
          </defs>

          <CartesianGrid
            horizontal={false}
            stroke="#ECECEC"
          />

          <XAxis
            type="number"
            tick={{ fill: "#706F6F", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            type="category"
            dataKey="cliente"
            width={160}
            tick={{
              fill: "#374151",
              fontSize: 12,
              fontWeight: 600,
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            formatter={(value) => `$${Number(value).toFixed(2)}`}
            cursor={{
              fill: "rgba(209,10,17,.05)",
            }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              boxShadow: "0 8px 24px rgba(0,0,0,.08)",
            }}
          />

          <Bar
            dataKey="pendiente"
            radius={[10, 10, 10, 10]}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}

            <LabelList
              dataKey="pendiente"
              position="right"
              formatter={(value) => Number(value).toFixed(2)}
              style={{
                fill: "#374151",
                fontWeight: 700,
                fontSize: 12,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}