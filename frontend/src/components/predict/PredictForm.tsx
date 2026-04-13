import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PredictPayload } from "@/lib/api";

interface PredictFormProps {
  onSubmit: (payload: PredictPayload) => void;
  loading: boolean;
}

function ToggleSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200",
          value ? "bg-primary" : "bg-muted"
        )}
      >
        <div className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200",
          value && "translate-x-5"
        )} />
      </button>
    </div>
  );
}

function RadioChips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-sm text-foreground mb-2">{label}</div>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
              value === opt
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-muted/30 border-white/[0.06] text-muted-foreground hover:border-white/[0.15] hover:text-foreground"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, suffix = "", prefix = "" }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; suffix?: string; prefix?: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm font-mono text-primary font-bold">{prefix}{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-muted appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_hsl(188_86%_43%/0.4)] [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}

function Select({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-sm text-foreground mb-2">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-white/[0.08] text-sm text-foreground appearance-none cursor-pointer
          hover:border-white/[0.15] focus:border-primary/40 focus:outline-none transition-colors"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
        ))}
      </select>
    </div>
  );
}

export default function PredictForm({ onSubmit, loading }: PredictFormProps) {
  const [form, setForm] = useState({
    tenure: 12,
    MonthlyCharges: 65,
    SeniorCitizen: 0,
    Partner: "No",
    Dependents: "No",
    Contract: "Month-to-month",
    InternetService: "Fiber optic",
    OnlineSecurity: "No",
    OnlineBackup: "No",
    DeviceProtection: "No",
    TechSupport: "No",
    PaperlessBilling: "Yes",
    PaymentMethod: "Electronic check",
  });

  const totalCharges = +(form.MonthlyCharges * form.tenure).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      TotalCharges: totalCharges,
    });
  };

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-6 space-y-6"
    >
      {/* Group 1: Customer Profile */}
      <div>
        <h4 className="data-label mb-3 text-primary">Customer Profile</h4>
        <div className="space-y-3">
          <ToggleSwitch label="Senior Citizen" value={form.SeniorCitizen === 1} onChange={(v) => update("SeniorCitizen", v ? 1 : 0)} />
          <RadioChips label="Partner" options={["Yes", "No"]} value={form.Partner} onChange={(v) => update("Partner", v)} />
          <RadioChips label="Dependents" options={["Yes", "No"]} value={form.Dependents} onChange={(v) => update("Dependents", v)} />
        </div>
      </div>

      {/* Group 2: Account Info */}
      <div>
        <h4 className="data-label mb-3 text-accent">Account Info</h4>
        <div className="space-y-3">
          <Slider label="Tenure (months)" value={form.tenure} onChange={(v) => update("tenure", v)} min={0} max={72} step={1} suffix=" mo" />
          <RadioChips label="Contract" options={["Month-to-month", "One year", "Two year"]} value={form.Contract} onChange={(v) => update("Contract", v)} />
          <ToggleSwitch label="Paperless Billing" value={form.PaperlessBilling === "Yes"} onChange={(v) => update("PaperlessBilling", v ? "Yes" : "No")} />
        </div>
      </div>

      {/* Group 3: Services */}
      <div>
        <h4 className="data-label mb-3 text-success">Services</h4>
        <div className="space-y-3">
          <Select label="Internet Service" options={["DSL", "Fiber optic", "No"]} value={form.InternetService} onChange={(v) => update("InternetService", v)} />
          <Select label="Online Security" options={["Yes", "No", "No internet service"]} value={form.OnlineSecurity} onChange={(v) => update("OnlineSecurity", v)} />
          <Select label="Online Backup" options={["Yes", "No", "No internet service"]} value={form.OnlineBackup} onChange={(v) => update("OnlineBackup", v)} />
          <Select label="Device Protection" options={["Yes", "No", "No internet service"]} value={form.DeviceProtection} onChange={(v) => update("DeviceProtection", v)} />
          <Select label="Tech Support" options={["Yes", "No", "No internet service"]} value={form.TechSupport} onChange={(v) => update("TechSupport", v)} />
        </div>
      </div>

      {/* Group 4: Billing */}
      <div>
        <h4 className="data-label mb-3 text-destructive">Billing</h4>
        <div className="space-y-3">
          <Slider label="Monthly Charges" value={form.MonthlyCharges} onChange={(v) => update("MonthlyCharges", v)} min={20} max={120} step={0.5} prefix="$" />
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-foreground">Total Charges</span>
              <span className="text-sm font-mono text-muted-foreground">(auto-computed)</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-muted/20 border border-white/[0.04] text-sm font-mono text-foreground">
              ${totalCharges.toFixed(2)}
            </div>
          </div>
          <Select
            label="Payment Method"
            options={["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"]}
            value={form.PaymentMethod}
            onChange={(v) => update("PaymentMethod", v)}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300",
          loading
            ? "bg-primary/30 text-primary/50 cursor-not-allowed"
            : "bg-gradient-to-r from-primary to-accent text-white hover:shadow-[0_0_25px_-5px_hsl(188_86%_43%/0.4)] hover:-translate-y-0.5"
        )}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Analyze Customer
          </>
        )}
      </button>
    </motion.form>
  );
}
