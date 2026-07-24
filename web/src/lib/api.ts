const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/backend";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export type SiteSummary = {
  site_id: string;
  site_name: string;
  region?: string;
  industry?: string;
  cost_30d: number;
  kwh_30d: number;
  production_30d?: number;
  intensity_avg: number;
  budget_variance_30d: number;
  anomalies_30d: number;
  demand_cost_30d: number;
  energy_cost_30d?: number;
  gas_cost_30d?: number;
  rec_coverage_pct: number;
  emissions_30d: number;
  peak_kw_max?: number;
  cost_per_unit?: number;
};

export type Waterfall = {
  budget: number;
  energy: number;
  demand: number;
  gas: number;
  actual: number;
  variance: number;
};

export type TsPoint = {
  date: string;
  site_id: string;
  site_name: string;
  total_cost: number;
  energy_cost?: number;
  demand_cost: number;
  gas_cost?: number;
  electricity_kwh: number;
  production_units?: number;
  intensity_kwh_per_unit: number;
  budget_variance: number;
  is_anomaly: boolean;
  anomaly_score?: number;
  emissions_tco2e: number;
  rec_coverage_pct: number;
  peak_kw?: number;
  temp_c?: number;
};

export type Anomaly = {
  date: string;
  site_id: string;
  site_name: string;
  intensity_kwh_per_unit: number;
  anomaly_score: number;
  anomaly_type?: string;
  total_cost: number;
  electricity_kwh: number;
  production_units?: number;
};

export type Forecast = {
  site_id: string;
  site_name: string;
  model: string;
  features: string[];
  feature_importance: Record<string, number>;
  mape_pct: number | null;
  mae_kwh: number | null;
  avg_error_kwh: number | null;
  backtest_days: number;
  horizon_days: number;
  backtest: {
    date: string;
    actual_kwh: number;
    predicted_kwh: number;
    error_kwh: number;
    abs_pct_error: number;
  }[];
  forecast: { date: string; electricity_kwh: number }[];
};

export type Invoice = {
  invoice_id: string;
  site_id: string;
  site_name: string;
  month: string;
  electricity_kwh: number;
  gas_therms: number;
  energy_cost: number;
  demand_cost: number;
  gas_cost: number;
  total_cost: number;
  peak_kw: number;
  production_units: number;
};

export type InsightPayload = {
  engine: string;
  headline: string;
  narrative: string;
  kpis: {
    variance_30d: number;
    demand_share_pct: number;
    energy_share_pct: number;
    anomalies_30d: number;
  };
  actions: { priority: string; title: string; detail: string }[];
  as_of: string | null;
};

export type ExpectedFixtures = {
  sites: number;
  known_anomalies: { site_id: string; date: string }[];
  forecast_mape_max_pct: number;
  force_fail_demo: boolean;
  therms_to_mmbtu: number;
  kwh_to_mwh: number;
};

export const api = {
  summary: () => getJson<SiteSummary[]>("/api/summary"),
  waterfall: () => getJson<Waterfall>("/api/waterfall"),
  timeseries: (siteId?: string) =>
    getJson<TsPoint[]>(`/api/timeseries?days=90${siteId ? `&site_id=${siteId}` : ""}`),
  anomalies: () => getJson<Anomaly[]>("/api/anomalies?days=180"),
  forecast: (siteId: string) => getJson<Forecast>(`/api/forecast?site_id=${siteId}`),
  invoices: (siteId?: string) =>
    getJson<Invoice[]>(`/api/invoices${siteId ? `?site_id=${siteId}` : ""}`),
  insights: () => getJson<InsightPayload>("/api/insights"),
  expected: () => getJson<ExpectedFixtures>("/api/expected"),
  meta: () =>
    getJson<{ sites: number; hourly_rows: number; daily_rows: number; anomaly_days: number }>(
      "/api/meta",
    ),
};
