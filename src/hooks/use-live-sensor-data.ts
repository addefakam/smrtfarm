"use client";

/**
 * Live sensor data hook — simulates Firebase RTDB onValue updates for
 * NPK probes + weather stations.
 *
 * When real Firebase is configured, swap the setInterval in this hook
 * with a real onValue subscription (the data shape is identical).
 *
 * The hook:
 *   1. Maintains a rolling buffer of the last N readings per parcel/aoi
 *   2. Generates a new reading every `intervalMs` (default 3000ms)
 *   3. Auto-detects patterns (declining moisture, N depletion, RH spike, etc.)
 *   4. Surfaces "interventions" — actionable per-parcel recommendations
 *
 * Usage:
 *   const { live, interventions, latest, lastUpdate } = useLiveSensorData({
 *     siteId: "bishoftu",
 *     intervalMs: 3000,
 *   });
 *   // live[parcelId] = { moisture: [...], n: [...], p: [...], k: [...], ... }
 *   // interventions = [{ parcelId, severity, message, action, timestamp }]
 */

import { useEffect, useRef, useState } from "react";
import { getParcelsBySite, SITES, type SiteId, type Parcel } from "@/lib/mock-data";

export interface LiveReading {
  parcelId: string;
  parcelCode: string;
  ts: number; // epoch ms
  moisture: number;       // %
  humidity: number;       // % air RH
  soilN: number;          // ppm
  soilP: number;          // ppm
  soilK: number;          // ppm
  soilPh: number;
  soilTemp: number;       // °C
}

export interface LiveWeatherReading {
  aoiId: string;
  ts: number;
  tMax: number;
  tMin: number;
  rh: number;
  wind: number;
  solarRad: number;
  rain: number;
  et0: number;
}

export interface Intervention {
  id: string;
  parcelId: string;
  parcelCode: string;
  owner: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "irrigation" | "fertilization" | "disease" | "canopy" | "weather";
  pattern: string;       // e.g. "Moisture declining 5%/hr"
  message: string;       // e.g. "Irrigation required within 6 hours"
  action: string;        // e.g. "Apply 18mm water · ~180 m³ on 1.0 ha"
  ts: number;
}

export interface LiveMetricBuffer {
  moisture: number[];
  humidity: number[];
  soilN: number[];
  soilP: number[];
  soilK: number[];
  soilPh: number[];
  soilTemp: number[];
  timestamps: number[];
}

interface UseLiveSensorDataOptions {
  siteId: SiteId;
  intervalMs?: number;
  bufferSize?: number;
}

// Seeded PRNG for stable baseline values per parcel
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Detect patterns from the rolling buffer + current values → interventions */
function detectInterventions(parcel: Parcel, live: LiveMetricBuffer, latest: LiveReading | null): Intervention[] {
  if (!latest) return [];
  const out: Intervention[] = [];
  const now = Date.now();
  const code = parcel.parcelCode;
  const owner = parcel.owner;
  const id = parcel.id;

  // ─── Irrigation: moisture < 25% (critical) ───
  if (latest.moisture < 22) {
    out.push({
      id: `${id}-moist-crit`, parcelId: id, parcelCode: code, owner,
      severity: "critical", category: "irrigation",
      pattern: `Soil moisture ${latest.moisture.toFixed(1)}% (below PWP-adjacent threshold)`,
      message: "Critical moisture deficit — irrigate within 2 hours",
      action: `Apply ${15 + Math.floor((25 - latest.moisture))}mm water · ~${Math.round((15 + Math.floor(25 - latest.moisture)) * parcel.areaHa * 10)} m³ on ${parcel.areaHa} ha`,
      ts: now,
    });
  } else if (latest.moisture < 28) {
    out.push({
      id: `${id}-moist-low`, parcelId: id, parcelCode: code, owner,
      severity: "high", category: "irrigation",
      pattern: `Soil moisture ${latest.moisture.toFixed(1)}% (below MAD threshold)`,
      message: "Soil-water depletion exceeded MAD — irrigate today",
      action: `Apply ${8 + Math.floor((30 - latest.moisture))}mm water · ~${Math.round((8 + Math.floor(30 - latest.moisture)) * parcel.areaHa * 10)} m³ on ${parcel.areaHa} ha`,
      ts: now,
    });
  }

  // ─── Irrigation: moisture declining >2% in last 3 readings ───
  if (live.moisture.length >= 3) {
    const recent3 = live.moisture.slice(-3);
    const slope = (recent3[2] - recent3[0]) / 2;
    if (slope < -1.5) {
      out.push({
        id: `${id}-moist-decline`, parcelId: id, parcelCode: code, owner,
        severity: "medium", category: "irrigation",
        pattern: `Moisture declining ${slope.toFixed(1)}%/reading`,
        message: "Fast moisture drawdown — irrigation window approaching",
        action: "Schedule irrigation within 6h; check ET₀ forecast",
        ts: now,
      });
    }
  }

  // ─── Fertilization: N < 25 ppm ───
  if (latest.soilN < 22) {
    out.push({
      id: `${id}-n-low`, parcelId: id, parcelCode: code, owner,
      severity: "high", category: "fertilization",
      pattern: `Soil N ${latest.soilN.toFixed(0)} ppm (deficient)`,
      message: "Nitrogen deficiency — yield loss risk",
      action: `Apply urea 46-0-0 at ${Math.round((30 - latest.soilN) * 1.5)} kg/ha (top-dress)`,
      ts: now,
    });
  }
  if (latest.soilP < 10) {
    out.push({
      id: `${id}-p-low`, parcelId: id, parcelCode: code, owner,
      severity: "medium", category: "fertilization",
      pattern: `Soil P (Olsen) ${latest.soilP.toFixed(0)} ppm (low)`,
      message: "Phosphorus below optimum for tillering stage",
      action: `Apply DAP 18-46-0 at ${Math.round((15 - latest.soilP) * 2)} kg/ha`,
      ts: now,
    });
  }
  if (latest.soilK < 130) {
    out.push({
      id: `${id}-k-low`, parcelId: id, parcelCode: code, owner,
      severity: "low", category: "fertilization",
      pattern: `Soil K ${latest.soilK.toFixed(0)} ppm (low)`,
      message: "Potassium below optimum",
      action: `Apply KCl 0-0-60 at ${Math.round((180 - latest.soilK) * 0.4)} kg/ha`,
      ts: now,
    });
  }

  // ─── Canopy: NDVI drop detected (parcel.ndvi reflects current state) ───
  // If NDVI < 0.55 and moisture < 30 → likely stress
  if (parcel.ndvi < 0.55 && latest.moisture < 30) {
    out.push({
      id: `${id}-canopy-stress`, parcelId: id, parcelCode: code, owner,
      severity: "high", category: "canopy",
      pattern: `NDVI ${parcel.ndvi.toFixed(2)} + low moisture`,
      message: "Canopy stress detected — investigate cause",
      action: "Schedule UAV mission + field scouting within 48h",
      ts: now,
    });
  }

  // ─── Disease: humidity > 80% sustained ───
  if (live.humidity.length >= 3) {
    const recent3 = live.humidity.slice(-3);
    const avgRh = recent3.reduce((a, b) => a + b, 0) / 3;
    if (avgRh > 80 && parcel.growthStage !== "Ripening") {
      out.push({
        id: `${id}-rh-spike`, parcelId: id, parcelCode: code, owner,
        severity: "medium", category: "disease",
        pattern: `Air RH sustained ${avgRh.toFixed(0)}% (3 readings)`,
        message: "Fungal disease outbreak conditions — preventive action recommended",
        action: "Apply preventive fungicide (triadimefon 25% WP at 0.5 kg/ha)",
        ts: now,
      });
    }
  }

  // ─── Weather: T_max > 32°C + low RH → heat stress ───
  if (latest.soilTemp > 28 && latest.humidity < 40) {
    out.push({
      id: `${id}-heat-stress`, parcelId: id, parcelCode: code, owner,
      severity: "medium", category: "weather",
      pattern: `Soil T ${latest.soilTemp}°C + RH ${latest.humidity}%`,
      message: "Heat stress conditions — increase irrigation frequency",
      action: "Reduce irrigation interval by 30%; monitor canopy temp",
      ts: now,
    });
  }

  return out;
}

/** Main hook — generates a new reading every intervalMs for each parcel + AOI. */
export function useLiveSensorData({
  siteId,
  intervalMs = 3000,
  bufferSize = 30,
}: UseLiveSensorDataOptions) {
  const parcels = getParcelsBySite(siteId);
  const site = SITES.find(s => s.id === siteId)!;

  // ── State: rolling buffer per parcel ──
  // Keyed by parcelId, each value is LiveMetricBuffer
  const [liveBuffers, setLiveBuffers] = useState<Record<string, LiveMetricBuffer>>({});
  // Latest reading per parcel
  const [latestReadings, setLatestReadings] = useState<Record<string, LiveReading>>({});
  // Latest weather reading for the AOI
  const [latestWeather, setLatestWeather] = useState<LiveWeatherReading | null>(null);
  // Weather rolling buffer (for charts)
  const [weatherBuffer, setWeatherBuffer] = useState<LiveWeatherReading[]>([]);
  // Auto-detected interventions across all parcels
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  // Last update timestamp (for the LIVE badge)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // ── Refs for the interval (avoid stale closure issues) ──
  const buffersRef = useRef<Record<string, LiveMetricBuffer>>({});
  const latestRef = useRef<Record<string, LiveReading>>({});
  const weatherRef = useRef<LiveWeatherReading[]>([]);

  // Initialize buffers when siteId/parcels change
  useEffect(() => {
    const initBuffers: Record<string, LiveMetricBuffer> = {};
    const initLatest: Record<string, LiveReading> = {};
    const now = Date.now();

    parcels.forEach((p, idx) => {
      const seed = hashStr(p.id) + idx;
      const r = rng(seed);
      // Seed with the parcel's static values to start at a sensible baseline
      const initMoist = p.soilMoisture;
      const initRh = p.humidity;
      const initN = p.soilN;
      const initP = p.soilP;
      const initK = p.soilK;
      const initPh = p.soilPh;
      const initTemp = p.soilTemp;

      initBuffers[p.id] = {
        moisture: Array.from({ length: bufferSize }, (_, i) =>
          Math.round((initMoist + (r() - 0.5) * 4) * 10) / 10),
        humidity: Array.from({ length: bufferSize }, (_, i) =>
          Math.round(initRh + (r() - 0.5) * 6)),
        soilN: Array.from({ length: bufferSize }, (_, i) =>
          Math.round((initN + (r() - 0.5) * 3) * 10) / 10),
        soilP: Array.from({ length: bufferSize }, (_, i) =>
          Math.round((initP + (r() - 0.5) * 1.5) * 10) / 10),
        soilK: Array.from({ length: bufferSize }, (_, i) =>
          Math.round((initK + (r() - 0.5) * 15) * 10) / 10),
        soilPh: Array.from({ length: bufferSize }, () =>
          Math.round((initPh + (r() - 0.5) * 0.1) * 100) / 100),
        soilTemp: Array.from({ length: bufferSize }, (_, i) =>
          Math.round((initTemp + (r() - 0.5) * 1.5) * 10) / 10),
        timestamps: Array.from({ length: bufferSize }, (_, i) => now - (bufferSize - i) * intervalMs),
      };

      initLatest[p.id] = {
        parcelId: p.id, parcelCode: p.parcelCode, ts: now,
        moisture: initBuffers[p.id].moisture[bufferSize - 1],
        humidity: initBuffers[p.id].humidity[bufferSize - 1],
        soilN: initBuffers[p.id].soilN[bufferSize - 1],
        soilP: initBuffers[p.id].soilP[bufferSize - 1],
        soilK: initBuffers[p.id].soilK[bufferSize - 1],
        soilPh: initBuffers[p.id].soilPh[bufferSize - 1],
        soilTemp: initBuffers[p.id].soilTemp[bufferSize - 1],
      };
    });

    buffersRef.current = initBuffers;
    latestRef.current = initLatest;

    // Initial weather reading
    const w = site.weatherToday;
    const initW: LiveWeatherReading = {
      aoiId: siteId, ts: now,
      tMax: w.t_max, tMin: w.t_min, rh: w.rh,
      wind: w.wind_speed, solarRad: w.solar_rad, rain: w.rain, et0: w.et0,
    };
    weatherRef.current = [initW];

    setLiveBuffers(initBuffers);
    setLatestReadings(initLatest);
    setLatestWeather(initW);
    setWeatherBuffer([initW]);
    setLastUpdate(now);

    // Initial intervention detection
    const initInterventions: Intervention[] = [];
    parcels.forEach(p => {
      const buf = initBuffers[p.id];
      const latest = initLatest[p.id];
      initInterventions.push(...detectInterventions(p, buf, latest));
    });
    setInterventions(initInterventions.sort((a, b) => {
      const sevW = { critical: 4, high: 3, medium: 2, low: 1 };
      return sevW[b.severity] - sevW[a.severity];
    }));
   
  }, [siteId]);

  // ── Tick: generate new readings every intervalMs ──
  useEffect(() => {
    if (parcels.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const r = rng(now & 0xFFFFFFFF);
      const newBuffers: Record<string, LiveMetricBuffer> = {};
      const newLatest: Record<string, LiveReading> = {};
      const newInterventions: Intervention[] = [];

      parcels.forEach(p => {
        const prev = buffersRef.current[p.id];
        if (!prev) return;
        // Generate new reading with realistic drift
        const prevMoist = prev.moisture[prev.moisture.length - 1];
        const prevRh = prev.humidity[prev.humidity.length - 1];
        const prevN = prev.soilN[prev.soilN.length - 1];
        const prevP = prev.soilP[prev.soilP.length - 1];
        const prevK = prev.soilK[prev.soilK.length - 1];
        const prevPh = prev.soilPh[prev.soilPh.length - 1];
        const prevTemp = prev.soilTemp[prev.soilTemp.length - 1];

        // Drift: moisture tends down (crop uptake + ET), humidity oscillates, N slowly depletes
        const newMoist = Math.max(15, Math.min(50, prevMoist + (r() - 0.55) * 1.5));
        const newRh = Math.max(40, Math.min(95, prevRh + (r() - 0.5) * 3));
        const newN = Math.max(10, prevN + (r() - 0.6) * 0.8);
        const newP = Math.max(5, prevP + (r() - 0.5) * 0.3);
        const newK = Math.max(80, prevK + (r() - 0.5) * 5);
        const newPh = Math.max(5.0, Math.min(8.0, prevPh + (r() - 0.5) * 0.02));
        const newTemp = Math.max(15, Math.min(32, prevTemp + (r() - 0.5) * 0.4));

        const buf: LiveMetricBuffer = {
          moisture: [...prev.moisture.slice(-(bufferSize - 1)), newMoist],
          humidity: [...prev.humidity.slice(-(bufferSize - 1)), newRh],
          soilN: [...prev.soilN.slice(-(bufferSize - 1)), newN],
          soilP: [...prev.soilP.slice(-(bufferSize - 1)), newP],
          soilK: [...prev.soilK.slice(-(bufferSize - 1)), newK],
          soilPh: [...prev.soilPh.slice(-(bufferSize - 1)), newPh],
          soilTemp: [...prev.soilTemp.slice(-(bufferSize - 1)), newTemp],
          timestamps: [...prev.timestamps.slice(-(bufferSize - 1)), now],
        };
        newBuffers[p.id] = buf;
        newLatest[p.id] = {
          parcelId: p.id, parcelCode: p.parcelCode, ts: now,
          moisture: newMoist, humidity: newRh, soilN: newN, soilP: newP,
          soilK: newK, soilPh: newPh, soilTemp: newTemp,
        };
        // Detect interventions for this parcel
        newInterventions.push(...detectInterventions(p, buf, newLatest[p.id]));
      });

      // Weather update (per AOI, simpler — just oscillate around baseline)
      const w = site.weatherToday;
      const prevW = weatherRef.current[weatherRef.current.length - 1];
      const newW: LiveWeatherReading = {
        aoiId: siteId, ts: now,
        tMax: prevW?.tMax ?? w.t_max,
        tMin: prevW?.tMin ?? w.t_min,
        rh: Math.max(40, Math.min(95, (prevW?.rh ?? w.rh) + (r() - 0.5) * 1.5)),
        wind: Math.max(0.5, (prevW?.wind ?? w.wind_speed) + (r() - 0.5) * 0.2),
        solarRad: Math.max(8, (prevW?.solarRad ?? w.solar_rad) + (r() - 0.5) * 0.4),
        rain: r() < 0.05 ? Math.round(r() * 8 * 10) / 10 : 0,
        et0: 0, // computed below
      };
      // FAO-56 ET₀ (simplified PM)
      newW.et0 = Math.round((0.0023 * newW.solarRad * (((newW.tMax + newW.tMin) / 2 + 17.8)) *
        Math.sqrt(Math.max(0.1, newW.tMax - newW.tMin))) * 10) / 10;

      const newWeatherBuffer = [...weatherRef.current.slice(-(bufferSize - 1)), newW];

      // Update refs + state
      buffersRef.current = newBuffers;
      latestRef.current = newLatest;
      weatherRef.current = newWeatherBuffer;

      setLiveBuffers(newBuffers);
      setLatestReadings(newLatest);
      setLatestWeather(newW);
      setWeatherBuffer(newWeatherBuffer);
      setLastUpdate(now);
      // Deduplicate interventions (only keep newest per {parcelId, category})
      const seen = new Set<string>();
      const deduped = newInterventions
        .filter(i => {
          const key = `${i.parcelId}-${i.category}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => {
          const sevW = { critical: 4, high: 3, medium: 2, low: 1 } as const;
          return sevW[b.severity] - sevW[a.severity];
        });
      setInterventions(deduped);
    }, intervalMs);

    return () => clearInterval(interval);
   
  }, [siteId, intervalMs, bufferSize]);

  return {
    live: liveBuffers,
    latest: latestReadings,
    interventions,
    latestWeather,
    weatherBuffer,
    lastUpdate,
    isLive: true, // would be `isFirebaseConfigured()` in production
  };
}
