# Precision Farming Ecosystem for Irrigated Wheat

**Remote-sensing-enabled decision-support system for Ethiopian wheat farming — pilot deployment at Bishoftu, Asella, and Ambo Agricultural Research Centers (EIAR).**

![Status](https://img.shields.io/badge/status-v1.1--repo--anchored-baseline-brightgreen)
![License](https://img.shields.io/badge/license-CC0%201.0-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%7C%20TypeScript%20%7C%20Tailwind%204%20%7C%20shadcn%2Fui-emerald)

This repository is the canonical source-of-truth codebase for the Precision Farming Ecosystem project. The current release (`v1.1 — repo-anchored baseline`) delivers a fully working **dashboard MVP** with mock data — interactive map of the three pilot sites, parcel-level attention heatmap, irrigation advisory panel, and per-parcel drill-down. The dashboard is deployable to Render (or any container runtime) end-to-end.

## Live Demo

The dashboard is deployed on Render at:

> **https://precision-farming-dashboard.onrender.com** _(replace with your actual Render URL after deploy)_

## Project Origin

The full implementation plan (40 pages, technical/engineering style, includes Gantt + budget + risk register + architecture diagrams) is available at:

- `docs/Precision_Farming_Implementation_Plan.pdf` — implementation plan v1.1
- `docs/charts/` — architecture diagrams, Gantt, budget, risk heatmap, deployment topology, repo structure

## Tech Stack

| Layer | Component |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript 5, React 19) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Icons | Lucide React |
| Map | Inline SVG (Ethiopia outline + AOI markers) — no external map libraries or API keys required |
| Deployment | Render Blueprint (`render.yaml`) or Docker (`Dockerfile`) |
| License | CC0 1.0 Universal (Public Domain Dedication) |

## Six-Module Architecture

The dashboard is **M6 — Decision-Support Dashboard** in the project's six-module architecture:

1. **M1 Spatial Database** (PostGIS + shapefile ingestion)
2. **M2 UAV Disease Early Detection** (PyTorch + EfficientNet)
3. **M3 Vegetation Index Computation Service** (Sentinel-2 + UAV)
4. **M4 IWSS — Irrigation Water Scheduling Service** (FAO-56 ET₀ + soil-water balance)
5. **M5 IWCYES — Yield Estimation System** (XGBoost + indices + soil + disease + weather)
6. **M6 Decision-Support Dashboard** ← **this repository (current release)**

In v1.1, M6 runs on mock data representing the three AOIs. Integration with M1 (live PostGIS), M2 (live disease events), and M4 (live irrigation advisories) is the Phase-2 evolution.

## Pilot Sites

| Site | Latitude | Longitude | Elevation | Phase |
|---|---|---|---|---|
| Bishoftu ARC | 8.7347°N | 39.0085°E | 1,920 m | Phase 1 — Pilot build |
| Asella AERC | 7.9500°N | 39.1170°E | 2,430 m | Phase 2 — Replication |
| Ambo ARC | 8.9500°N | 37.8667°E | 2,225 m | Phase 2 — Replication |

All three sites fall under the **Ethiopian Institute of Agricultural Research (EIAR)**.

## Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start
```

## Deploy to Render

### Option A — Render Blueprint (recommended)

1. Push this repo to GitHub: `https://github.com/DivergenTechnology/smartfarming-ecosystem`
2. Go to **https://dashboard.render.com/select-blueprint**
3. Select the GitHub repo — Render reads `render.yaml` and provisions the service automatically
4. (Optional) Set `NODE_VERSION` if different from default

### Option B — Docker

```bash
docker build -t precision-farming-dashboard .
docker run -p 3000:3000 -e PORT=3000 precision-farming-dashboard
```

### Option C — Manual Render web service

1. Create a new **Web Service** on Render, connect the GitHub repo
2. Runtime: **Node**
3. Build command: `npm install --legacy-peer-deps && npm run build`
4. Start command: `npm run start`
5. Health check path: `/`

## Dashboard Features (M6 — v1.1)

- **AOI selector** — switch between Bishoftu, Asella, Ambo (changes entire dashboard context)
- **Interactive Ethiopia map** — SVG with 3 AOI markers, pulsing for active alerts, click to select
- **KPI cards** — parcel count, active alerts, mean moisture, disease risk, yield forecast
- **Attention ranking** — top 8 most-urgent parcels per AOI (disease → irrigate → low yield → watch → healthy)
- **Parcel status heatmap grid** — visual scan for high-priority parcels
- **Per-parcel drill-down** — soil moisture progress bar, NDVI progress bar, 7-day sparklines, disease panel, yield forecast, irrigation advisory
- **Irrigation advisory panel** — today's recommendations with water volume (mm + m³)
- **Module status panel** — health of all 6 system modules (operational / degraded / down)
- **Responsive** — mobile-first, works on phone/tablet/desktop

## Project Roadmap

| Phase | Months | Status |
|---|---|---|
| Phase 1 — Pilot build at Bishoftu | 1–9 | In progress (dashboard MVP done) |
| Phase 2 — Replication to Asella + Ambo | 10–15 | Planned |
| Phase 3 — Stabilization & handover | 16–18 | Planned |

See `docs/Precision_Farming_Implementation_Plan.pdf` for full Gantt, milestone gates, and acceptance criteria.

## License

CC0 1.0 Universal — see [`LICENSE`](./LICENSE). Public domain dedication.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Conventional commits (feat/fix/docs/refactor/chore/test) are enforced via PR template; main branch is protected with required CI passing.

## Sponsors

- **Ethiopian Institute of Agricultural Research (EIAR)** — project sponsor and pilot-site host
- **Divergen Technology** — engineering lead and repository maintainer
