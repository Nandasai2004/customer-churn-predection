import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  accentColor?: string;
  index?: number;
}

function useCountUp(target: number, duration = 1200, decimals = 4) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, decimals]);

  return display;
}

export default function MetricCard({
  label,
  value,
  decimals = 4,
  suffix = "",
  prefix = "",
  icon: Icon,
  accentColor = "primary",
  index = 0,
}: MetricCardProps) {
  const animatedValue = useCountUp(value, 1400, decimals);

  const colorMap: Record<string, string> = {
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success",
    destructive: "text-destructive",
  };

  const glowMap: Record<string, string> = {
    primary: "group-hover:shadow-[0_0_25px_-5px_hsl(188_86%_43%/0.2)]",
    accent: "group-hover:shadow-[0_0_25px_-5px_hsl(256_70%_60%/0.2)]",
    success: "group-hover:shadow-[0_0_25px_-5px_hsl(160_84%_40%/0.2)]",
    destructive: "group-hover:shadow-[0_0_25px_-5px_hsl(0_84%_60%/0.2)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className={cn(
        "glass-card-hover group p-5 cursor-default",
        glowMap[accentColor]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br",
          accentColor === "primary" && "from-primary/20 to-primary/5",
          accentColor === "accent" && "from-accent/20 to-accent/5",
          accentColor === "success" && "from-success/20 to-success/5",
          accentColor === "destructive" && "from-destructive/20 to-destructive/5",
        )}>
          <Icon className={cn("w-4.5 h-4.5", colorMap[accentColor])} />
        </div>
      </div>
      <div className="data-label mb-1.5">{label}</div>
      <div className={cn("stat-value", colorMap[accentColor])}>
        {prefix}{animatedValue.toFixed(decimals)}{suffix}
      </div>
    </motion.div>
  );
}
