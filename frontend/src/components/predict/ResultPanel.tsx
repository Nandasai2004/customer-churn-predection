import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, DollarSign, RotateCcw, AlertTriangle } from "lucide-react";
import type { PredictResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ResultPanelProps {
  result: PredictResponse | null;
  loading: boolean;
  error: string | null;
  onReset: () => void;
}

function ProbabilityGauge({ probability }: { probability: number }) {
  const [animatedProb, setAnimatedProb] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1500;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedProb(probability * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [probability]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (animatedProb * circumference);
  const pct = Math.round(animatedProb * 100);
  const color = pct >= 70 ? "hsl(0 84% 60%)" : pct >= 40 ? "hsl(40 90% 55%)" : "hsl(160 84% 40%)";

  return (
    <div className="relative w-[180px] h-[180px] mx-auto">
      <svg width="180" height="180" className="-rotate-90">
        {/* Background circle */}
        <circle cx="90" cy="90" r={radius} fill="none" stroke="hsl(222 20% 18%)" strokeWidth="10" />
        {/* Progress circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          style={{ transition: "none", filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{pct}%</span>
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-1">Churn Probability</span>
      </div>
    </div>
  );
}

export default function ResultPanel({ result, loading, error, onReset }: ResultPanelProps) {
  if (error) {
    return (
      <div className="glass-card p-8 h-full flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
        <div className="text-destructive font-semibold mb-1">Prediction Failed</div>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-8 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Analyzing customer profile...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass-card p-8 h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Predict</h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Enter customer details on the left and click "Analyze Customer" to get a churn prediction.
        </p>
      </div>
    );
  }

  const isChurn = result.churn === "Yes";
  const riskColors: Record<string, { bg: string; text: string; border: string }> = {
    High: { bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/20" },
    Medium: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/20" },
    Low: { bg: "bg-success/15", text: "text-success", border: "border-success/20" },
  };
  const rc = riskColors[result.risk_level];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="result"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass-card p-6 h-full flex flex-col"
      >
        {/* Verdict Banner */}
        <div
          className={cn(
            "rounded-xl p-5 text-center mb-6",
            isChurn
              ? "bg-destructive/10 border border-destructive/20 glow-destructive"
              : "bg-success/10 border border-success/20 glow-success"
          )}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            {isChurn ? (
              <ShieldAlert className="w-5 h-5 text-destructive" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-success" />
            )}
            <span className={cn("text-lg font-bold", isChurn ? "text-destructive" : "text-success")}>
              {isChurn ? "HIGH CHURN RISK" : "LIKELY RETAINED"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {(result.probability * 100).toFixed(1)}% chance of churning
          </p>
        </div>

        {/* Probability Gauge */}
        <ProbabilityGauge probability={result.probability} />

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-muted/30 rounded-lg p-3 border border-white/[0.04]">
            <div className="data-label mb-1">Risk Level</div>
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", rc.bg, rc.text, rc.border)}>
              {result.risk_level}
            </span>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-white/[0.04]">
            <div className="data-label mb-1">MRR at Risk</div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
              <span className={cn("text-lg font-bold font-mono", result.mrr_at_risk > 0 ? "text-destructive" : "text-success")}>
                {result.mrr_at_risk.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
          </div>
        </div>

        {/* Monthly Charges */}
        <div className="bg-muted/20 rounded-lg p-3 border border-white/[0.04] mt-3">
          <div className="data-label mb-1">Monthly Charges</div>
          <span className="text-lg font-bold font-mono text-foreground">
            ${result.monthly_charges.toFixed(2)}
          </span>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-muted/30 border border-white/[0.06] text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reset & Predict Another
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
