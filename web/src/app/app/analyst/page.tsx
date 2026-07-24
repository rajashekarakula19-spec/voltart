"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Kpi, Panel, money, num, tipStyle } from "@/components/AppShell";
import { HELP, HelpButton } from "@/components/MetricHelp";
import { api, type InsightPayload, type Invoice, type SiteSummary, type TsPoint, type Waterfall } from "@/lib/api";

export default function AnalystPage() {
  const [siteId, setSiteId] = useState("all");
  const [summary, setSummary] = useState<SiteSummary[]>([]);
  const [waterfall, setWaterfall] = useState<Waterfall | null>(null);
  const [series, setSeries] = useState<TsPoint[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [insights, setInsights] = useState<InsightPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const sid = siteId === "all" ? undefined : siteId;
        const [s, w, t, inv, ins] = await Promise.all([
          api.summary(),
          api.waterfall(),
          api.timeseries(sid),
          api.invoices(sid),
          api.insights(),
        ]);
        if (!alive) return;
        setSummary(s);
        setWaterfall(w);
        setSeries(t);
        setInvoices(inv.slice(0, 10));
        setInsights(ins);
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

  const rows = useMemo(
    () => (siteId === "all" ? summary : summary.filter((r) => r.site_id === siteId)),
    [summary, siteId],
  );

  const totals = useMemo(() => {
    if (!rows.length) return null;
    const cost = rows.reduce((a, r) => a + r.cost_30d, 0);
    const variance = rows.reduce((a, r) => a + r.budget_variance_30d, 0);
    return {
      cost,
      variance,
      budget: cost - variance,
      intensity: rows.reduce((a, r) => a + r.intensity_avg, 0) / rows.length,
      demand: rows.reduce((a, r) => a + r.demand_cost_30d, 0),
      energy: rows.reduce((a, r) => a + (r.energy_cost_30d ?? 0), 0),
      gas: rows.reduce((a, r) => a + (r.gas_cost_30d ?? 0), 0),
      rec: rows.reduce((a, r) => a + r.rec_coverage_pct, 0) / rows.length,
      emissions: rows.reduce((a, r) => a + r.emissions_30d, 0),
      kwh: rows.reduce((a, r) => a + r.kwh_30d, 0),
      cpu: rows.reduce((a, r) => a + (r.cost_per_unit ?? 0), 0) / rows.length,
    };
  }, [rows]);

  const costTrend = useMemo(() => {
    const map = new Map<string, { date: string; cost: number; kwh: number }>();
    for (const p of series) {
      const cur = map.get(p.date) ?? { date: p.date, cost: 0, kwh: 0 };
      cur.cost += p.total_cost;
      cur.kwh += p.electricity_kwh;
      map.set(p.date, cur);
    }
    return [...map.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-60)
      .map((r) => ({ date: r.date.slice(5), cost: Math.round(r.cost), kwh: Number((r.kwh / 1000).toFixed(1)) }));
  }, [series]);

  const waterfallBars = waterfall
    ? [
        { name: "Budget", value: waterfall.budget, fill: "#8b939e" },
        { name: "Energy", value: waterfall.energy, fill: "#5b8fa8" },
        { name: "Demand", value: waterfall.demand, fill: "#f0772a" },
        { name: "Gas", value: waterfall.gas, fill: "#5b8fa8" },
        { name: "Actual", value: waterfall.actual, fill: "#3dba86" },
      ]
    : [];

  const siteCompare = summary.map((s) => ({
    name: s.site_name.split(" ")[0],
    cost: Math.round(s.cost_30d),
    variance: Math.round(s.budget_variance_30d),
  }));

  return (
    <AppShell title="Analyst · cost & variance" siteId={siteId} onSiteChange={setSiteId} sites={summary}>
      {error && (
        <div className="rounded-xl border border-[#e05a5a]/40 bg-[#e05a5a]/10 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          label="30d budget"
          value={loading || !totals ? "…" : money(totals.budget)}
          hint="Planned spend"
          help={HELP.budget}
        />
        <Kpi
          label="30d actual"
          value={loading || !totals ? "…" : money(totals.cost)}
          hint={totals ? `${num(totals.kwh / 1000, 0)} MWh` : undefined}
          help={HELP.cost_30d}
        />
        <Kpi
          label="Budget variance"
          value={loading || !totals ? "…" : money(totals.variance)}
          hint={totals ? `vs ${money(totals.budget)} budget` : undefined}
          tone={totals && totals.variance > 0 ? "text-[#e05a5a]" : "text-[#3dba86]"}
          help={HELP.budget_variance}
        />
        <Kpi label="Avg intensity" value={loading || !totals ? "…" : `${totals.intensity.toFixed(1)} kWh/u`} hint={totals ? `${money(totals.cpu)} / unit` : undefined} help={HELP.intensity} />
        <Kpi label="Demand charges" value={loading || !totals ? "…" : money(totals.demand)} help={HELP.demand} />
      </div>

      {insights && (
        <section className="rounded-2xl border border-[#f0772a]/25 bg-gradient-to-br from-[#171b22] to-[#1e242e] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#f0772a]">
              Recommended actions
            </span>
            <HelpButton help={HELP.insights} />
            <span className="text-sm text-[#e8ecf1]">{insights.headline}</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {insights.actions.slice(0, 3).map((act) => (
              <div key={act.title} className="rounded-xl border border-white/8 bg-[#0e1116]/70 p-3">
                <div className="text-[10px] uppercase tracking-wide text-[#f0772a]">{act.priority}</div>
                <div className="mt-1 text-sm font-medium">{act.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-[#8b939e]">{act.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Cost & load trend" subtitle="Daily portfolio" className="lg:col-span-3" help={HELP.cost_trend}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={costTrend}>
                <defs>
                  <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b8fa8" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#5b8fa8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 11 }} />
                <YAxis yAxisId="l" stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 11 }} />
                <Tooltip contentStyle={tipStyle} />
                <Area yAxisId="l" type="monotone" dataKey="cost" stroke="#5b8fa8" fill="url(#costFill)" strokeWidth={2} name="Cost $" />
                <Line yAxisId="r" type="monotone" dataKey="kwh" stroke="#f0772a" strokeWidth={2} dot={false} name="MWh" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Cost composition"
          subtitle={
            waterfall
              ? `Budget ${money(waterfall.budget)} → Actual ${money(waterfall.actual)}`
              : "30-day drivers"
          }
          className="lg:col-span-2"
          help={HELP.composition}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallBars} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={58} stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 12 }} />
                <Tooltip contentStyle={tipStyle} formatter={(v) => money(Number(v))} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {waterfallBars.map((e) => (
                    <Cell key={e.name} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Site comparison" subtitle="30-day cost" help={HELP.site_compare}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteCompare}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 12 }} />
                <YAxis stroke="#8b939e" tick={{ fill: "#8b939e", fontSize: 11 }} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="cost" fill="#5b8fa8" radius={[8, 8, 0, 0]} name="Cost $" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="grid gap-4 content-start sm:grid-cols-2">
          <Kpi label="Energy cost" value={totals ? money(totals.energy) : "—"} help={HELP.cost_30d} />
          <Kpi label="Gas cost" value={totals ? money(totals.gas) : "—"} help={HELP.composition} />
          <Kpi label="Emissions" value={totals ? `${totals.emissions.toFixed(0)} tCO₂e` : "—"} help={HELP.emissions} />
          <Kpi label="REC coverage" value={totals ? `${totals.rec.toFixed(0)}%` : "—"} help={HELP.rec} />
        </div>
      </div>

      <Panel title="Utility invoices" subtitle="Monthly synthetic invoice rollups" help={HELP.invoices}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#8b939e]">
              <tr className="border-b border-white/8">
                <th className="px-2 py-3 font-medium">Invoice</th>
                <th className="px-2 py-3 font-medium">Site</th>
                <th className="px-2 py-3 font-medium">Month</th>
                <th className="px-2 py-3 font-medium">kWh</th>
                <th className="px-2 py-3 font-medium">Peak kW</th>
                <th className="px-2 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.invoice_id} className="border-b border-white/5">
                  <td className="px-2 py-3 font-mono text-xs text-[#8b939e]">{inv.invoice_id}</td>
                  <td className="px-2 py-3">{inv.site_name}</td>
                  <td className="px-2 py-3">{inv.month}</td>
                  <td className="px-2 py-3 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                    {num(inv.electricity_kwh, 0)}
                  </td>
                  <td className="px-2 py-3 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                    {num(inv.peak_kw, 0)}
                  </td>
                  <td className="px-2 py-3 font-medium tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                    {money(inv.total_cost)}
                  </td>
                </tr>
              ))}
              {!invoices.length && (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-[#8b939e]">
                    {loading ? "Loading…" : "No invoices"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
