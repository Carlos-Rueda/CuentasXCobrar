"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
        Flujo de Efectivo por Mes
      </h3>

      <ResponsiveContainer width="100%" height={340}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 15,
            left: 5,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient
              id="cashGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#16A34A"
                stopOpacity={0.45}
              />

              <stop
                offset="95%"
                stopColor="#16A34A"
                stopOpacity={0}
              />
            </linearGradient>

            <filter id="lineShadow">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="#16A34A"
                floodOpacity="0.20"
              />
            </filter>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="#ECECEC"
            strokeDasharray="4 4"
          />

          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#706F6F",
              fontSize: 12,
              fontWeight: 600,
            }}
            tickFormatter={(value: string) =>
              value.substring(0, 3)
            }
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#706F6F",
              fontSize: 12,
            }}
            tickFormatter={(value) =>
              `$${Number(value).toFixed(0)}`
            }
          />

          <Tooltip
            formatter={(value) =>
              `$${Number(value).toFixed(2)}`
            }
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              boxShadow: "0 8px 24px rgba(0,0,0,.08)",
            }}
          />

          <Area
            type="monotone"
            dataKey="cobrado"
            name="Cobrado"

            stroke="#16A34A"

            strokeWidth={4}

            fill="url(#cashGradient)"

            fillOpacity={1}

            filter="url(#lineShadow)"

            activeDot={{
              r: 7,
              fill: "#16A34A",
              stroke: "#FFFFFF",
              strokeWidth: 3,
            }}

            dot={{
              r: 4,
              fill: "#16A34A",
              stroke: "#FFFFFF",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}