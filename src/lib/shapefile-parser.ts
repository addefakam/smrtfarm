/**
 * Shapefile parser — converts .shp/.dbf/.shx/.prj uploaded by the user
 * into GeoJSON FeatureCollection for Leaflet overlay rendering.
 *
 * Uses the `shapefile` npm package (DevSeed) which works in both Node
 * and browser. Parses shapefile binary into GeoJSON synchronously.
 */

import { open as shpOpen } from "shapefile";

export interface ParsedShapefile {
  geoJson: GeoJSON.FeatureCollection;
  featureCount: number;
  crs?: string;
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

/**
 * Parse a shapefile set (.shp + .dbf + .shx + .prj) into GeoJSON.
 *
 * @param shpBuffer - ArrayBuffer of the .shp file
 * @param dbfBuffer - ArrayBuffer of the .dbf file (optional — provides attributes)
 * @returns ParsedShapefile with GeoJSON FeatureCollection
 *
 * Example:
 *   const shpFile = await fileInput.files[0].arrayBuffer();
 *   const dbfFile = await fileInput.files[1].arrayBuffer();
 *   const parsed = await parseShapefile(shpFile, dbfFile);
 *   // parsed.geoJson ready for L.geoJSON(parsed.geoJson).addTo(map)
 */
export async function parseShapefile(
  shpBuffer: ArrayBuffer,
  dbfBuffer?: ArrayBuffer
): Promise<ParsedShapefile> {
  // `open()` returns a Shapefile instance with .read() and .cancel() methods
  const reader = await shpOpen(shpBuffer, dbfBuffer);
  const features: GeoJSON.Feature[] = [];

  // Read features until done
  // Each call to reader.read() returns Promise<{ done: boolean, value?: Feature }>
  let result = await reader.read();
  while (result && !result.done && result.value) {
    features.push(result.value as GeoJSON.Feature);
    result = await reader.read();
    // Safety valve: stop at 1000 features to avoid runaway loops
    if (features.length >= 1000) break;
  }
  reader.cancel();

  const featureCount = features.length;

  // Compute bbox from all features
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const f of features) {
    if (!f.geometry || !("coordinates" in f.geometry)) continue;
    const coords = extractAllCoordinates(f.geometry as GeoJSON.Geometry);
    for (const [lon, lat] of coords) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  const bbox: [number, number, number, number] | undefined =
    features.length > 0 ? [minLon, minLat, maxLon, maxLat] : undefined;

  return {
    geoJson: { type: "FeatureCollection", features },
    featureCount,
    bbox,
  };
}

/** Recursively extract all [lon, lat] coordinates from any geometry type. */
function extractAllCoordinates(geometry: GeoJSON.Geometry): [number, number][] {
  switch (geometry.type) {
    case "Point":
      return [geometry.coordinates as [number, number]];
    case "MultiPoint":
    case "LineString":
      return geometry.coordinates as [number, number][];
    case "MultiLineString":
    case "Polygon":
      return (geometry.coordinates as number[][][]).flat() as unknown as [number, number][];
    case "MultiPolygon":
      return (geometry.coordinates as number[][][][]).flat(2) as unknown as [number, number][];
    case "GeometryCollection":
      return geometry.geometries.flatMap(extractAllCoordinates);
    default:
      return [];
  }
}

/**
 * Generate sample parcel polygons around an AOI centroid when the user
 * doesn't have a real shapefile handy. Useful for demonstrating the
 * shapefile ingestion flow with a "Generate sample shapefile" button.
 *
 * Creates a grid of n×n rectangular parcels (~0.5 km² each) centered on (lon, lat).
 */
export function generateSampleShapefile(
  centerLon: number,
  centerLat: number,
  parcelCount: number = 9
): ParsedShapefile {
  const cols = Math.ceil(Math.sqrt(parcelCount));
  const rows = Math.ceil(parcelCount / cols);
  const sizeDeg = 0.005; // ~500m
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= parcelCount) break;
      const lon = centerLon + (c - cols / 2 + 0.5) * sizeDeg;
      const lat = centerLat + (r - rows / 2 + 0.5) * sizeDeg;
      features.push({
        type: "Feature",
        properties: {
          parcel_code: `SAMPLE-${String(idx + 1).padStart(3, "0")}`,
          area_ha: 25, // approx 0.5km × 0.5km
          generated: true,
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [lon - sizeDeg / 2, lat - sizeDeg / 2],
            [lon + sizeDeg / 2, lat - sizeDeg / 2],
            [lon + sizeDeg / 2, lat + sizeDeg / 2],
            [lon - sizeDeg / 2, lat + sizeDeg / 2],
            [lon - sizeDeg / 2, lat - sizeDeg / 2], // close the ring
          ]],
        },
      });
      idx++;
    }
  }

  const geoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  return {
    geoJson,
    featureCount: features.length,
    bbox: [centerLon - cols * sizeDeg / 2, centerLat - rows * sizeDeg / 2,
           centerLon + cols * sizeDeg / 2, centerLat + rows * sizeDeg / 2],
  };
}
