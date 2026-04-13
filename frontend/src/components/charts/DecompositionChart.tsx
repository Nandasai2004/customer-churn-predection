import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface DecompositionChartProps {
  observed: number[];
  trend: number[];
  seasonal: number[];
  residual: number[];
}

const panelColors = {
  observed: "hsl(188 86% 43%)",
  trend: "hsl(256 70% 60%)",
  seasonal: "hsl(160 84% 40%)",
  residual: "hsl(30 90% 60%)",
};

function Panel({
  data,
  label,
  color,
  index,
}: {
  data: { month: number; value: number }[];
  label: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
    >
      <div className="data-label mb-1 pl-1">{label}</div>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 15, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
            <XAxis dataKey="month" hide />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(215 20% 55%)", fontFamily: "'JetBrains Mono'" }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(222 40% 10%)",
                border: "1px solid hsl(222 20% 18%)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value.toFixed(4), label]}
              labelFormatter={(l) => `Month ${l}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              animationDuration={1500 + index * 300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default function DecompositionChart({
  observed,
  trend,
  seasonal,
  residual,
}: DecompositionChartProps) {
  const toData = (arr: number[]) => arr.map((v, i) => ({ month: i, value: v }));

  const panels = [
    { data: toData(observed), label: "Observed", color: panelColors.observed },
    { data: toData(trend), label: "Trend", color: panelColors.trend },
    { data: toData(seasonal), label: "Seasonal", color: panelColors.seasonal },
    { data: toData(residual), label: "Residual", color: panelColors.residual },
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="section-title">STL Decomposition</h3>
      <div className="space-y-3">
        {panels.map((p, i) => (
          <Panel key={p.label} data={p.data} label={p.label} color={p.color} index={i} />
        ))}
      </div>
    </div>
  );
}
