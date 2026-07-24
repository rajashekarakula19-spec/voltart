"""Pass/fail tests for Voltart pipeline + fixtures.

Run:
  cd voltart && source .venv/bin/activate
  PYTHONPATH=. python -m pipeline.generate_data
  pytest -q
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parents[1]
GOLD = ROOT / "data" / "gold"


@pytest.fixture(scope="module")
def expected():
    path = GOLD / "expected.json"
    assert path.exists(), "Run: PYTHONPATH=. python -m pipeline.generate_data"
    return json.loads(path.read_text())


@pytest.fixture(scope="module")
def daily():
    path = GOLD / "daily_site_energy.json"
    assert path.exists()
    df = pd.read_json(path)
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    return df


@pytest.fixture(scope="module")
def summary():
    return json.loads((GOLD / "site_summary_30d.json").read_text())


def test_site_count_pass(expected, summary):
    assert len(summary) == expected["sites"]


def test_unit_conversion_pass(expected):
    assert expected["unit_checks"]["1000_kwh_to_mwh"] == pytest.approx(1000 * expected["kwh_to_mwh"])
    assert expected["unit_checks"]["10_therms_to_mmbtu"] == pytest.approx(10 * expected["therms_to_mmbtu"])


def test_known_anomalies_detected_pass(expected, daily):
    for ka in expected["known_anomalies"]:
        row = daily[(daily["site_id"] == ka["site_id"]) & (daily["date"] == ka["date"])]
        assert not row.empty, f"missing day {ka}"
        assert bool(row.iloc[0]["is_anomaly"]) is True, f"anomaly not flagged for {ka}"


def test_intensity_positive_pass(daily):
    assert (daily["intensity_kwh_per_unit"] > 0).all()


def test_cost_components_sum_pass(daily):
    # energy + demand + gas should reconcile to total within rounding
    recon = daily["energy_cost"] + daily["demand_cost"] + daily["gas_cost"]
    assert (abs(recon - daily["total_cost"]) < 0.05).all()


def test_force_fail_demo_is_disabled_pass(expected):
    """This passes when force_fail_demo is false. Flip to true to see a FAIL."""
    assert expected["force_fail_demo"] is False


def test_example_intentional_fail_documentation():
    """
    Example of a FAIL case: wrong conversion would break this.
    Kept as a commented pattern — enable to demonstrate red tests.
    """
    # wrong = 1000 * 0.01  # bad kWh→MWh
    # assert wrong == 1.0
    assert True
