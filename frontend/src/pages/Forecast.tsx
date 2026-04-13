import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus, AlertCircle } from "lucide-react";
import ForecastChart from "@/components/charts/ForecastChart";
import ResidualChart from "@/components/charts/ResidualChart";
import {
  getTimeseries,
  getForecast,
  getPredictionErrors,
  type TimeseriesPoint,
  type ForecastPoint,
  type PredictionError,
} from "@/lib/api";

export default function Forecast() {
  const [history, setHistory] = useState<TimeseriesPoint[] | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[] | null>(null);
  const [errors, setErrors] = useState<PredictionError[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTimeseries(), getForecast(), getPredictionErrors()])
      .then(([ts, fc, pe]) => {
        setHistory(ts);
        setForecast(fc);
        setErrors(pe);
      })
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (fetchError) {
    return (
      <div className="glass-card p-8 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <div className="text-destructive text-lg font-semibold mb-2">Error Loading Forecast</div>
        <p className="text-muted-foreground text-sm">{fetchError}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card h-[430px] shimmer-bg rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card h-[120px] shimmer-bg rounded-lg" />
          <div className="col-span-2 glass-card h-[120px] shimmer-bg rounded-lg" />
        </div>
        <div className="glass-card h-[300px] shimmer-bg rounded-lg" />
      </div>
    );
  }

  // Compute direction from forecast
  const fcValues = forecast!.map((p) => p.forecast);
  const firstFc = fcValues[0];
  const lastFc = fcValues[fcValues.length - 1];
  const diff = lastFc - firstFc;
  const direction = Math.abs(diff) < 0.005 ? "Stable" : diff > 0 ? "Rising" : "Falling";
  const avgFc = fcValues.reduce((a, b) => a + b, 0) / fcValues.length;

  // Prediction error stats
  const avgAbsErr = errors!.reduce((a, e) => a + e.abs_error, 0) / errors!.length;
  const maxError = errors!.reduce((max, e) => (e.abs_error > max.abs_error ? e : max), errors![0]);

  const DirectionIcon = direction === "Rising" ? TrendingUp : direction === "Falling" ? TrendingDown : Minus;
  const dirColor = direction === "Rising" ? "text-destructive" : direction === "Falling" ? "text-success" : "text-muted-foreground";
  const dirBg = direction === "Rising" ? "bg-destructive/15 border-destructive/20" : direction === "Falling" ? "bg-success/15 border-success/20" : "bg-muted/50 border-white/[0.06]";

  return (
    <div className="space-y-6">
      {/* Forecast Chart */}
      {history && forecast && <ForecastChart history={history} forecast={forecast} />}

      {/* Insight + Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Direction insight */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="glass-card p-5 flex flex-col justify-center"
        >
          <div className="data-label mb-2">Forecast Direction</div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${dirBg} ${dirColor}`}>
              <DirectionIcon className="w-3.5 h-3.5" />
              {direction}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Expected avg churn rate: <span className="text-foreground font-mono">{(avgFc * 100).toFixed(2)}%</span>
          </p>
        </motion.div>

        {/* Error stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="col-span-2 glass-card p-5"
        >
          <div className="data-label mb-2">Prediction Error Summary</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Avg Absolute Error</div>
              <div className="text-lg font-mono font-bold text-primary">{avgAbsErr.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Max Error Month</div>
              <div className="text-lg font-mono font-bold text-destructive">
                Month {maxError.month_index} <span className="text-sm">({maxError.abs_error.toFixed(4)})</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forecast Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="glass-card p-5"
      >
        <h3 className="section-title">Forecast Data</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-4 data-label">Month Index</th>
                <th className="text-left py-3 px-4 data-label">Forecast %</th>
                <th className="text-left py-3 px-4 data-label">Lower Bound</th>
                <th className="text-left py-3 px-4 data-label">Upper Bound</th>
              </tr>
            </thead>
            <tbody>
              {forecast!.map((row, i) => (
                <tr
                  key={row.month_index}
                  className={`border-b border-white/[0.03] ${i % 2 === 0 ? "bg-white/[0.02]" : ""} hover:bg-white/[0.04] transition-colors`}
                >
                  <td className="py-2.5 px-4 font-mono text-foreground">{row.month_index}</td>
                  <td className="py-2.5 px-4 font-mono text-primary">{(row.forecast * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-4 font-mono text-muted-foreground">{(row.lower * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-4 font-mono text-muted-foreground">{(row.upper * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Residual Chart */}
      {errors && <ResidualChart data={errors} />}
    </div>
  );
}
