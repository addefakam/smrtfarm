/**
 * Mock data for the Precision Farming Ecosystem dashboard.
 * Simulates the data that would come from PostGIS + Firebase in production.
 *
 * This is reproducible mock data — seeded random ensures the dashboard
 * looks the same on every render, but the values are realistic for
 * Ethiopian irrigated wheat at the three pilot sites.
 */

export type SiteId = "bishoftu" | "asella" | "ambo";

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
}

export type ParcelStatus =
  | "healthy"
  | "watch"
  | "irrigate"
  | "disease"
  | "low_yield";

export interface Parcel {
  id: string;
  siteId: SiteId;
  parcelCode: string;
  owner: string;
  areaHa: number;
  soilMoisture: number; // %
  soilTemp: number;     // °C
  ndvi: number;         // 0-1
  ndre: number;         // 0-1
  diseaseSeverity: number; // 0-100 %
  diseaseClass: string | null;
  yieldForecast: number;   // t/ha
  lastIrrigationDays: number; // days since last irrigation
  irrigationAdvisoryMm: number; // recommended mm today (0 = no irrigation)
  status: ParcelStatus;
  sowingDate: string;
  growthStage: string;
  ndviTrend7d: number[];  // last 7 days NDVI
  moistureTrend7d: number[]; // last 7 days moisture
}

// ─── Sites ─────────────────────────────────────────────────────────
export const SITES: Site[] = [
  {
    id: "bishoftu",
    name: "Bishoftu ARC",
    fullName: "Bishoftu Agricultural Research Center",
    lat: 8.7347,
    lon: 39.0085,
    elevation: 1920,
    region: "Oromia",
    zone: "East Shewa",
    phase: "Phase 1 — Pilot Build",
    parcelCount: 32,
    totalAreaHa: 58.4,
    meanMoisture: 34,
    meanNdvi: 0.71,
    diseaseRisk: 11,
    yieldForecast: 4.3,
    activeAlerts: 7,
  },
  {
    id: "asella",
    name: "Asella AERC",
    fullName: "Asella Agricultural Engineering Research Center",
    lat: 7.9500,
    lon: 39.1170,
    elevation: 2430,
    region: "Oromia",
    zone: "Arsi",
    phase: "Phase 2 — Replication",
    parcelCount: 28,
    totalAreaHa: 51.2,
    meanMoisture: 41,
    meanNdvi: 0.74,
    diseaseRisk: 8,
    yieldForecast: 4.6,
    activeAlerts: 4,
  },
  {
    id: "ambo",
    name: "Ambo ARC",
    fullName: "Ambo Agricultural Research Center",
    lat: 8.9500,
    lon: 37.8667,
    elevation: 2225,
    region: "Oromia",
    zone: "West Shewa",
    phase: "Phase 2 — Replication",
    parcelCount: 24,
    totalAreaHa: 42.8,
    meanMoisture: 29,
    meanNdvi: 0.68,
    diseaseRisk: 14,
    yieldForecast: 4.0,
    activeAlerts: 5,
  },
];

// ─── Ethiopia SVG outline (schematic, not survey-grade) ──────────
// Coordinates: [lon, lat] pairs; viewBox is "33 3 16 12.5"
// (longitude 33-49, latitude 3-15.5)
export const ETHIOPIA_OUTLINE: [number, number][] = [
  [33.0, 5.0], [35.0, 4.5], [37.5, 3.5], [40.5, 3.7], [42.0, 4.5],
  [44.0, 4.5], [45.5, 5.5], [47.5, 7.5], [48.0, 9.0], [47.5, 11.0],
  [46.5, 12.5], [44.5, 13.5], [43.5, 11.5], [42.5, 11.5], [41.5, 12.0],
  [40.0, 14.5], [39.0, 14.5], [38.5, 13.5], [37.5, 12.0], [36.5, 11.5],
  [35.5, 11.0], [35.0, 10.0], [34.0, 9.0], [33.5, 7.5], [33.0, 6.0],
];

// ─── Deterministic PRNG (mulberry32) ──────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Ethiopian names (for parcel owners) ──────────────────────────
const SURNAMES = [
  "Tadesse", "Bekele", "Haile", "Girmay", "Alemu", "Tesfaye", "Assefa",
  "Gebre", "Mekonnen", "Desta", "Solomon", "Yohannes", "Berhe", "Kifle",
  "Negash", "Wolde", "Arega", "Hailu", "Tesemma", "Mulu",
];
const FIRST_NAMES = [
  "Bekele", "Abebe", "Dawit", "Selam", "Meriem", "Yonas", "Hanna",
  "Robel", "Saba", "Nahom", "Rahel", "Filmon", "Selamawit", "Mussie",
  "Helen", "Samuel", "Lidia", "Biniam", "Nardos", "Eyob",
];
function randomOwner(rng: () => number, idx: number): string {
  const f = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const s = SURNAMES[Math.floor(rng() * SURNAMES.length)];
  return `${f} ${s}`;
}

// ─── Growth stages ────────────────────────────────────────────────
const GROWTH_STAGES = [
  "Germination", "Tillering", "Stem extension", "Booting",
  "Heading", "Flowering", "Milk", "Dough", "Ripening",
];

// ─── Disease classes ──────────────────────────────────────────────
const DISEASE_CLASSES = [
  "Yellow rust", "Stem rust", "Leaf rust", "Powdery mildew",
  "Septoria leaf blotch", "Tan spot", null, null, null, null, null,
];

// ─── Generate parcels per site ────────────────────────────────────
function generateParcels(): Parcel[] {
  const allParcels: Parcel[] = [];
  SITES.forEach((site, siteIdx) => {
    const rng = mulberry32(siteIdx * 1000 + 42);
    for (let i = 0; i < site.parcelCount; i++) {
      const code = `${site.id.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`;
      const soilMoisture = Math.round((15 + rng() * 35) * 10) / 10;
      const ndvi = Math.round((0.45 + rng() * 0.4) * 100) / 100;
      const ndre = Math.round((0.20 + rng() * 0.25) * 100) / 100;
      const diseaseSeverity = rng() < 0.25 ? Math.round(rng() * 35) : 0;
      const diseaseClass = diseaseSeverity > 5
        ? DISEASE_CLASSES[Math.floor(rng() * 6)]
        : null;
      const yieldForecast = Math.round((2.8 + rng() * 2.4 + (ndvi - 0.5) * 1.5) * 10) / 10;
      const lastIrrigationDays = Math.floor(rng() * 8);
      const soilTemp = Math.round((18 + rng() * 8) * 10) / 10;

      // Irrigation advisory: if moisture < 25% OR last irrigation > 5 days, recommend
      let advisoryMm = 0;
      if (soilMoisture < 25) advisoryMm = 15 + Math.floor(rng() * 10);
      else if (soilMoisture < 32 && lastIrrigationDays > 4) advisoryMm = 8 + Math.floor(rng() * 8);

      // Status flag
      let status: ParcelStatus = "healthy";
      if (diseaseSeverity > 15) status = "disease";
      else if (advisoryMm > 10) status = "irrigate";
      else if (yieldForecast < 3.2) status = "low_yield";
      else if (soilMoisture < 32 || ndvi < 0.6) status = "watch";

      // 7-day trend
      const ndviTrend7d = Array.from({ length: 7 }, (_, k) => {
        const drift = (rng() - 0.5) * 0.04;
        return Math.round((ndvi - drift * (7 - k)) * 100) / 100;
      });
      const moistureTrend7d = Array.from({ length: 7 }, (_, k) => {
        const drift = (rng() - 0.4) * 4;
        return Math.round(soilMoisture - drift * (7 - k) * 0.4);
      });

      allParcels.push({
        id: `${site.id}-${i + 1}`,
        siteId: site.id,
        parcelCode: code,
        owner: randomOwner(rng, i),
        areaHa: Math.round((0.5 + rng() * 3) * 10) / 10,
        soilMoisture,
        soilTemp,
        ndvi,
        ndre,
        diseaseSeverity,
        diseaseClass,
        yieldForecast,
        lastIrrigationDays,
        irrigationAdvisoryMm: advisoryMm,
        status,
        sowingDate: `2026-${6 + Math.floor(rng() * 2)}-${1 + Math.floor(rng() * 28)}`,
        growthStage: GROWTH_STAGES[Math.floor(rng() * GROWTH_STAGES.length)],
        ndviTrend7d,
        moistureTrend7d,
      });
    }
  });
  return allParcels;
}

export const ALL_PARCELS: Parcel[] = generateParcels();

// ─── Helper: get parcels by site ──────────────────────────────────
export function getParcelsBySite(siteId: SiteId): Parcel[] {
  return ALL_PARCELS.filter(p => p.siteId === siteId);
}

// ─── Helper: get attention ranking (top N most-urgent parcels) ──
export function getAttentionRanking(siteId: SiteId, limit = 8): Parcel[] {
  const statusWeight: Record<ParcelStatus, number> = {
    disease: 4,
    irrigate: 3,
    low_yield: 2,
    watch: 1,
    healthy: 0,
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

// ─── Helper: get KPI summary for a site ───────────────────────────
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

// ─── Status color mapping ─────────────────────────────────────────
export const STATUS_COLORS: Record<ParcelStatus, { bg: string; text: string; ring: string; label: string }> = {
  healthy:   { bg: "bg-emerald-500",   text: "text-emerald-700",   ring: "ring-emerald-200",   label: "Healthy" },
  watch:     { bg: "bg-amber-500",    text: "text-amber-700",     ring: "ring-amber-200",     label: "Watch" },
  irrigate:  { bg: "bg-blue-500",     text: "text-blue-700",      ring: "ring-blue-200",      label: "Irrigate" },
  disease:   { bg: "bg-rose-500",     text: "text-rose-700",      ring: "ring-rose-200",      label: "Disease" },
  low_yield: { bg: "bg-orange-500",   text: "text-orange-700",    ring: "ring-orange-200",    label: "Low yield" },
};
