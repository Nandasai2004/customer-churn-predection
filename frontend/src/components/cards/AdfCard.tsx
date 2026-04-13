import { motion } from "framer-motion";
import type { AdfResult } from "@/lib/api";

interface AdfCardProps {
  adfResult: AdfResult;
  title?: string;
}

export default function AdfCard({ adfResult, title = "ADF Stationarity Test" }: AdfCardProps) {
  const isStationary = adfResult.p_value <= 0.05;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="glass-card p-5"
    >
      <h3 className="section-title">{title}</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="data-label">ADF Statistic</span>
          <span className="font-mono text-sm text-foreground">{adfResult.adf_statistic.toFixed(4)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="data-label">p-value</span>
          <span className="font-mono text-sm text-foreground">{adfResult.p_value.toFixed(6)}</span>
        </div>
        <div className="border-t border-white/[0.06] pt-3">
          <div className="data-label mb-2">Critical Values</div>
          {Object.entries(adfResult.critical_values).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-1">
              <span className="text-xs text-muted-foreground">{k}</span>
              <span className="font-mono text-xs text-foreground">{v.toFixed(4)}</span>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isStationary
                ? "bg-success/15 text-success border border-success/20"
                : "bg-destructive/15 text-destructive border border-destructive/20"
            }`}
          >
            {isStationary ? "✓ Stationary" : "✗ Non-Stationary"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
