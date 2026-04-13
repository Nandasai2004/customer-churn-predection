import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import type { TimeseriesPoint, TrendResponse } from "@/lib/api";

interface TimeSeriesChartProps {
  data: TimeseriesPoint[];
  trend: TrendResponse;
}

export default function TimeSeriesChart({ data, trend }: TimeSeriesChartProps) {
  const merged = data.map((pt, i) => ({
    month: pt.month_index,
    churn_rate: pt.churn_rate,
    trend: trend.slope * i + trend.intercept,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title mb-0">Churn Rate Time Series</h3>
        <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
          {trend.equation}
        </code>
      </div>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(215 20% 55%)", fontFamily: "'JetBrains Mono'" }}
              axisLine={{ stroke: "hsl(222 20% 18%)" }}
              tickLine={false}
              label={{ value: "Tenure Month", position: "insideBottomRight", offset: -5, fill: "hsl(215 20% 55%)", fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(215 20% 55%)", fontFamily: "'JetBrains Mono'" }}
              axisLine={{ stroke: "hsl(222 20% 18%)" }}
              tickLine={false}
              tickFormatter={(v: number) => (v * 100).toFixed(0) + "%"}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(222 40% 10%)",
                border: "1px solid hsl(222 20% 18%)",
                borderRadius: "8px",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
              }}
              labelStyle={{ color: "hsl(210 40% 92%)", fontFamily: "'JetBrains Mono'", fontSize: 12 }}
              itemStyle={{ fontFamily: "'JetBrains Mono'", fontSize: 11 }}
              formatter={(value: number) => [(value * 100).toFixed(2) + "%"]}
              labelFormatter={(label) => `Month ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, fontFamily: "'JetBrains Mono'" }}
            />
            <Line
              type="monotone"
              dataKey="churn_rate"
              stroke="hsl(188 86% 43%)"
              strokeWidth={2}
              dot={false}
              name="Actual Churn Rate"
              animationDuration={2000}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="trend"
              stroke="hsl(256 70% 60%)"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              name="Trend Line"
              animationDuration={2500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
