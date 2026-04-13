import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import type { PredictionError } from "@/lib/api";

interface ResidualChartProps {
  data: PredictionError[];
}

export default function ResidualChart({ data }: ResidualChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="glass-card p-5"
    >
      <h3 className="section-title">Prediction Residuals</h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" vertical={false} />
            <XAxis
              dataKey="month_index"
              tick={{ fontSize: 11, fill: "hsl(215 20% 55%)", fontFamily: "'JetBrains Mono'" }}
              axisLine={{ stroke: "hsl(222 20% 18%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(215 20% 55%)", fontFamily: "'JetBrains Mono'" }}
              axisLine={{ stroke: "hsl(222 20% 18%)" }}
              tickLine={false}
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(222 40% 10%)",
                border: "1px solid hsl(222 20% 18%)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value.toFixed(4), "Residual"]}
              labelFormatter={(l) => `Month ${l}`}
            />
            <ReferenceLine y={0} stroke="hsl(215 20% 55%)" strokeDasharray="3 3" />
            <Bar dataKey="residual" animationDuration={1500} radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.residual >= 0 ? "hsl(188 86% 43%)" : "hsl(0 84% 60%)"}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
