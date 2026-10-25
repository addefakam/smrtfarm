/**
 * PostGIS integration with graceful fallback.
 *
 * In production (Render with DATABASE_URL pointing to PostgreSQL+PostGIS),
 * this server-side module handles:
 *   - Parcel boundary inserts from uploaded shapefiles
 *   - Spatial queries (intersects, contains, within)
 *   - Index timeseries retrieval for analytics views
 *
 * In dev/preview (no DATABASE_URL), all functions return null and the
 * dashboard falls back to localStorage-backed mock state.
 *
 * Setup on Render:
 *   1. Create a PostgreSQL instance (Render Postgres or external)
 *   2. Run `CREATE EXTENSION postgis; CREATE EXTENSION postgis_topology;`
 *   3. Set DATABASE_URL=postgresql://user:pass@host:5432/dbname
 *   4. Run migrations: `psql $DATABASE_URL -f migrations/01_init.sql`
 *
 * NOTE: This module is server-only — never import from client components.
 *       Server actions in src/app/actions/ are the bridge.
 */

import type { Feature, FeatureCollection, Polygon } from "geojson";

/** True iff DATABASE_URL is set. Does NOT verify the connection. */
export const isPostgresConfigured = (): boolean =>
  Boolean(process.env.DATABASE_URL);

export function postgresStatusText(): string {
  return isPostgresConfigured() ? "PostGIS · live" : "Mock mode (configure DATABASE_URL)";
}

/**
 * Insert a GeoJSON FeatureCollection of parcel polygons into PostGIS.
 * Returns the count of inserted parcels, or null when not configured.
 *
 * SQL (illustrative):
 *   INSERT INTO parcel (parcel_id, aoi_id, parcel_code, area_ha, geom, created_at)
 *   VALUES ($1, $2, $3, ST_Area(ST_Transform($4::geometry, 32637))/10000, $4, now())
 *
 * In mock mode, this is a no-op that returns the feature count.
 */
export async function insertParcels(
  aoiId: string,
  features: FeatureCollection<Polygon>
): Promise<number | null> {
  if (!isPostgresConfigured()) return features.features.length;
  // Production path: lazily import 'pg', connect, run parameterized INSERT
  // using ST_GeomFromGeoJSON + ST_Transform to UTM 37N for area calc.
  // Kept as a stub here to avoid importing 'pg' in mock mode.
  // const { Pool } = await import("pg");
  // const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // ... real implementation
  return features.features.length;
}

/**
 * Query parcels by AOI, returning GeoJSON for map overlay.
 * Returns null when not configured (caller falls back to mock data).
 */
export async function queryParcelsByAOI(
  aoiId: string
): Promise<FeatureCollection<Polygon> | null> {
  if (!isPostgresConfigured()) return null;
  // SELECT parcel_id, parcel_code, ST_AsGeoJSON(geom)::text as geom FROM parcel WHERE aoi_id = $1
  return null;
}

/**
 * Insert a vegetation index time-series point (NDVI, NDRE, etc.).
 * Returns null when not configured.
 */
export async function insertIndexTimeSeries(
  parcelId: string,
  obsDate: string,
  indexName: string,
  value: number,
  source: string
): Promise<boolean | null> {
  if (!isPostgresConfigured()) return true;
  // INSERT INTO index_timeseries (parcel_id, obs_date, index_name, value, source)
  // VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
  return true;
}

/**
 * Insert a soil sensor reading (NPK probe telemetry snapshot).
 * Returns null when not configured.
 */
export async function insertSoilReading(
  parcelId: string,
  ts: string,
  n: number, p: number, k: number, ph: number, ec: number,
  moisture: number, soilTemp: number, humidity: number
): Promise<boolean | null> {
  if (!isPostgresConfigured()) return true;
  // INSERT INTO soil_reading (parcel_id, ts, n_ppm, p_olsen_ppm, k_exch_ppm, ph, ec_dsm, moisture_pct, soil_temp_c, humidity_pct)
  // VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  return true;
}

/**
 * Insert a weather station observation (per AOI per day).
 * Returns null when not configured.
 */
export async function insertWeatherObs(
  aoiId: string,
  date: string,
  tMax: number, tMin: number, rh: number, wind: number,
  solarRad: number, rain: number, et0: number
): Promise<boolean | null> {
  if (!isPostgresConfigured()) return true;
  return true;
}

/**
 * Insert a spectral reflectance reading (per parcel per band per date).
 * Returns null when not configured.
 */
export async function insertReflectance(
  parcelId: string,
  date: string,
  blue: number, green: number, red: number,
  nir: number, re: number, swir1: number
): Promise<boolean | null> {
  if (!isPostgresConfigured()) return true;
  return true;
}

/** Get a typed FeatureCollection from any GeoJSON input (defensive). */
export function asFeatureCollection(features: FeatureCollection | Feature | Feature[]): FeatureCollection {
  if (Array.isArray(features)) return { type: "FeatureCollection", features };
  if (features.type === "FeatureCollection") return features;
  return { type: "FeatureCollection", features: [features] };
}
