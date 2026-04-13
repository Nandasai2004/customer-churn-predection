import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import type { TimeseriesPoint, ForecastPoint } from "@/lib/api";

interface ForecastChartProps {
  history: TimeseriesPoint[];
  forecast: ForecastPoint[];
}

export default function ForecastChart({ history, forecast }: ForecastChartProps) {
  // Build a unified dataset where each row has all possible fields
  const data: Record<string, number | undefined>[] = [];

  // Historical data
  for (const pt of history) {
    data.push({
      month: pt.month_index,
      actual: pt.churn_rate,
    });
  }

  // Bridge: last history point starts the forecast line
  const lastHist = history[history.length - 1];
  // Replace the last history row to also include forecast start
  data[data.length - 1] = {
    month: lastHist.month_index,
    actual: lastHist.churn_rate,
    forecast: lastHist.churn_rate,
    lower: lastHist.churn_rate,
    upper: lastHist.churn_rate,
  };

  // Forecast data
  for (const pt of forecast) {
    data.push({
      month: pt.month_index,
      forecast: pt.forecast,
      lower: Math.max(0, pt.lower),
      upper: pt.upper,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="glass-card p-5"
    >
      <h3 className="section-title">12-Month Churn Forecast</h3>
      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="ciBandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#6b7a8d", fontFamily: "'JetBrains Mono'" }}
              axisLine={{ stroke: "hsl(222 20% 18%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7a8d", fontFamily: "'JetBrains Mono'" }}
              axisLine={{ stroke: "hsl(222 20% 18%)" }}
              tickLine={false}
              tickFormatter={(v: number) => (v * 100).toFixed(0) + "%"}
              domain={[0, "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "#131c2e",
                border: "1px solid #1e2a3a",
                borderRadius: "8px",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
              }}
              formatter={(value: number | undefined, name: string) => {
                if (value == null) return ["-", name];
                return [(value * 100).toFixed(2) + "%", name];
              }}
              labelFormatter={(label) => `Month ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'JetBrains Mono'" }} />

            {/* Confidence band — upper fill */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#ciBandFill)"
              name="Upper CI"
              connectNulls={false}
              animationDuration={2000}
              isAnimationActive={true}
            />
            {/* Confidence band — lower fill to "erase" the bottom part */}
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#0a0e1a"
              name="Lower CI"
              connectNulls={false}
              animationDuration={2000}
              isAnimationActive={true}
              legendType="none"
            />

            {/* Historical churn line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#8896a7"
              strokeWidth={2}
              dot={false}
              name="Historical"
              connectNulls={false}
              animationDuration={2000}
              isAnimationActive={true}
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#06b6d4", stroke: "#06b6d4" }}
              activeDot={{ r: 5, fill: "#06b6d4" }}
              name="Forecast"
              connectNulls={false}
              animationDuration={2500}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
