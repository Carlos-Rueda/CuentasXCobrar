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
  "#16A34A",
  "#15803D",
  "#22C55E",
  "#4ADE80",
  "#86EFAC",
];

export default function TopClientesPagosChart({ data }: Props) {
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
          borderLeft: "5px solid #16A34A",
          paddingLeft: 12,
        }}
      >
        Top 5 Clientes con Más Han Pagado
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
              id="pagosGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#4ADE80" />
            </linearGradient>
          </defs>

          <CartesianGrid
            horizontal={false}
            stroke="#ECECEC"
          />

          <XAxis
            type="number"
            tick={{
              fill: "#706F6F",
              fontSize: 12,
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            type="category"
            dataKey="cliente"
            width={170}
            tickFormatter={(value: string) =>
              value.length > 18
                ? value.substring(0, 18) + "..."
                : value
            }
            tick={{
              fill: "#374151",
              fontWeight: 600,
              fontSize: 12,
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            formatter={(value) =>
              `$${Number(value).toFixed(2)}`
            }
            cursor={{
              fill: "rgba(22,163,74,.05)",
            }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              boxShadow: "0 8px 24px rgba(0,0,0,.08)",
            }}
          />

          <Bar
            dataKey="total"
            fill="url(#pagosGradient)"
            radius={[10, 10, 10, 10]}
          >

            <LabelList
              dataKey="total"
              position="right"
              formatter={(value) =>
                Number(value).toFixed(2)
              }
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