import { NavLink } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Stethoscope, UserSearch, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/forecast", label: "Forecast", icon: TrendingUp },
  { to: "/diagnostics", label: "Diagnostics", icon: Stethoscope },
  { to: "/predict", label: "Predict", icon: UserSearch },
];

export default function Sidebar() {
  return (
    <aside className="w-[220px] h-screen bg-card/60 backdrop-blur-xl border-r border-white/[0.06] flex flex-col py-6 shrink-0">
      {/* Brand */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BrainCircuit className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">ChurnSight</h1>
            <span className="text-[10px] font-mono text-primary tracking-widest uppercase">AI</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <Icon className={cn("w-[18px] h-[18px] transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Model badge */}
      <div className="px-5 mt-auto">
        <div className="glass-card p-3 text-center">
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase mb-1">Model</div>
          <div className="text-xs font-semibold text-primary">SARIMA + XGBoost</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">Tuned</div>
        </div>
      </div>
    </aside>
  );
}
