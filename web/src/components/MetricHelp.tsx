"use client";

import { useEffect, useId, useRef, useState } from "react";

export type MetricHelp = {
  title: string;
  meaning: string;
  example: string;
  action?: string;
};

export const HELP = {
  cost_30d: {
    title: "30-day cost",
    meaning: "Total energy spend for the selected site(s) over the last 30 days — electricity energy + demand charges + gas.",
    example: "If Harbor Process shows $120k, that is what the plant ‘owed’ for energy in the last month of mock invoices.",
    action: "Compare sites to see which location dominates the portfolio bill.",
  },
  budget: {
    title: "30-day budget",
    meaning: "Planned energy spend for the selected site(s) over the last 30 days. This is the target finance set before the period.",
    example: "Portfolio budget ~$308k means plants were expected to land near that total for electricity + demand + gas.",
    action: "Compare Budget to Actual (30d cost). The gap is Budget variance.",
  },
  budget_variance: {
    title: "Budget variance",
    meaning: "Actual cost minus budget. Positive = overspend. Negative = under budget.",
    example: "Budget $308k, actual $331k → variance +$23k (~7% over plan).",
    action: "Open Cost composition to see whether energy, demand, or gas caused it.",
  },
  intensity: {
    title: "Energy intensity",
    meaning: "kWh used per production unit. This is the efficiency signal — not raw kWh.",
    example: "Same output, intensity 12 → 18 kWh/u means something wasted energy (idle machines, leaks, scrap runs).",
    action: "On Forecast, check if high-intensity days are flagged as anomalies.",
  },
  demand: {
    title: "Demand charges",
    meaning: "Fees based on peak kW (highest short interval), not total kWh. Utilities bill for capacity you force them to reserve.",
    example: "One 2pm spike to 2.1 MW can set the monthly demand charge even if nights are quiet.",
    action: "Shift flexible loads off peak hours (often late afternoon) to cut this line item.",
  },
  cost_trend: {
    title: "Cost & load trend",
    meaning: "Daily $ cost (steel-blue area) vs electricity volume in MWh (orange line).",
    example: "Cost rising while MWh is flat often means rates/demand — not that you produced more.",
    action: "Zoom mentally to weekends vs weekdays; weekend dips should follow production.",
  },
  composition: {
    title: "Cost composition",
    meaning: "Splits the 30-day stack into budget, energy $, demand $, gas $, and actual total.",
    example: "If Demand is large vs Energy, peak-shaving saves more than turning lights off.",
    action: "Use this when finance asks ‘what drove the bill?’ — answer with a driver, not a shrug.",
  },
  site_compare: {
    title: "Site comparison",
    meaning: "Side-by-side 30-day cost by plant so you can rank spenders.",
    example: "Harbor tallest bar → start investigation there before touching smaller sites.",
    action: "Filter the Site dropdown to that plant and re-check variance + intensity.",
  },
  invoices: {
    title: "Utility invoices",
    meaning: "Monthly synthetic invoice rollups (kWh, peak kW, $) — like SAP/utility line summaries.",
    example: "INV-S1-2025-06 is Riverside’s June bill mock: usage + peak + total.",
    action: "Match a high invoice month back to the daily trend for that period.",
  },
  emissions: {
    title: "Emissions",
    meaning: "Estimated tCO₂e from electricity + gas using simple emission factors.",
    example: "898 tCO₂e / 30d ≈ the carbon footprint of that energy mix in the mock model.",
    action: "Pair with REC coverage to see how much is offset on paper.",
  },
  rec: {
    title: "REC coverage",
    meaning: "Share of electricity notionally covered by Renewable Energy Certificates.",
    example: "38% REC means ~38% of kWh is matched with green certificates in the mock.",
    action: "Low REC + high emissions → sustainability gap to discuss with procurement.",
  },
  anomalies: {
    title: "Anomalies",
    meaning: "Days where intensity was statistically abnormal vs the plant’s recent baseline.",
    example: "Riverside 2025-06-29 at 26 kWh/u with z=1.8 → efficiency broke from normal pattern.",
    action: "Ask ops: downtime? sensor fault? unplanned overtime? compressed-air leak?",
  },
  forecast: {
    title: "Load forecast",
    meaning: "GradientBoosting model trained on Analyst data (production, temp, day-of-week, recent kWh). Backtest shows actual vs predicted; forward chart is the next 14 days.",
    example: "MAPE 1.2% and MAE ~244 kWh means a typical day the model was only ~244 kWh off the true meter reading.",
    action: "If next week’s predicted peak is high, shift flexible loads before the bill spike.",
  },
  insights: {
    title: "Recommended actions",
    meaning: "Short next steps derived from budget variance, demand share, and anomalies — so you don’t have to reverse-engineer the charts.",
    example: "‘Cut peak demand’ when demand is ~22% of cost; ‘Investigate Cascade’ when that site owns most of the overspend.",
    action: "Pick the high-priority card and open the matching chart (composition, site compare, or Forecast anomalies).",
  },
} as const satisfies Record<string, MetricHelp>;

export function HelpButton({ help }: { help: MetricHelp }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="relative ml-1 inline-flex align-middle" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        title={`What is ${help.title}?`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[11px] font-semibold text-[#8b939e] transition hover:border-[#f0772a] hover:text-[#f0772a]"
      >
        ?
      </button>
      {open && (
        <span
          id={panelId}
          role="dialog"
          className="absolute right-0 top-7 z-40 block w-72 rounded-xl border border-white/10 bg-[#1e242e] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)] md:w-80"
        >
          <span className="block text-sm font-semibold text-[#e8ecf1]">{help.title}</span>
          <span className="mt-2 block text-xs leading-relaxed text-[#c5ccd6]">{help.meaning}</span>
          <span className="mt-2 block text-xs leading-relaxed text-[#8b939e]">
            <span className="font-semibold text-[#f0772a]">Example. </span>
            {help.example}
          </span>
          {help.action ? (
            <span className="mt-2 block text-xs leading-relaxed text-[#8b939e]">
              <span className="font-semibold text-[#5b8fa8]">What to do. </span>
              {help.action}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
