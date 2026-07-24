# ⚡ Voltart

<p align="center">
  <img src="https://img.shields.io/badge/Voltart-Energy%20Analytics-f0772a?style=for-the-badge&labelColor=0e1116" alt="Voltart" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white" alt="scikit-learn" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Recharts-5b8fa8?style=flat-square" alt="Recharts" />
</p>

<p align="center">
  <b>Industrial energy cost analytics + ML load forecasting</b><br/>
  Analyst explains the bill → Forecast predicts the next 14 days
</p>

<p align="center">
  <a href="https://github.com/rajashekarakula19-spec/voltart">
    <img src="https://img.shields.io/badge/🔗_Repository-rajashekarakula19--spec%2Fvoltart-171b22?style=for-the-badge&labelColor=f0772a" alt="Repository" />
  </a>
  &nbsp;
  <a href="http://localhost:3000">
    <img src="https://img.shields.io/badge/🖥_Local_App-localhost%3A3000-0e1116?style=for-the-badge&labelColor=5b8fa8" alt="Local app" />
  </a>
</p>

---

## 🔗 Links

| | |
|---|---|
| 🧡 **Repository** | [github.com/rajashekarakula19-spec/voltart](https://github.com/rajashekarakula19-spec/voltart) |
| 🩵 **Local app** | [http://localhost:3000](http://localhost:3000) |
| 📊 **Analyst** | [http://localhost:3000/app/analyst](http://localhost:3000/app/analyst) |
| 📈 **Forecast** | [http://localhost:3000/app/forecast](http://localhost:3000/app/forecast) |
| 💚 **API health** | [http://localhost:8000/health](http://localhost:8000/health) |

> Want a **public live demo** URL? Ask and we can deploy it.

---

## ✨ What it does

<table>
  <tr>
    <td width="50%" valign="top">

### 🧡 Analyst
Explain the bill you already got

- 30-day **budget vs actual**
- Demand charges & cost composition
- Site comparison + invoices
- Recommended actions

</td>
    <td width="50%" valign="top">

### 🩵 Forecast
Predict what happens next

- **GradientBoosting** load model
- Actual vs predicted backtest
- MAPE / kWh error KPIs
- Next **14-day** kWh forecast

</td>
  </tr>
</table>

---

## 🛠 Tech stack

<p>
  <img src="https://img.shields.io/badge/Frontend-Next.js%20·%20React%20·%20TS%20·%20Tailwind%20·%20Recharts-5b8fa8?style=for-the-badge&labelColor=0e1116" alt="Frontend" />
  <br/><br/>
  <img src="https://img.shields.io/badge/Backend%20%2F%20ML-FastAPI%20·%20scikit--learn%20GBR%20·%20pipeline-f0772a?style=for-the-badge&labelColor=0e1116" alt="Backend" />
  <br/><br/>
  <img src="https://img.shields.io/badge/Data%20%26%20tests-pandas%20·%20NumPy%20·%20PyArrow%20·%20pytest-3dba86?style=for-the-badge&labelColor=0e1116" alt="Data" />
</p>

**Frontend:** Next.js, React, TypeScript, Tailwind CSS, Recharts, Framer Motion  

**Backend / ML:** FastAPI, Uvicorn, scikit-learn (GradientBoostingRegressor), Python pipeline  

**Data & tests:** Pandas, NumPy, PyArrow, pytest, Git  

---

## 📁 Project layout

```text
voltart/
├── 🌐 web/          Next.js UI (landing + Analyst + Forecast)
├── 🔌 api/          FastAPI endpoints
├── 🏭 pipeline/     Synthetic industrial data → gold tables
├── 🤖 models/       GradientBoosting load forecast
├── 📦 data/gold/    Generated fixtures (JSON)
└── ✅ tests/        pytest pass/fail checks
```

---

## 🚀 Quick start

```bash
# 1) Python deps + generate data
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. python -m pipeline.generate_data

# 2) API
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000

# 3) Web (new terminal)
cd web && npm install && npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — the web app proxies API calls via `/backend/*`.

### 🐳 Docker (optional)

```bash
docker compose up --build
```

---

## ✅ Tests

```bash
source .venv/bin/activate
PYTHONPATH=. python -m pipeline.generate_data
pytest -q
```

Fixtures live in `data/gold/expected.json` (known anomaly dates, unit checks).

---

## 📝 Data note

Demo uses **synthetic** plant meters, tariffs, production, and invoices shaped like real industrial feeds. Open sources (EIA / BDG2) can replace layers later.

---

## 🎨 Brand

| Token | Hex | Role |
|---|---|---|
| Gunmetal | `#0e1116` | Background |
| Steel | `#5b8fa8` | Charts / secondary |
| Molten | `#f0772a` | Accent / CTAs |
| Success | `#3dba86` | Under-budget / PASS |

---

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-3dba86?style=for-the-badge&labelColor=0e1116" alt="MIT" />
  <br/>
  <sub>Built for portfolio · industrial energy analytics</sub>
</p>
