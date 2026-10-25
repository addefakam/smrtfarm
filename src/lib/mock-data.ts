/**
 * Mock data for the Precision Farming Ecosystem dashboard.
 * Simulates the data that would come from PostGIS + Firebase in production.
 *
 * v1.2 expansion:
 *  - NPK sensor readings per parcel (N, P, K, pH, EC, soil moisture, soil temp, air humidity)
 *  - Weather data per AOI (T_max/min, RH, wind, solar_rad, rain, ET₀)
 *  - UAV mission metadata + shapefile metadata per parcel
 *  - Spectral reflectance per parcel (Blue, Green, Red, NIR, RE, SWIR1)
 *  - Yield feature contributions for XGBoost interpretability
 *
 * Reproducible mock data — seeded random ensures the dashboard
 * looks the same on every render.
 */

export type SiteId = "bishoftu" | "asella" | "ambo";

export interface WeatherData {
  date: string;
  t_max: number;    // °C
  t_min: number;    // °C
  t_mean: number;   // °C
  rh: number;       // %
  wind_speed: number;  // m/s
  solar_rad: number;   // MJ/m²/day
  rain: number;        // mm
  et0: number;         // mm/day (FAO-56 Penman-Monteith)
}

export interface Site {
  id: SiteId;
  name: string;
  fullName: string;
  lat: number;
  lon: number;
  elevation: number;
  region: string;
  zone: string;
  phase: string;
  parcelCount: number;
  totalAreaHa: number;
  meanMoisture: number;
  meanNdvi: number;
  diseaseRisk: number;
  yieldForecast: number;
  activeAlerts: number;
  weatherToday: WeatherData;
  weather7d: WeatherData[];
}

export type ParcelStatus =
  | "healthy"
  | "watch"
  | "irrigate"
  | "disease"
  | "low_yield";

export interface YieldFeatures {
  ndvi_contribution: number;
  ndre_contribution: number;
  soil_N_contribution: number;
  soil_P_contribution: number;
  soil_K_contribution: number;
  disease_contribution: number; // typically negative
  weather_contribution: number;
}

export interface Parcel {
  id: string;
  siteId: SiteId;
  parcelCode: string;
  owner: string;
  areaHa: number;
  sowingDate: string;
  growthStage: string;
  cultivar: string;

  // ── NPK sensor readings (in-situ) ──
  soilN: number;        // ppm
  soilP: number;        // ppm (Olsen)
  soilK: number;        // ppm (exchangeable)
  soilPh: number;       // pH
  soilEc: number;       // dS/m
  soilMoisture: number; // %
  soilTemp: number;     // °C
  humidity: number;     // % (air humidity at sensor)

  // ── Spectral reflectance per band (0-1) ──
  spectralBlue: number;
  spectralGreen: number;
  spectralRed: number;
  spectralNIR: number;
  spectralRE: number;     // red edge
  spectralSWIR1: number;

  // ── Derived vegetation indices ──
  ndvi: number;
  ndre: number;
  ndmi: number;
  gndvi: number;
  savi: number;
  lai: number;  // empirical

  // ── Disease (from M2 UAV inference) ──
  diseaseSeverity: number; // 0-100 %
  diseaseClass: string | null;

  // ── Yield (from M5 IWCYES) ──
  yieldForecast: number;  // t/ha
  yieldFeatures: YieldFeatures;

  // ── Irrigation (from M4 IWSS — FAO-56) ──
  lastIrrigationDays: number;
  irrigationAdvisoryMm: number;
  soilWaterDepletion: number;  // mm
  currentKc: number;            // crop coefficient
  currentKcb: number;           // basal crop coefficient

  // ── UAV mission metadata ──
  uavLastMission: string;
  uavImageCount: number;
  uavBands: string[];
  shapefileVerified: boolean;
  parcelShape: "rect" | "irregular" | "triangle";

  status: ParcelStatus;
  ndviTrend7d: number[];
  moistureTrend7d: number[];
  humidityTrend7d: number[];
}

// ─── Sites with weather data ─────────────────────────────────────
function generateWeather(siteId: SiteId, dayOffset = 0): WeatherData {
  // Each AOI has different baseline climate
  const baseT: Record<SiteId, { max: number; min: number; rh: number }> = {
    bishoftu: { max: 27, min: 12, rh: 58 },  // warmer, drier
    asella:   { max: 22, min: 8,  rh: 68 },  // cooler, wetter
    ambo:     { max: 24, min: 10, rh: 62 },  // mid
  };
  const b = baseT[siteId];
  const seed = siteId.charCodeAt(0) * 31 + dayOffset * 7;
  const rng = mulberry32(seed);
  const t_max = Math.round((b.max + (rng() - 0.5) * 4) * 10) / 10;
  const t_min = Math.round((b.min + (rng() - 0.5) * 3) * 10) / 10;
  const t_mean = Math.round(((t_max + t_min) / 2) * 10) / 10;
  const rh = Math.round(b.rh + (rng() - 0.5) * 12);
  const wind_speed = Math.round((1.5 + rng() * 2.5) * 10) / 10;
  const solar_rad = Math.round((18 + rng() * 6) * 10) / 10;
  const rain = rng() < 0.25 ? Math.round(rng() * 12 * 10) / 10 : 0;
  // Simplified FAO-56 ET₀ (mm/day)
  const et0 = Math.round((0.0023 * solar_rad * (t_mean + 17.8) * Math.sqrt(t_max - t_min)) * 10) / 10;

  const today = new Date();
  today.setDate(today.getDate() - dayOffset);
  return {
    date: today.toISOString().slice(0, 10),
    t_max, t_min, t_mean, rh, wind_speed, solar_rad, rain, et0,
  };
}

export const SITES: Site[] = (() => {
  const sites: Site[] = [];
  const siteMeta: Array<Omit<Site, "weatherToday" | "weather7d">> = [
    {
      id: "bishoftu", name: "Bishoftu ARC", fullName: "Bishoftu Agricultural Research Center",
      lat: 8.7347, lon: 39.0085, elevation: 1920, region: "Oromia", zone: "East Shewa",
      phase: "Phase 1 — Pilot Build", parcelCount: 32, totalAreaHa: 58.4,
      meanMoisture: 34, meanNdvi: 0.71, diseaseRisk: 11, yieldForecast: 4.3, activeAlerts: 7,
    },
    {
      id: "asella", name: "Asella AERC", fullName: "Asella Agricultural Engineering Research Center",
      lat: 7.9500, lon: 39.1170, elevation: 2430, region: "Oromia", zone: "Arsi",
      phase: "Phase 2 — Replication", parcelCount: 28, totalAreaHa: 51.2,
      meanMoisture: 41, meanNdvi: 0.74, diseaseRisk: 8, yieldForecast: 4.6, activeAlerts: 4,
    },
    {
      id: "ambo", name: "Ambo ARC", fullName: "Ambo Agricultural Research Center",
      lat: 8.9500, lon: 37.8667, elevation: 2225, region: "Oromia", zone: "West Shewa",
      phase: "Phase 2 — Replication", parcelCount: 24, totalAreaHa: 42.8,
      meanMoisture: 29, meanNdvi: 0.68, diseaseRisk: 14, yieldForecast: 4.0, activeAlerts: 5,
    },
  ];
  for (const s of siteMeta) {
    sites.push({
      ...s,
      weatherToday: generateWeather(s.id, 0),
      weather7d: Array.from({ length: 7 }, (_, i) => generateWeather(s.id, 6 - i)),
    });
  }
  return sites;
})();

// ─── Ethiopia SVG outline (schematic) ───────────────────────────
export const ETHIOPIA_OUTLINE: [number, number][] = [
  [33.0, 5.0], [35.0, 4.5], [37.5, 3.5], [40.5, 3.7], [42.0, 4.5],
  [44.0, 4.5], [45.5, 5.5], [47.5, 7.5], [48.0, 9.0], [47.5, 11.0],
  [46.5, 12.5], [44.5, 13.5], [43.5, 11.5], [42.5, 11.5], [41.5, 12.0],
  [40.0, 14.5], [39.0, 14.5], [38.5, 13.5], [37.5, 12.0], [36.5, 11.5],
  [35.5, 11.0], [35.0, 10.0], [34.0, 9.0], [33.5, 7.5], [33.0, 6.0],
];

// ─── PRNG (mulberry32) ───────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SURNAMES = ["Tadesse", "Bekele", "Haile", "Girmay", "Alemu", "Tesfaye", "Assefa", "Gebre", "Mekonnen", "Desta", "Solomon", "Yohannes", "Berhe", "Kifle", "Negash", "Wolde", "Arega", "Hailu", "Tesemma", "Mulu"];
const FIRST_NAMES = ["Bekele", "Abebe", "Dawit", "Selam", "Meriem", "Yonas", "Hanna", "Robel", "Saba", "Nahom", "Rahel", "Filmon", "Selamawit", "Mussie", "Helen", "Samuel", "Lidia", "Biniam", "Nardos", "Eyob"];
const CULTIVARS = ["Danda'a", "Hidase", "Ogolcho", "Kakaba", "Fentale", "ET-13A2", "Boohai", "Picaflor"];

function randomOwner(rng: () => number): string {
  return `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${SURNAMES[Math.floor(rng() * SURNAMES.length)]}`;
}

const GROWTH_STAGES = ["Germination", "Tillering", "Stem extension", "Booting", "Heading", "Flowering", "Milk", "Dough", "Ripening"];
const DISEASE_CLASSES = ["Yellow rust", "Stem rust", "Leaf rust", "Powdery mildew", "Septoria leaf blotch", "Tan spot", null, null, null, null, null];

function generateParcels(): Parcel[] {
  const allParcels: Parcel[] = [];
  SITES.forEach((site, siteIdx) => {
    const rng = mulberry32(siteIdx * 1000 + 42);
    for (let i = 0; i < site.parcelCount; i++) {
      const code = `${site.id.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`;

      // ── NPK sensor readings ──
      const soilN = Math.round((10 + rng() * 80) * 10) / 10;  // 10-90 ppm
      const soilP = Math.round((5 + rng() * 35) * 10) / 10;  // 5-40 ppm (Olsen)
      const soilK = Math.round((80 + rng() * 350) * 10) / 10; // 80-430 ppm
      const soilPh = Math.round((5.5 + rng() * 1.8) * 10) / 10; // 5.5-7.3
      const soilEc = Math.round((0.2 + rng() * 1.5) * 100) / 100; // 0.2-1.7 dS/m
      const soilMoisture = Math.round((15 + rng() * 35) * 10) / 10;
      const soilTemp = Math.round((18 + rng() * 8) * 10) / 10;
      const humidity = Math.round((45 + rng() * 40)); // 45-85%

      // ── Spectral reflectance (per band) ──
      const spectralBlue = Math.round((0.04 + rng() * 0.08) * 1000) / 1000;
      const spectralGreen = Math.round((0.06 + rng() * 0.10) * 1000) / 1000;
      const spectralRed = Math.round((0.03 + rng() * 0.08) * 1000) / 1000;
      const spectralNIR = Math.round((0.35 + rng() * 0.35) * 1000) / 1000;
      const spectralRE = Math.round((0.20 + rng() * 0.20) * 1000) / 1000;
      const spectralSWIR1 = Math.round((0.10 + rng() * 0.20) * 1000) / 1000;

      // ── Derived vegetation indices ──
      const ndvi = Math.round(((spectralNIR - spectralRed) / (spectralNIR + spectralRed)) * 100) / 100;
      const ndre = Math.round(((spectralNIR - spectralRE) / (spectralNIR + spectralRE)) * 100) / 100;
      const ndmi = Math.round(((spectralNIR - spectralSWIR1) / (spectralNIR + spectralSWIR1)) * 100) / 100;
      const gndvi = Math.round(((spectralNIR - spectralGreen) / (spectralNIR + spectralGreen)) * 100) / 100;
      const savi = Math.round((((spectralNIR - spectralRed) / (spectralNIR + spectralRed + 0.5)) * 1.5) * 100) / 100;
      const lai = Math.round((Math.max(0, ndvi) * 5.5) * 10) / 10;

      // ── Disease ──
      const diseaseSeverity = rng() < 0.25 ? Math.round(rng() * 35) : 0;
      const diseaseClass = diseaseSeverity > 5
        ? DISEASE_CLASSES[Math.floor(rng() * 6)]
        : null;

      // ── Yield forecast with feature contributions ──
      const yieldForecast = Math.round((2.8 + rng() * 2.4 + (ndvi - 0.5) * 1.5 - diseaseSeverity * 0.02) * 10) / 10;

      // Feature contributions for XGBoost interpretability (sum to ~yieldForecast - 3.5 baseline)
      const baselineYield = 3.5;
      const totalContribution = yieldForecast - baselineYield;
      // Weight allocation
      const weights = {
        ndvi: 0.30, ndre: 0.12, soilN: 0.18, soilP: 0.08, soilK: 0.10,
        disease: -diseaseSeverity * 0.015, weather: 0.15,
      };
      const weightsTotal = Math.abs(weights.ndvi) + Math.abs(weights.ndre) + Math.abs(weights.soilN) +
        Math.abs(weights.soilP) + Math.abs(weights.soilK) + Math.abs(weights.disease) + Math.abs(weights.weather);
      const scale = totalContribution / weightsTotal;
      const yieldFeatures: YieldFeatures = {
        ndvi_contribution: Math.round((weights.ndvi * scale + (ndvi - 0.6) * 1.0) * 100) / 100,
        ndre_contribution: Math.round((weights.ndre * scale + (ndre - 0.25) * 0.5) * 100) / 100,
        soil_N_contribution: Math.round((weights.soilN * scale + (soilN - 40) * 0.005) * 100) / 100,
        soil_P_contribution: Math.round((weights.soilP * scale + (soilP - 15) * 0.01) * 100) / 100,
        soil_K_contribution: Math.round((weights.soilK * scale + (soilK - 200) * 0.001) * 100) / 100,
        disease_contribution: Math.round(weights.disease * 100) / 100,
        weather_contribution: Math.round((weights.weather * scale + (site.weatherToday.et0 - 4) * 0.05) * 100) / 100,
      };

      // ── Irrigation ──
      const lastIrrigationDays = Math.floor(rng() * 8);
      const soilWaterDepletion = Math.round((20 + (35 - soilMoisture) * 1.5 + lastIrrigationDays * 1.2) * 10) / 10;
      const currentKc = Math.round((0.4 + rng() * 0.65) * 100) / 100; // 0.4-1.05
      const currentKcb = Math.round((currentKc - 0.05 - rng() * 0.1) * 100) / 100;
      let irrigationAdvisoryMm = 0;
      if (soilMoisture < 25) irrigationAdvisoryMm = 15 + Math.floor(rng() * 10);
      else if (soilMoisture < 32 && lastIrrigationDays > 4) irrigationAdvisoryMm = 8 + Math.floor(rng() * 8);

      // ── UAV mission ──
      const uavDay = Math.floor(rng() * 9);
      const uavDate = new Date();
      uavDate.setDate(uavDate.getDate() - uavDay);
      const uavLastMission = uavDate.toISOString().slice(0, 10);
      const uavImageCount = Math.floor(50 + rng() * 250);
      const uavBands = rng() > 0.3 ? ["RGB", "MS", "Thermal"] : ["RGB", "MS"];
      const shapefileVerified = rng() > 0.1;
      const parcelShape = (["rect", "irregular", "triangle"] as const)[Math.floor(rng() * 3)];

      // ── Status ──
      let status: ParcelStatus = "healthy";
      if (diseaseSeverity > 15) status = "disease";
      else if (irrigationAdvisoryMm > 10) status = "irrigate";
      else if (yieldForecast < 3.2) status = "low_yield";
      else if (soilMoisture < 32 || ndvi < 0.6) status = "watch";

      // ── 7-day trends ──
      const ndviTrend7d = Array.from({ length: 7 }, (_, k) => {
        const drift = (rng() - 0.5) * 0.04;
        return Math.round((ndvi - drift * (7 - k)) * 100) / 100;
      });
      const moistureTrend7d = Array.from({ length: 7 }, (_, k) => {
        const drift = (rng() - 0.4) * 4;
        return Math.round(soilMoisture - drift * (7 - k) * 0.4);
      });
      const humidityTrend7d = Array.from({ length: 7 }, (_, k) => {
        const drift = (rng() - 0.3) * 8;
        return Math.round(humidity - drift * (7 - k) * 0.3);
      });

      allParcels.push({
        id: `${site.id}-${i + 1}`,
        siteId: site.id,
        parcelCode: code,
        owner: randomOwner(rng),
        areaHa: Math.round((0.5 + rng() * 3) * 10) / 10,
        sowingDate: `2026-${6 + Math.floor(rng() * 2)}-${1 + Math.floor(rng() * 28)}`,
        growthStage: GROWTH_STAGES[Math.floor(rng() * GROWTH_STAGES.length)],
        cultivar: CULTIVARS[Math.floor(rng() * CULTIVARS.length)],
        soilN, soilP, soilK, soilPh, soilEc, soilMoisture, soilTemp, humidity,
        spectralBlue, spectralGreen, spectralRed, spectralNIR, spectralRE, spectralSWIR1,
        ndvi, ndre, ndmi, gndvi, savi, lai,
        diseaseSeverity, diseaseClass,
        yieldForecast, yieldFeatures,
        lastIrrigationDays, irrigationAdvisoryMm, soilWaterDepletion, currentKc, currentKcb,
        uavLastMission, uavImageCount, uavBands, shapefileVerified, parcelShape,
        status,
        ndviTrend7d, moistureTrend7d, humidityTrend7d,
      });
    }
  });
  return allParcels;
}

export const ALL_PARCELS: Parcel[] = generateParcels();

// ─── Helpers ──────────────────────────────────────────────────────
export function getParcelsBySite(siteId: SiteId): Parcel[] {
  return ALL_PARCELS.filter(p => p.siteId === siteId);
}

export function getAttentionRanking(siteId: SiteId, limit = 8): Parcel[] {
  const statusWeight: Record<ParcelStatus, number> = {
    disease: 4, irrigate: 3, low_yield: 2, watch: 1, healthy: 0,
  };
  return getParcelsBySite(siteId)
    .slice()
    .sort((a, b) => {
      const sa = statusWeight[a.status] * 100 + a.diseaseSeverity + (a.irrigationAdvisoryMm / 2);
      const sb = statusWeight[b.status] * 100 + b.diseaseSeverity + (b.irrigationAdvisoryMm / 2);
      return sb - sa;
    })
    .slice(0, limit);
}

export function getSiteKPIs(siteId: SiteId) {
  const parcels = getParcelsBySite(siteId);
  const totalArea = parcels.reduce((s, p) => s + p.areaHa, 0);
  const meanMoisture = parcels.reduce((s, p) => s + p.soilMoisture, 0) / parcels.length;
  const meanNdvi = parcels.reduce((s, p) => s + p.ndvi, 0) / parcels.length;
  const meanYield = parcels.reduce((s, p) => s + p.yieldForecast, 0) / parcels.length;
  const diseaseParcels = parcels.filter(p => p.diseaseSeverity > 5).length;
  const irrigateParcels = parcels.filter(p => p.irrigationAdvisoryMm > 0).length;
  const activeAlerts = parcels.filter(p => p.status !== "healthy").length;
  return {
    totalParcels: parcels.length,
    totalArea,
    meanMoisture,
    meanNdvi,
    meanYield,
    diseaseParcels,
    irrigateParcels,
    activeAlerts,
    diseaseRisk: Math.round((diseaseParcels / parcels.length) * 100),
  };
}

// ─── Disease distribution (per site) ─────────────────────────────
export function getDiseaseDistribution(siteId: SiteId): Array<{ class: string; count: number; avgSeverity: number }> {
  const parcels = getParcelsBySite(siteId);
  const byClass: Record<string, Parcel[]> = {};
  for (const p of parcels) {
    if (!p.diseaseClass) continue;
    if (!byClass[p.diseaseClass]) byClass[p.diseaseClass] = [];
    byClass[p.diseaseClass].push(p);
  }
  return Object.entries(byClass).map(([cls, ps]) => ({
    class: cls,
    count: ps.length,
    avgSeverity: Math.round(ps.reduce((s, p) => s + p.diseaseSeverity, 0) / ps.length),
  })).sort((a, b) => b.count - a.count);
}

// ─── Status colors ─────────────────────────────────────────────────
export const STATUS_COLORS: Record<ParcelStatus, { bg: string; text: string; ring: string; label: string }> = {
  healthy:   { bg: "bg-emerald-500",   text: "text-emerald-700",   ring: "ring-emerald-200",   label: "Healthy" },
  watch:     { bg: "bg-amber-500",    text: "text-amber-700",     ring: "ring-amber-200",     label: "Watch" },
  irrigate:  { bg: "bg-blue-500",     text: "text-blue-700",      ring: "ring-blue-200",      label: "Irrigate" },
  disease:   { bg: "bg-rose-500",     text: "text-rose-700",      ring: "ring-rose-200",      label: "Disease" },
  low_yield: { bg: "bg-orange-500",   text: "text-orange-700",    ring: "ring-orange-200",    label: "Low yield" },
};

// ─── Sidebar module IDs ──────────────────────────────────────────
export type ModuleId =
  | "overview"
  | "map"
  | "yield"
  | "irrigation"
  | "disease"
  | "sensor"
  | "heatmap"
  | "input";

export interface ModuleDef {
  id: ModuleId;
  label: string;
  description: string;
  icon: string;
}

export const MODULES: ModuleDef[] = [
  { id: "overview",    label: "Overview",         description: "KPIs, AOI summary, attention ranking",       icon: "LayoutDashboard" },
  { id: "map",         label: "Map View",          description: "Leaflet map + parcel list",                icon: "MapPin" },
  { id: "yield",       label: "Yield Estimation",  description: "IWCYES — features + breakdown",             icon: "TrendingUp" },
  { id: "irrigation",  label: "Irrigation Scheduling", description: "IWSS — FAO-56 soil-water balance",     icon: "Droplets" },
  { id: "disease",    label: "Disease Detection", description: "M2 UAV — severity & class distribution",    icon: "AlertTriangle" },
  { id: "sensor",     label: "Sensor Feed",       description: "NPK probe live readings",                    icon: "Radio" },
  { id: "heatmap",    label: "Attention Heatmap", description: "Parcel grid by attention priority",          icon: "Grid3x3" },
  { id: "input",      label: "Input Data",        description: "Soil + reflectance + weather + shapefile",  icon: "Database" },
];
