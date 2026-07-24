"""Load forecast model for Voltart.

Trains a GradientBoostingRegressor on daily plant data (the same series
Analyst charts use: production, weather, and recent kWh), then:
  1) backtests on a held-out window → actual vs predicted (how far off)
  2) forecasts the next N days → predicted kWh
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

ROOT = Path(__file__).resolve().parents[1]
GOLD = ROOT / "data" / "gold"

FEATURES = ["production_units", "temp_c", "dow", "lag1", "lag7"]
TARGET = "electricity_kwh"


def _prepare_site(df: pd.DataFrame, site_id: str) -> pd.DataFrame:
    site = df[df["site_id"] == site_id].sort_values("date").copy()
    if site.empty:
        raise ValueError(f"Unknown site_id: {site_id}")
    site["date"] = pd.to_datetime(site["date"]).dt.tz_localize(None)
    site["dow"] = site["date"].dt.dayofweek
    site["lag1"] = site[TARGET].shift(1)
    site["lag7"] = site[TARGET].shift(7)
    return site


def _dow_lookup(series: pd.Series, dow: pd.Series) -> dict[int, float]:
    frame = pd.DataFrame({"v": series, "dow": dow}).dropna()
    means = frame.groupby("dow")["v"].mean()
    overall = float(frame["v"].mean()) if len(frame) else 0.0
    return {int(i): float(means.get(i, overall)) for i in range(7)}


def build_site_forecast(
    df: pd.DataFrame,
    site_id: str,
    horizon: int = 14,
    backtest_days: int = 30,
) -> dict[str, Any]:
    site = _prepare_site(df, site_id)
    train_ready = site.dropna(subset=FEATURES + [TARGET]).copy()
    if len(train_ready) < backtest_days + 20:
        raise ValueError("Not enough history to train forecast model")

    # Hold out the last backtest_days for actual-vs-predicted
    split = len(train_ready) - backtest_days
    train = train_ready.iloc[:split]
    test = train_ready.iloc[split:]

    model = GradientBoostingRegressor(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=3,
        random_state=42,
    )
    model.fit(train[FEATURES], train[TARGET])

    # Backtest: predict held-out days with true features (standard ML eval)
    test_pred = model.predict(test[FEATURES])
    actual = test[TARGET].to_numpy(dtype=float)
    pred = np.asarray(test_pred, dtype=float)
    err = pred - actual
    mape = float(mean_absolute_percentage_error(actual, pred) * 100)
    mae = float(mean_absolute_error(actual, pred))

    backtest = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "actual_kwh": round(float(a), 2),
            "predicted_kwh": round(float(p), 2),
            "error_kwh": round(float(e), 2),
            "abs_pct_error": round(float(abs(e) / max(a, 1.0) * 100), 2),
        }
        for d, a, p, e in zip(test["date"], actual, pred, err)
    ]

    # Future forecast: unknown production/temp → use typical value for that weekday
    prod_by_dow = _dow_lookup(site["production_units"], site["dow"])
    temp_by_dow = _dow_lookup(site["temp_c"], site["dow"])

    history_kwh = site[TARGET].tolist()
    last_date = site["date"].iloc[-1]
    future: list[dict[str, Any]] = []
    for i in range(1, horizon + 1):
        day = last_date + pd.Timedelta(days=i)
        dow = int(day.dayofweek)
        row = {
            "production_units": prod_by_dow[dow],
            "temp_c": temp_by_dow[dow],
            "dow": dow,
            "lag1": history_kwh[-1],
            "lag7": history_kwh[-7] if len(history_kwh) >= 7 else history_kwh[-1],
        }
        yhat = float(model.predict(pd.DataFrame([row])[FEATURES])[0])
        yhat = max(yhat, 0.0)
        future.append({"date": day.strftime("%Y-%m-%d"), "electricity_kwh": round(yhat, 2)})
        history_kwh.append(yhat)

    importance = {
        name: round(float(v), 3) for name, v in zip(FEATURES, model.feature_importances_)
    }

    return {
        "site_id": site_id,
        "site_name": str(site["site_name"].iloc[-1]),
        "model": "GradientBoostingRegressor",
        "features": FEATURES,
        "feature_importance": importance,
        "mape_pct": round(mape, 2),
        "mae_kwh": round(mae, 1),
        "avg_error_kwh": round(float(np.mean(err)), 1),
        "backtest_days": backtest_days,
        "horizon_days": horizon,
        "backtest": backtest,
        "forecast": future,
    }


def run_forecast_eval(site_id: str = "S1") -> dict[str, Any]:
    df = pd.read_json(GOLD / "daily_site_energy.json")
    return build_site_forecast(df, site_id=site_id)


if __name__ == "__main__":
    out = run_forecast_eval()
    print(
        {
            "site_id": out["site_id"],
            "model": out["model"],
            "mape_pct": out["mape_pct"],
            "mae_kwh": out["mae_kwh"],
            "importance": out["feature_importance"],
            "n_backtest": len(out["backtest"]),
            "n_forecast": len(out["forecast"]),
        }
    )
