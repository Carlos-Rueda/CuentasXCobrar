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
  LabelList,
} from "recharts";

interface Props {
  data: any[];
}

export default function CobradoPendienteChart({ data }: Props) {
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
        Cobrado vs Pendiente
      </h3>

      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 40,
          }}
        >
          <CartesianGrid
            stroke="#ECECEC"
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="mes"
            interval={0}
            angle={-35}
            textAnchor="end"
            height={60}
            tick={{
              fill: "#706F6F",
              fontSize: 12,
              fontWeight: 600,
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fill: "#706F6F",
              fontSize: 12,
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
          />

          <Tooltip
            formatter={(value) => `$${Number(value).toFixed(2)}`}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              boxShadow: "0 8px 24px rgba(0,0,0,.08)",
            }}
          />

          <Legend
            verticalAlign="top"
            align="center"
            iconType="circle"
            wrapperStyle={{
              paddingBottom: 15,
              fontWeight: 600,
              fontSize: 13,
            }}
          />
          <Bar
            dataKey="cobrado"
            name="Cobrado"
            fill="#16A34A"
            radius={[8, 8, 0, 0]}
          >
            <LabelList
              dataKey="cobrado"
              position="top"
              formatter={(value) => Number(value).toFixed(2)}
              style={{
                fill: "#166534",
                fontSize: 11,
                fontWeight: 700,
              }}
            />
          </Bar>
          <Bar
            dataKey="pendiente"
            name="Pendiente"
            fill="#D10A11"
            radius={[8, 8, 0, 0]}
          >
            <LabelList
              dataKey="pendiente"
              position="top"
              formatter={(value) => Number(value).toFixed(2)}
              style={{
                fill: "#991B1B",
                fontSize: 11,
                fontWeight: 700,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
