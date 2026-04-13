import { motion } from "framer-motion";
import type { EquationsResponse } from "@/lib/api";

interface EquationCardProps {
  equations: EquationsResponse;
}

export default function EquationCard({ equations }: EquationCardProps) {
  const p = equations.selected_parameters;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="glass-card p-5"
    >
      <h3 className="section-title">Model Parameters</h3>

      {/* SARIMA Order */}
      <div className="mb-4">
        <div className="data-label mb-2">Selected SARIMA Order</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm text-foreground">SARIMA(</span>
          {[
            { label: "p", value: p.p },
            { label: "d", value: p.d },
            { label: "q", value: p.q },
          ].map((item, i) => (
            <span key={item.label}>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/15 text-primary font-mono text-sm font-bold">
                {item.value}
              </span>
              {i < 2 && <span className="text-muted-foreground mx-0.5">,</span>}
            </span>
          ))}
          <span className="font-mono text-sm text-foreground">)(</span>
          {[
            { label: "P", value: p.P },
            { label: "D", value: p.D },
            { label: "Q", value: p.Q },
          ].map((item, i) => (
            <span key={item.label}>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-accent/15 text-accent font-mono text-sm font-bold">
                {item.value}
              </span>
              {i < 2 && <span className="text-muted-foreground mx-0.5">,</span>}
            </span>
          ))}
          <span className="font-mono text-sm text-foreground">)</span>
          <sub className="text-muted-foreground font-mono text-xs">s={p.s}</sub>
        </div>
      </div>

      {/* Equation definitions */}
      <div className="space-y-2">
        <div className="bg-muted/50 rounded-lg p-3 border border-white/[0.04]">
          <div className="data-label mb-1">SARIMA Definition</div>
          <code className="text-xs font-mono text-primary/90 block break-all leading-relaxed">
            {equations.sarima_definition}
          </code>
        </div>
      </div>
    </motion.div>
  );
}
