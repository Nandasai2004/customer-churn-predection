import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AlertCircle, ZoomIn, X } from "lucide-react";
import DecompositionChart from "@/components/charts/DecompositionChart";
import {
  getMetrics,
  getEquations,
  getDecomposition,
  type MetricsResponse,
  type EquationsResponse,
  type DecompositionResponse,
  PLOTS_BASE,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const PLOT_IMAGES = [
  { file: "raw_churn_ts.png", title: "Raw Churn Time Series", desc: "Monthly churn rate by tenure" },
  { file: "decomposition.png", title: "STL Decomposition", desc: "Trend, seasonal, and residual components" },
  { file: "adf_differenced.png", title: "ADF Differencing", desc: "Original vs differenced series" },
  { file: "acf_pacf.png", title: "ACF & PACF", desc: "Autocorrelation and partial autocorrelation" },
  { file: "actual_vs_predicted.png", title: "Actual vs Predicted", desc: "SARIMA model fit comparison" },
  { file: "forecast_12m.png", title: "12-Month Forecast", desc: "Future churn rate projection" },
  { file: "residuals.png", title: "Residual Diagnostics", desc: "Model residual analysis" },
  { file: "model_comparison.png", title: "Model Comparison", desc: "ARIMA vs SARIMA metrics" },
];

export default function Diagnostics() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [equations, setEquations] = useState<EquationsResponse | null>(null);
  const [decomp, setDecomp] = useState<DecompositionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalImg, setModalImg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMetrics(), getEquations(), getDecomposition()])
      .then(([m, eq, d]) => {
        setMetrics(m);
        setEquations(eq);
        setDecomp(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <div className="text-destructive text-lg font-semibold mb-2">Error Loading Diagnostics</div>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-[200px] shimmer-bg rounded-lg" />
        ))}
      </div>
    );
  }

  const metricKeys = ["MAE", "RMSE", "MAPE", "AIC", "BIC"] as const;
  const comparisonData = metricKeys.filter(k => k === "MAE" || k === "RMSE" || k === "MAPE").map((k) => ({
    metric: k,
    ARIMA: metrics!.ARIMA[k],
    SARIMA: metrics!.SARIMA[k],
  }));

  return (
    <div className="space-y-6">
      {/* Section 1: Model Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="glass-card p-5"
      >
        <h3 className="section-title">Model Comparison — ARIMA vs SARIMA</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-4 data-label">Metric</th>
                <th className="text-left py-3 px-4 data-label">ARIMA</th>
                <th className="text-left py-3 px-4 data-label">SARIMA</th>
                <th className="text-left py-3 px-4 data-label">Winner</th>
              </tr>
            </thead>
            <tbody>
              {metricKeys.map((k, i) => {
                const aVal = metrics!.ARIMA[k];
                const sVal = metrics!.SARIMA[k];
                // For AIC/BIC lower is better (more negative = better), same for MAE/RMSE/MAPE
                const winner = Math.abs(aVal) < Math.abs(sVal) ? (k === "AIC" || k === "BIC" ? "SARIMA" : "ARIMA") : (k === "AIC" || k === "BIC" ? "ARIMA" : "SARIMA");
                const arimaWins = winner === "ARIMA";
                // For log-likelihood metrics, more negative is better
                const actualWinner = aVal <= sVal ? "ARIMA" : "SARIMA";
                const finalWinner = (k === "AIC" || k === "BIC") ?
                  (aVal < sVal ? "ARIMA" : sVal < aVal ? "SARIMA" : "Tie") :
                  (aVal < sVal ? "ARIMA" : sVal < aVal ? "SARIMA" : "Tie");
                return (
                  <tr key={k} className={`border-b border-white/[0.03] ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                    <td className="py-2.5 px-4 font-mono text-foreground font-medium">{k}</td>
                    <td className={cn("py-2.5 px-4 font-mono", finalWinner === "ARIMA" ? "text-success" : "text-foreground")}>
                      {aVal.toFixed(4)}
                    </td>
                    <td className={cn("py-2.5 px-4 font-mono", finalWinner === "SARIMA" ? "text-success" : "text-foreground")}>
                      {sVal.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                        finalWinner === "Tie"
                          ? "bg-muted text-muted-foreground"
                          : "bg-success/15 text-success border border-success/20"
                      )}>
                        {finalWinner}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bar chart comparison */}
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" vertical={false} />
              <XAxis
                dataKey="metric"
                tick={{ fontSize: 12, fill: "hsl(215 20% 55%)", fontFamily: "'JetBrains Mono'" }}
                axisLine={{ stroke: "hsl(222 20% 18%)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)", fontFamily: "'JetBrains Mono'" }}
                axisLine={{ stroke: "hsl(222 20% 18%)" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(222 40% 10%)",
                  border: "1px solid hsl(222 20% 18%)",
                  borderRadius: "8px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'JetBrains Mono'" }} />
              <Bar dataKey="ARIMA" fill="hsl(256 70% 60%)" radius={[4, 4, 0, 0]} animationDuration={1500} />
              <Bar dataKey="SARIMA" fill="hsl(188 86% 43%)" radius={[4, 4, 0, 0]} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Section 2: Equation Formulas */}
      {equations && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card p-5"
        >
          <h3 className="section-title">Model Equations</h3>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-muted/30 rounded-lg p-4 border border-white/[0.04]">
              <div className="data-label mb-2">ARIMA Definition</div>
              <code className="text-xs font-mono text-primary/90 break-all leading-relaxed block">
                {equations.arima_definition}
              </code>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-white/[0.04]">
              <div className="data-label mb-2">SARIMA Definition</div>
              <code className="text-xs font-mono text-accent/90 break-all leading-relaxed block">
                {equations.sarima_definition}
              </code>
            </div>
          </div>
          <div className="data-label mb-2">Error Metric Formulas</div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(equations.error_metric_formulas).map(([key, formula]) => (
              <div key={key} className="bg-muted/20 rounded-lg p-3 border border-white/[0.04]">
                <div className="text-xs font-mono text-primary font-bold mb-1">{key}</div>
                <code className="text-[11px] font-mono text-muted-foreground break-all">{formula}</code>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Section 3: STL Decomposition Charts */}
      {decomp && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <DecompositionChart
            observed={decomp.observed}
            trend={decomp.trend}
            seasonal={decomp.seasonal}
            residual={decomp.residual}
          />
        </motion.div>
      )}

      {/* Section 4: Diagnostic Plots */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="glass-card p-5"
      >
        <h3 className="section-title">Diagnostic Plots</h3>
        <div className="grid grid-cols-4 gap-4">
          {PLOT_IMAGES.map(({ file, title, desc }) => (
            <div
              key={file}
              className="group cursor-pointer bg-muted/20 rounded-lg border border-white/[0.04] overflow-hidden hover:border-primary/30 transition-all duration-300"
              onClick={() => setModalImg(`${PLOTS_BASE}/${file}`)}
            >
              <div className="aspect-[16/10] relative overflow-hidden">
                <img
                  src={`${PLOTS_BASE}/${file}`}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="p-3">
                <div className="text-xs font-semibold text-foreground mb-0.5">{title}</div>
                <div className="text-[10px] text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Image Modal */}
      {modalImg && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setModalImg(null)}
        >
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setModalImg(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={modalImg}
              alt="Diagnostic Plot"
              className="w-full rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
