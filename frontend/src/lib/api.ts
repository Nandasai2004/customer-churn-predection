const BASE = "http://localhost:8000";

/* ─── Response Types ─── */

export interface MetricSet {
  MAE: number;
  RMSE: number;
  MAPE: number;
  AIC: number;
  BIC: number;
}

export interface MetricsResponse {
  ARIMA: MetricSet;
  SARIMA: MetricSet;
}

export interface ForecastPoint {
  month_index: number;
  forecast: number;
  lower: number;
  upper: number;
}

export interface TrendResponse {
  equation: string;
  slope: number;
  intercept: number;
  trend_values: number[];
}

export interface AdfResult {
  adf_statistic: number;
  p_value: number;
  critical_values: Record<string, number>;
}

export interface DecompositionResponse {
  observed: number[];
  trend: number[];
  seasonal: number[];
  residual: number[];
  adf_raw: AdfResult;
  adf_differenced: AdfResult;
}

export interface TimeseriesPoint {
  month_index: number;
  churn_rate: number;
}

export interface SelectedParameters {
  p: number;
  d: number;
  q: number;
  P: number;
  D: number;
  Q: number;
  s: number;
}

export interface EquationsResponse {
  arima_definition: string;
  sarima_definition: string;
  selected_parameters: SelectedParameters;
  error_metric_formulas: Record<string, string>;
}

export interface PredictionError {
  month_index: number;
  actual: number;
  predicted: number;
  residual: number;
  abs_error: number;
}

export interface PredictPayload {
  tenure: number;
  MonthlyCharges: number;
  TotalCharges: number;
  SeniorCitizen: number;
  Partner: string;
  Dependents: string;
  Contract: string;
  InternetService: string;
  OnlineSecurity: string;
  OnlineBackup: string;
  DeviceProtection: string;
  TechSupport: string;
  PaperlessBilling: string;
  PaymentMethod: string;
}

export interface PredictResponse {
  churn: "Yes" | "No";
  probability: number;
  risk_level: "High" | "Medium" | "Low";
  monthly_charges: number;
  mrr_at_risk: number;
}

/* ─── Fetchers ─── */

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const getMetrics = () => get<MetricsResponse>("/metrics");
export const getForecast = () => get<ForecastPoint[]>("/forecast");
export const getTrend = () => get<TrendResponse>("/trend");
export const getDecomposition = () => get<DecompositionResponse>("/decomposition");
export const getTimeseries = () => get<TimeseriesPoint[]>("/timeseries");
export const getEquations = () => get<EquationsResponse>("/equations");
export const getPredictionErrors = () => get<PredictionError[]>("/prediction-errors");

export const predictCustomer = async (payload: PredictPayload): Promise<PredictResponse> => {
  const res = await fetch(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Prediction failed: ${res.status}`);
  return res.json();
};

export const PLOTS_BASE = `${BASE}/plots`;
