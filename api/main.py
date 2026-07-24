from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[1]
GOLD = ROOT / "data" / "gold"

app = FastAPI(title="Voltart API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_json(name: str) -> Any:
    path = GOLD / name
    if not path.exists():
        raise HTTPException(status_code=503, detail="Gold data missing. Run: python -m pipeline.generate_data")
    return json.loads(path.read_text())


def _daily_df() -> pd.DataFrame:
    df = pd.DataFrame(_load_json("daily_site_energy.json"))
    df["date"] = pd.to_datetime(df["date"])
    return df


@app.get("/health")
def health() -> dict[str, Any]:
    meta = _load_json("meta.json") if (GOLD / "meta.json").exists() else {}
    return {"status": "ok", "product": "Voltart", "meta": meta}


@app.get("/api/meta")
def meta() -> dict[str, Any]:
    return _load_json("meta.json")


@app.get("/api/expected")
def expected() -> dict[str, Any]:
    return _load_json("expected.json")


@app.get("/api/summary")
def summary() -> list[dict[str, Any]]:
    return _load_json("site_summary_30d.json")


@app.get("/api/waterfall")
def waterfall() -> dict[str, Any]:
    return _load_json("cost_waterfall_30d.json")


@app.get("/api/invoices")
def invoices(site_id: str | None = Query(default=None)) -> list[dict[str, Any]]:
    rows = _load_json("invoices_monthly.json")
    if site_id:
        rows = [r for r in rows if r["site_id"] == site_id]
    return sorted(rows, key=lambda r: r["month"], reverse=True)


@app.get("/api/timeseries")
def timeseries(
    site_id: str | None = Query(default=None),
    days: int = Query(default=90, ge=14, le=180),
) -> list[dict[str, Any]]:
    df = _daily_df()
    if site_id:
        df = df[df["site_id"] == site_id]
        if df.empty:
            raise HTTPException(status_code=404, detail="Unknown site_id")
    cutoff = df["date"].max() - pd.Timedelta(days=days)
    df = df[df["date"] >= cutoff].sort_values(["site_id", "date"])
    cols = [
        "date",
        "site_id",
        "site_name",
        "total_cost",
        "energy_cost",
        "demand_cost",
        "gas_cost",
        "electricity_kwh",
        "production_units",
        "intensity_kwh_per_unit",
        "budget_variance",
        "is_anomaly",
        "anomaly_score",
        "emissions_tco2e",
        "rec_coverage_pct",
        "peak_kw",
        "temp_c",
    ]
    out = df[[c for c in cols if c in df.columns]].copy()
    out["date"] = out["date"].dt.strftime("%Y-%m-%d")
    return out.to_dict(orient="records")


@app.get("/api/anomalies")
def anomalies(days: int = Query(default=60, ge=7, le=180)) -> list[dict[str, Any]]:
    df = _daily_df()
    cutoff = df["date"].max() - pd.Timedelta(days=days)
    flagged = df[(df["date"] >= cutoff) & (df["is_anomaly"])].sort_values("date", ascending=False)
    cols = [
        "date",
        "site_id",
        "site_name",
        "intensity_kwh_per_unit",
        "anomaly_score",
        "anomaly_type",
        "total_cost",
        "electricity_kwh",
        "production_units",
    ]
    flagged = flagged[[c for c in cols if c in flagged.columns]].copy()
    flagged["date"] = flagged["date"].dt.strftime("%Y-%m-%d")
    return flagged.head(50).to_dict(orient="records")


@app.get("/api/forecast")
def forecast(site_id: str = Query(...), horizon: int = Query(default=14, ge=7, le=30)) -> dict[str, Any]:
    from models.forecast import build_site_forecast

    df = _daily_df()
    try:
        return build_site_forecast(df, site_id=site_id, horizon=horizon, backtest_days=30)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/insights")
def insights() -> dict[str, Any]:
    """Stats-backed narrative insights (+ optional LLM if OPENAI_API_KEY set)."""
    import os

    wf = _load_json("cost_waterfall_30d.json")
    summary = _load_json("site_summary_30d.json")
    daily = _daily_df()
    top = max(summary, key=lambda r: r["budget_variance_30d"])
    anomalies = int(sum(r.get("anomalies_30d", 0) for r in summary))
    demand_share = (wf["demand"] / max(wf["actual"], 1)) * 100
    energy_share = (wf["energy"] / max(wf["actual"], 1)) * 100

    actions: list[dict[str, str]] = []
    if demand_share >= 20:
        actions.append(
            {
                "priority": "high",
                "title": "Cut peak demand exposure",
                "detail": (
                    f"Demand charges are {demand_share:.0f}% of 30d cost. Shift flexible loads "
                    f"outside 4–8pm TOU peaks at {top['site_name']} first."
                ),
            }
        )
    if top["budget_variance_30d"] > 0:
        actions.append(
            {
                "priority": "high",
                "title": f"Investigate {top['site_name']} variance",
                "detail": (
                    f"This site accounts for the largest overspend ({top['budget_variance_30d']:.0f} USD). "
                    f"Intensity avg {top['intensity_avg']:.1f} kWh/unit — compare against sister sites."
                ),
            }
        )
    if anomalies > 0:
        actions.append(
            {
                "priority": "medium",
                "title": "Review intensity anomalies",
                "detail": (
                    f"{anomalies} anomaly-days in the last 30d. Check idle equipment, compressed-air leaks, "
                    "or production under-reporting on flagged days."
                ),
            }
        )
    actions.append(
        {
            "priority": "low",
            "title": "Lock next-week forecast into budget",
            "detail": (
                f"Energy is {energy_share:.0f}% of cost. Use the 14-day load forecast to pre-approve "
                "overtime HVAC/furnace schedules before they hit demand peaks."
            ),
        }
    )

    narrative = (
        f"Portfolio is {wf['variance']:+,.0f} USD vs budget over 30 days. "
        f"{top['site_name']} is the primary variance driver. "
        f"Demand charges ({wf['demand']:,.0f} USD) and energy ({wf['energy']:,.0f} USD) dominate the stack. "
        f"Stats models flagged {anomalies} abnormal intensity days — recommendations below are derived from "
        f"those metrics (LLM layer can rewrite tone when an API key is configured)."
    )

    engine = "stats+rules"
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            # Optional: soft LLM rewrite without hard dependency
            import urllib.request

            payload = json.dumps(
                {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an industrial energy analyst. Rewrite briefly, keep numbers exact, max 80 words.",
                        },
                        {"role": "user", "content": narrative},
                    ],
                    "temperature": 0.3,
                }
            ).encode()
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=payload,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode())
                narrative = data["choices"][0]["message"]["content"].strip()
                engine = "stats+llm"
        except Exception:
            engine = "stats+rules(fallback)"

    latest = daily.sort_values("date").groupby("site_id").tail(1)
    return {
        "engine": engine,
        "headline": f"{top['site_name']} is driving budget variance",
        "narrative": narrative,
        "kpis": {
            "variance_30d": wf["variance"],
            "demand_share_pct": round(demand_share, 1),
            "energy_share_pct": round(energy_share, 1),
            "anomalies_30d": anomalies,
        },
        "actions": actions,
        "as_of": str(latest["date"].max().date()) if len(latest) else None,
    }


@app.get("/api/story")
def story() -> dict[str, Any]:
    wf = _load_json("cost_waterfall_30d.json")
    summary = _load_json("site_summary_30d.json")
    top = max(summary, key=lambda r: r["budget_variance_30d"])
    return {
        "headline": f"{top['site_name']} drove most of the overspend",
        "variance": wf["variance"],
        "drivers": {"energy": wf["energy"], "demand": wf["demand"], "gas": wf["gas"]},
        "top_site": top,
    }
