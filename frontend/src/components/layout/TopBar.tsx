import { useLocation } from "react-router-dom";
import { Activity } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/forecast": "Forecast",
  "/diagnostics": "Diagnostics",
  "/predict": "Predict Customer",
};

export default function TopBar() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <header className="h-14 border-b border-white/[0.06] bg-card/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-success" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-success animate-ping opacity-75" />
          </div>
          <span className="text-xs font-mono text-muted-foreground">Live</span>
        </div>
        {/* Model badge */}
        <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-muted-foreground">SARIMA + XGBoost Tuned</span>
        </div>
      </div>
    </header>
  );
}
