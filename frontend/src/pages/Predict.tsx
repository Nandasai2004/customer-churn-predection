import { useState, useCallback } from "react";
import PredictForm from "@/components/predict/PredictForm";
import ResultPanel from "@/components/predict/ResultPanel";
import { predictCustomer, type PredictPayload, type PredictResponse } from "@/lib/api";

export default function Predict() {
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (payload: PredictPayload) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictCustomer(payload);
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Failed to get prediction");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="grid grid-cols-[1fr_420px] gap-6 items-start">
      <PredictForm onSubmit={handleSubmit} loading={loading} />
      <div className="sticky top-6">
        <ResultPanel result={result} loading={loading} error={error} onReset={handleReset} />
      </div>
    </div>
  );
}
