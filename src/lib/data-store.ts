"use client";

/**
 * Unified data store — abstracts Firebase RTDB vs localStorage fallback.
 *
 * All client-side writes (soil readings, weather obs, reflectance values,
 * shapefile GeoJSON) go through this module. When Firebase is configured,
 * writes propagate to RTDB and triggers any listening dashboards. When
 * not configured, writes go to localStorage so the demo still works
 * end-to-end in dev/preview environments.
 *
 * Architecture:
 *   Input Data view → dataStore.write{Soil,Weather,Reflectance,Shapefile}
 *     ├── if isFirebaseConfigured → push to Firebase RTDB → onSnapshot listeners
 *     └── else → persist to localStorage → next render reads updated value
 */

import { getFirebaseDB, isFirebaseConfigured } from "@/lib/firebase";
import { ref, push, onValue, serverTimestamp, type Unsubscribe } from "firebase/database";

// ── Types ────────────────────────────────────────────────────────
export interface SoilReadingInput {
  parcelId: string;
  parcelCode: string;
  ts: string;
  n: number; p: number; k: number; ph: number; ec: number;
  moisture: number; soilTemp: number; humidity: number;
  source: "npk_sensor" | "manual";
}

export interface WeatherInput {
  aoiId: string;
  date: string;
  tMax: number; tMin: number; rh: number; wind: number;
  solarRad: number; rain: number; et0: number;
  source: "station" | "manual";
}

export interface ReflectanceInput {
  parcelId: string;
  parcelCode: string;
  date: string;
  blue: number; green: number; red: number;
  nir: number; re: number; swir1: number;
  source: "uav" | "sentinel2" | "manual";
}

export interface ShapefileInput {
  aoiId: string;
  fileName: string;
  featureCount: number;
  geoJson: unknown; // GeoJSON FeatureCollection
  uploadedAt: string;
}

// ── LocalStorage keys ────────────────────────────────────────────
const LS_KEYS = {
  soil: "pfe.soilReadings",
  weather: "pfe.weatherObs",
  reflectance: "pfe.reflectance",
  shapefile: "pfe.shapefiles",
};

// ── LocalStorage helpers ─────────────────────────────────────────
function lsGet<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsAppend<T>(key: string, item: T): T[] {
  if (typeof window === "undefined") return [item];
  const items = lsGet<T>(key);
  items.push(item);
  // Cap at 200 entries to avoid localStorage bloat
  const capped = items.slice(-200);
  localStorage.setItem(key, JSON.stringify(capped));
  // Notify subscribers
  window.dispatchEvent(new CustomEvent("pfe:dataChange", { detail: { key } }));
  return capped;
}

// ── Public API ───────────────────────────────────────────────────
export async function writeSoilReading(input: SoilReadingInput): Promise<{ ok: boolean; mode: "firebase" | "localStorage"; }> {
  if (isFirebaseConfigured()) {
    const db = getFirebaseDB();
    if (db) {
      await push(ref(db, `soil_readings/${input.parcelId}`), { ...input, ts_server: serverTimestamp() });
      return { ok: true, mode: "firebase" };
    }
  }
  lsAppend(LS_KEYS.soil, input);
  return { ok: true, mode: "localStorage" };
}

export async function writeWeather(input: WeatherInput): Promise<{ ok: boolean; mode: "firebase" | "localStorage"; }> {
  if (isFirebaseConfigured()) {
    const db = getFirebaseDB();
    if (db) {
      await push(ref(db, `weather_obs/${input.aoiId}`), { ...input, ts_server: serverTimestamp() });
      return { ok: true, mode: "firebase" };
    }
  }
  lsAppend(LS_KEYS.weather, input);
  return { ok: true, mode: "localStorage" };
}

export async function writeReflectance(input: ReflectanceInput): Promise<{ ok: boolean; mode: "firebase" | "localStorage"; }> {
  if (isFirebaseConfigured()) {
    const db = getFirebaseDB();
    if (db) {
      await push(ref(db, `reflectance/${input.parcelId}`), { ...input, ts_server: serverTimestamp() });
      return { ok: true, mode: "firebase" };
    }
  }
  lsAppend(LS_KEYS.reflectance, input);
  return { ok: true, mode: "localStorage" };
}

export async function writeShapefile(input: ShapefileInput): Promise<{ ok: boolean; mode: "firebase" | "localStorage"; }> {
  if (isFirebaseConfigured()) {
    const db = getFirebaseDB();
    if (db) {
      await push(ref(db, `shapefiles/${input.aoiId}`), { ...input, ts_server: serverTimestamp() });
      return { ok: true, mode: "firebase" };
    }
  }
  lsAppend(LS_KEYS.shapefile, input);
  return { ok: true, mode: "localStorage" };
}

// ── Read helpers (for displaying submitted inputs in the UI) ──
export function getLocalSoilReadings(): SoilReadingInput[] { return lsGet(LS_KEYS.soil); }
export function getLocalWeatherObs(): WeatherInput[] { return lsGet(LS_KEYS.weather); }
export function getLocalReflectance(): ReflectanceInput[] { return lsGet(LS_KEYS.reflectance); }
export function getLocalShapefiles(): ShapefileInput[] { return lsGet(LS_KEYS.shapefile); }

export function clearAllLocalData(): void {
  if (typeof window === "undefined") return;
  Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent("pfe:dataChange", { detail: { key: "all" } }));
}

// ── Realtime subscription (Firebase only) ───────────────────────
export function subscribeToSoilReadings(parcelId: string, cb: (reading: SoilReadingInput | null) => void): Unsubscribe | null {
  if (!isFirebaseConfigured()) return null;
  const db = getFirebaseDB();
  if (!db) return null;
  const unsub = onValue(ref(db, `soil_readings/${parcelId}`), (snap) => {
    cb(snap.val());
  });
  return unsub;
}
