# Precision Farming Ecosystem for Irrigated Wheat

**Remote-sensing-enabled decision-support system for Ethiopian wheat farming — pilot deployment at Bishoftu, Asella, and Ambo Agricultural Research Centers (EIAR).**

![Status](https://img.shields.io/badge/status-v1.6.2--live-brightgreen)
![License](https://img.shields.io/badge/license-CC0%201.0-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%7C%20TypeScript%20%7C%20Tailwind%204%20%7C%20shadcn%2Fui-emerald)
![Deploy](https://img.shields.io/badge/deploy-Vercel%20%2B%20Render-blueviolet)

This repository is the canonical source-of-truth codebase for the Precision Farming Ecosystem project. The current release (`v1.6.1`) delivers a working **dashboard with 9 modules** — interactive Leaflet map, live NPK sensor feed with auto-detected interventions, disease knowledge base + inference engine + voice agent (TTS), input data ingestion (soil + reflectance + weather + shapefile), and parcel-level drill-down.

The dashboard deploys to **Vercel (recommended, native Next.js)** or **Render (alternative)** end-to-end.

## Live Demo

The dashboard deploys to either:

- **Vercel** (recommended): `https://smrtfarm.vercel.app` _(replace with your actual Vercel URL after deploy)_
- **Render** (alternative): `https://smrtfarm.onrender.com` _(replace with your actual Render URL after deploy)_

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
| Map | Leaflet 1.9 + react-leaflet 5 (OpenStreetMap basemap, no API key required) |
| Charts | Recharts 2.15 |
| Real-time | Firebase RTDB (env-var-aware; localStorage fallback in dev) |
| Spatial DB | PostgreSQL + PostGIS (server-side stubs, env-var-aware) |
| Shapefile | `shapefile` npm package (browser-side parsing) |
| TTS | Browser SpeechSynthesis API (no API key required) |
| Deployment | **Vercel (recommended)** via `vercel.json` OR Render via `render.yaml` OR Docker via `Dockerfile` |
| License | CC0 1.0 Universal (Public Domain Dedication) |

## Nine Modules

The sidebar contains 9 modules, each a dedicated view:

1. **Overview** — KPIs + AOI map + attention ranking + live interventions + live AOI snapshot
2. **Map View** — Leaflet map + parcel list with shapefile metadata
3. **Yield Estimation** — IWCYES data-flow diagram + per-parcel yield bar chart + XGBoost XAI feature breakdown + spectral reflectance table
4. **Irrigation Scheduling** — Live weather + FAO-56 irrigation queue + per-parcel soil-water balance + live pattern tracking charts
5. **Disease Detection** — M2 UAV module + disease class distribution + KB-linked detection result + Voice Agent dialogue (TTS)
6. **Sensor Feed** — Live NPK + weather ticker + 6 live charts per parcel + per-parcel NPK table
7. **Attention Heatmap** — Color-by-metric grid (status/moisture/NDVI/disease/yield)
8. **Input Data** — 4-tab form: Soil + Reflectance + Weather + Shapefile (browser-side parsing)
9. **Disease Advisor** — Symptom multi-select + inference engine + Voice Agent dialogue

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

# Production build (Vercel native)
npm run build

# Start production server (Vercel native)
npm run start

# Standalone build (Render / Docker / on-prem)
npm run build:standalone
npm run start:standalone

# Lint
npm run lint
```

## Deploy to Vercel (Recommended)

Vercel is the **natural fit** for Next.js (Vercel created Next.js). The dashboard gets:
- Global CDN (Edge network)
- No cold starts (always warm, unlike Render free tier)
- Preview deploys per PR
- Automatic HTTPS
- ~30s cached builds

### Step 1 — Import on Vercel

1. Go to **https://vercel.com/new**
2. Sign in with GitHub (or create a free account)
3. Click **"Import Project"**
4. Select the repo: `addefakam/smrtfarm`
5. Vercel auto-detects Next.js from `vercel.json` — no config needed

### Step 2 — Configure Environment Variables (optional)

In the Vercel deploy dialog, click **"Environment Variables"** and add (all optional in MVP mode — dashboard falls back to mock data + localStorage):

| Key | Purpose | Required? |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app config | Optional (uses localStorage fallback) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Optional |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Firebase RTDB URL | Optional |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Optional |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Optional |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | Optional |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Optional |
| `DATABASE_URL` | PostgreSQL + PostGIS connection string | Optional (uses mock data fallback) |

### Step 3 — Deploy

Click **"Deploy"**. Vercel builds in ~30–60s and assigns a URL like `https://smrtfarm.vercel.app`.

### Step 4 — Verify

- Visit the URL — dashboard should load with all 9 modules
- The "Input Data" module banner shows **"Mock mode (configure Firebase)"** if Firebase env vars aren't set
- The "Sensor Feed" module shows LIVE badge with live-updating NPK charts every 3s

### Step 5 — Custom Domain (optional)

In Vercel dashboard → Settings → Domains → add your domain (e.g., `dashboard.eiar.gov.et`)

## Deploy to Render (Alternative)

Render is better for long-running services + PostGIS but has cold starts on free tier.

### Option A — Render Blueprint

1. Go to **https://dashboard.render.com/select-blueprint**
2. Connect the GitHub repo — Render reads `render.yaml` and provisions the service automatically
3. (Optional) Set env vars in Render dashboard

### Option B — Docker

```bash
docker build -t precision-farming-dashboard .
docker run -p 3000:3000 -e PORT=3000 precision-farming-dashboard
```

### Option C — Manual Render web service

1. Create a new **Web Service** on Render, connect the GitHub repo
2. Runtime: **Node**
3. Build command: `npm install --legacy-peer-deps && npm run build:standalone`
4. Start command: `npm run start:standalone`
5. Health check path: `/`

## Vercel vs Render — Which to choose?

| Criterion | Vercel | Render |
|---|---|---|
| Next.js native support | ✅ Built by Vercel | ⚠️ Generic Node |
| Build speed | ~30s cached | ~2min |
| Global CDN | ✅ Edge network | ❌ Single region |
| Cold starts | None (always warm) | ~30s on free tier |
| Preview deploys per PR | ✅ Automatic | ❌ Manual |
| Free tier | 100GB bandwidth + 100GB-hrs | 750 hrs (sleeps after 15min idle) |
| PostGIS / PostgreSQL | Use Vercel Postgres / external | ✅ Native Render Postgres |
| WebSocket support | Serverless (60s timeout) | ✅ Long-running |
| Cost to scale | Pay per invocation | Pay per instance-hour |

**Recommended architecture**:
- **Dashboard** → **Vercel** (Next.js native, fast, global CDN)
- **PostgreSQL + PostGIS** → **Render Postgres** or **Neon** (serverless Postgres with free tier) or **Supabase** (Postgres + auth + storage)
- **Firebase** → keep as-is (Google's infra)

This separation lets each service shine where it's strongest.

## Production Activation (no code changes — all env-var-driven)

The dashboard gracefully degrades when env vars aren't set:

1. **Firebase RTDB**: Set `NEXT_PUBLIC_FIREBASE_*` env vars → `useLiveSensorData` swaps `setInterval` for `onValue` real-time subscription
2. **PostgreSQL/PostGIS**: Set `DATABASE_URL` → soil/weather readings persist to PostGIS timeseries tables via `insertSoilReading()` / `insertWeatherObs()`
3. **Real UAV imagery (M2)**: Replace `parcel.diseaseClass` mock with `disease_events` table queries → KB lookup + Voice Agent dialogue activates automatically

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
- **addefakam** — engineering lead and repository maintainer
