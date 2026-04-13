import { useEffect, useState } from "react";
import { Gauge, BarChart3, Percent, FileBarChart, FileSpreadsheet } from "lucide-react";
import MetricCard from "@/components/cards/MetricCard";
import AdfCard from "@/components/cards/AdfCard";
import EquationCard from "@/components/cards/EquationCard";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import {
  getMetrics,
  getTimeseries,
  getTrend,
  getDecomposition,
  getEquations,
  type MetricsResponse,
  type TimeseriesPoint,
  type TrendResponse,
  type DecompositionResponse,
  type EquationsResponse,
} from "@/lib/api";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[] | null>(null);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [decomposition, setDecomposition] = useState<DecompositionResponse | null>(null);
  const [equations, setEquations] = useState<EquationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMetrics(), getTimeseries(), getTrend(), getDecomposition(), getEquations()])
      .then(([m, ts, tr, dec, eq]) => {
        setMetrics(m);
        setTimeseries(ts);
        setTrend(tr);
        setDecomposition(dec);
        setEquations(eq);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-destructive text-lg font-semibold mb-2">Failed to Load Dashboard</div>
        <p className="text-muted-foreground text-sm">{error}</p>
        <p className="text-muted-foreground text-xs mt-2">Make sure the backend is running on port 8000</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-[120px] shimmer-bg rounded-lg" />
          ))}
        </div>
        <div className="glass-card h-[400px] shimmer-bg rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card h-[250px] shimmer-bg rounded-lg" />
          <div className="glass-card h-[250px] shimmer-bg rounded-lg" />
        </div>
      </div>
    );
  }

  const s = metrics!.SARIMA;

  return (
    <div className="space-y-6">
      {/* Hero Stat Cards */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="Mean Absolute Error" value={s.MAE} decimals={4} icon={Gauge} accentColor="primary" index={0} />
        <MetricCard label="RMSE" value={s.RMSE} decimals={4} icon={BarChart3} accentColor="accent" index={1} />
        <MetricCard label="MAPE" value={s.MAPE} decimals={2} suffix="%" icon={Percent} accentColor="destructive" index={2} />
        <MetricCard label="AIC" value={s.AIC} decimals={2} icon={FileBarChart} accentColor="primary" index={3} />
        <MetricCard label="BIC" value={s.BIC} decimals={2} icon={FileSpreadsheet} accentColor="accent" index={4} />
      </div>

      {/* Time Series + Trend Line Chart */}
      {timeseries && trend && <TimeSeriesChart data={timeseries} trend={trend} />}

      {/* Bottom Row: ADF + Equations */}
      <div className="grid grid-cols-2 gap-4">
        {decomposition && <AdfCard adfResult={decomposition.adf_raw} />}
        {equations && <EquationCard equations={equations} />}
      </div>
    </div>
  );
}
