"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Kpi, Panel, tipStyle } from "@/components/AppShell";
import { HELP } from "@/components/MetricHelp";
import {
  api,
  type Anomaly,
  type Forecast,
  type SiteSummary,
} from "@/lib/api";

function moneyKwh(n: number) {
  return `${Math.round(n).toLocaleString()} kWh`;
}

export default function SciencePage() {
  const [siteId, setSiteId] = useState("S1");
  const [summary, setSummary] = useState<SiteSummary[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const s = await api.summary();
        if (!alive) return;
        setSummary(s);
        const focus = siteId === "all" ? s[0]?.site_id ?? "S1" : siteId;
        const [a, fc] = await Promise.all([api.anomalies(), api.forecast(focus)]);
        if (!alive) return;
        setAnomalies(a.filter((x) => x.site_id === focus));
        setForecast(fc);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [siteId]);

  const compareSeries = useMemo(() => {
    if (!forecast) return [];
    return forecast.backtest.map((b) => ({
      date: b.date.slice(5),
      actual: Math.round(b.actual_kwh),
      predicted: Math.round(b.predicted_kwh),
      error: Math.round(b.error_kwh),
    }));
  }, [forecast]);

  const futureSeries = useMemo(() => {
    if (!forecast) return [];
    return forecast.forecast.map((f) => ({
      date: f.date.slice(5),
      predicted: Math.round(f.electricity_kwh),
    }));
  }, [forecast]);

  const importance = useMemo(() => {
    if (!forecast?.feature_importance) return [];
    return Object.entries(forecast.feature_importance)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [forecast]);

  const featureLabels: Record<string, string> = {
    production_units: "Production (from Analyst)",
    temp_c: "Weather / temp",
    dow: "Day of week",
    lag1: "Yesterday’s kWh",
    lag7: "Same day last week",
  };

  const siteAnomalies30 = useMemo(() => {
    if (!forecast) return 0;
    const row = summary.find((r) => r.site_id === forecast.site_id);
    return row ? Math.round(row.anomalies_30d) : anomalies.length;
  }, [summary, forecast, anomalies]);

  return (
    <AppShell title="Forecast · predict from Analyst data" siteId={siteId} onSiteChange={setSiteId} sites={summary}>
      {error && (
        <div className="rounded-xl border border-[#e05a5a]/40 bg-[#e05a5a]/10 px-4 py-3 text-sm">{error}</div>
      )}

      <section className="rounded-2xl border border-white/8 bg-[#171b22] p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8b939e]">How this page works</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#c5ccd6]">
          Analyst already measured production, weather, and daily kWh. The forecaster trains a{" "}
          <span className="text-[#e8ecf1]">{forecast?.model ?? "GradientBoosting"}</span> model on that history,
          checks how far off it was on the last 30 days (actual vs predicted), then projects the next{" "}
          {forecast?.horizon_days ?? 14} days.
          {siteId === "all" && forecast ? (
            <span className="text-[#8b939e]"> Currently showing {forecast.site_name} (pick a site for a specific plant).</span>
          ) : null}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Avg miss (MAPE)"
          value={loading || forecast?.mape_pct == null ? "…" : `${forecast.mape_pct}%`}
          hint="Lower = closer to actual"
          help={HELP.forecast}
        />
        <Kpi
          label="Avg miss (kWh)"
          value={loading || forecast?.mae_kwh == null ? "…" : moneyKwh(forecast.mae_kwh)}
          hint="Mean absolute error"
          help={HELP.forecast}
        />
        <Kpi
          label="Model bias"
          value={
            loading || forecast?.avg_error_kwh == null
              ? "…"
              : `${forecast.avg_error_kwh > 0 ? "+" : ""}${Math.round(forecast.avg_error_kwh).toLocaleString()} kWh`
          }
          hint="Predicted − actual (avg)"
          help={HELP.forecast}
        />
        <Kpi
          label="Anomalies (30d)"
          value={loading ? "…" : String(siteAnomalies30)}
          tone="text-[#f0772a]"
          hint={forecast?.site_name}
          help={HELP.anomalies}
        />
      </div>

      <Panel
        title="How far off was the model?"
        subtitle="Last 30 days — blue = what actually happened · orange = what the model predicted"
        help={HELP.forecast}
      >
        {forecast ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={compareSeries}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 11 }} />
                <YAxis stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 11 }} width={52} />
                <Tooltip
                  contentStyle={tipStyle}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()} kWh`,
                    name === "actual" ? "Actual" : name === "predicted" ? "Predicted" : String(name),
                  ]}
                />
                <Legend />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#5b8fa8" fill="rgba(91,143,168,0.22)" strokeWidth={2} />
                <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#f0772a" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-[#8b939e]">{loading ? "Training model…" : "No backtest"}</p>
        )}
        {forecast && (
          <p className="mt-3 text-xs leading-relaxed text-[#8b939e]">
            On average the model missed by <span className="text-[#e8ecf1]">{forecast.mape_pct}% </span>
            (~{moneyKwh(forecast.mae_kwh ?? 0)} per day). Where the lines diverge, the plant behaved differently than
            production/weather history suggested.
          </p>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel
          title="What happens next?"
          subtitle={`Next ${forecast?.horizon_days ?? 14} days of predicted electricity for ${forecast?.site_name ?? "site"}`}
          className="lg:col-span-3"
          help={HELP.forecast}
        >
          {forecast ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={futureSeries}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 10 }} />
                  <YAxis stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 10 }} width={48} />
                  <Tooltip
                    contentStyle={tipStyle}
                    formatter={(value) => [`${Number(value).toLocaleString()} kWh`, "Predicted"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    name="Predicted kWh"
                    stroke="#f0772a"
                    fill="rgba(240,119,42,0.2)"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-[#8b939e]">{loading ? "Loading…" : "No forecast"}</p>
          )}
        </Panel>

        <Panel title="What Analyst fed the model" subtitle="Feature importance" className="lg:col-span-2" help={HELP.forecast}>
          <div className="space-y-3">
            {importance.map((f) => (
              <div key={f.name}>
                <div className="mb-1 flex justify-between text-xs text-[#8b939e]">
                  <span>{featureLabels[f.name] ?? f.name}</span>
                  <span className="tabular-nums text-[#e8ecf1]">{(f.value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-[#5b8fa8]" style={{ width: `${Math.max(f.value * 100, 4)}%` }} />
                </div>
              </div>
            ))}
            {!importance.length && <p className="text-sm text-[#8b939e]">{loading ? "…" : "No model yet"}</p>}
          </div>
        </Panel>
      </div>

      <Panel
        title="Anomaly days to watch"
        subtitle="Days Analyst flagged as abnormal intensity — useful context when the model misses"
        help={HELP.anomalies}
      >
        <div className="max-h-72 space-y-2 overflow-auto pr-1">
          {anomalies.slice(0, 12).map((a) => (
            <div
              key={`${a.site_id}-${a.date}-${a.anomaly_score}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/6 bg-[#0e1116]/70 px-3 py-3"
            >
              <div>
                <div className="text-sm font-medium">{a.site_name}</div>
                <div className="text-xs text-[#8b939e]">
                  {a.date}
                  {a.anomaly_type && a.anomaly_type !== "none" ? ` · ${a.anomaly_type.replace("_", " ")}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm tabular-nums text-[#f0772a]" style={{ fontFamily: "var(--font-mono)" }}>
                  {a.intensity_kwh_per_unit.toFixed(1)} kWh/u
                </div>
                <div className="text-xs text-[#8b939e]">z {(a.anomaly_score ?? 0).toFixed(1)}</div>
              </div>
            </div>
          ))}
          {!anomalies.length && (
            <p className="text-sm text-[#8b939e]">{loading ? "Loading…" : "No anomalies for this site"}</p>
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
