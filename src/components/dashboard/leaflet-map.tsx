"use client";

import { useEffect, useRef } from "react";
import type { SiteId } from "@/lib/mock-data";

// Leaflet types are imported dynamically to avoid SSR issues
import type L from "leaflet";

interface LeafletMapProps {
  selectedSiteId: SiteId;
  onSelectSite?: (id: SiteId) => void;
  parcelGeoJson?: GeoJSON.FeatureCollection | null;
  onParcelClick?: (parcelCode: string) => void;
  height?: string;
  showAOIMarkers?: boolean;
  className?: string;
}

// Sites are imported lazily inside the component to keep server bundle small
const SITES = [
  { id: "bishoftu", name: "Bishoftu ARC", lat: 8.7347, lon: 39.0085, alerts: 7, phase: "Phase 1" },
  { id: "asella",   name: "Asella AERC", lat: 7.9500, lon: 39.1170, alerts: 4, phase: "Phase 2" },
  { id: "ambo",     name: "Ambo ARC",    lat: 8.9500, lon: 37.8667, alerts: 5, phase: "Phase 2" },
] as const;

export default function LeafletMap({
  selectedSiteId,
  onSelectSite,
  parcelGeoJson,
  onParcelClick,
  height = "400px",
  showAOIMarkers = true,
  className,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const aoiLayerRef = useRef<L.LayerGroup | null>(null);
  const parcelLayerRef = useRef<L.GeoJSON | null>(null);

  // ── Initialize map (once) ──
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let isMounted = true;

    (async () => {
      const L = (await import("leaflet")).default;
      // Fix default icon path (Leaflet's marker images come from CDN)
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!isMounted || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [8.5, 39.0],  // centered roughly on Ethiopia wheat belt
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // OpenStreetMap basemap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      aoiLayerRef.current = L.layerGroup().addTo(map);

      // Trigger first render of AOI markers
      renderAOIMarkers();
    })();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        aoiLayerRef.current = null;
        parcelLayerRef.current = null;
      }
    };
     
  }, []);

  // ── Render AOI markers (when selection changes) ──
  useEffect(() => {
    renderAOIMarkers();
     
  }, [selectedSiteId, showAOIMarkers]);

  function renderAOIMarkers() {
    if (!mapRef.current || !aoiLayerRef.current) return;
    let isMounted = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapRef.current || !aoiLayerRef.current) return;

      aoiLayerRef.current.clearLayers();

      if (!showAOIMarkers) return;

      // Addis Ababa reference
      L.circleMarker([9.0250, 38.7469], {
        radius: 4, color: "#515A5A", fillColor: "#515A5A", fillOpacity: 0.6,
      }).addTo(aoiLayerRef.current).bindTooltip("Addis Ababa (reference)");

      // Three AOI markers
      for (const site of SITES) {
        const isSelected = site.id === selectedSiteId;
        const color = isSelected ? "#1B5347" : "#2A7A65";

        // Pulse outer ring (using circle with reduced opacity)
        L.circle([site.lat, site.lon], {
          radius: 8000 + site.alerts * 500,  // 8-12 km radius
          color, fillColor: color, fillOpacity: 0.12, weight: 1,
          dashArray: "4 6",
        }).addTo(aoiLayerRef.current);

        // Main marker
        const marker = L.circleMarker([site.lat, site.lon], {
          radius: isSelected ? 12 : 9,
          color: "white", weight: 2,
          fillColor: color, fillOpacity: 0.95,
        });

        marker.bindTooltip(
          `<strong>${site.name}</strong><br/>
           ${site.lat.toFixed(4)}°N, ${site.lon.toFixed(4)}°E<br/>
           ${site.alerts} active alerts · ${site.phase}`,
          { direction: "top", offset: [0, -10] }
        );

        if (onSelectSite) {
          marker.on("click", () => onSelectSite(site.id as SiteId));
          marker.on("mouseover", () => marker.setStyle({ radius: isSelected ? 14 : 11 }));
          marker.on("mouseout", () => marker.setStyle({ radius: isSelected ? 12 : 9 }));
        }

        marker.addTo(aoiLayerRef.current);

        // Alert badge (small label)
        if (site.alerts > 0) {
          L.marker([site.lat + 0.04, site.lon + 0.04], {
            icon: L.divIcon({
              className: "aoi-alert-badge",
              html: `<div style="background:#C0392B;color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);">${site.alerts}</div>`,
              iconSize: [22, 22], iconAnchor: [11, 11],
            }),
          }).addTo(aoiLayerRef.current);
        }
      }
    })();
    return () => { isMounted = false; };
  }

  // ── Render parcel GeoJSON overlay (when shapefile changes) ──
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapRef.current) return;

      // Remove previous parcel layer
      if (parcelLayerRef.current) {
        mapRef.current.removeLayer(parcelLayerRef.current);
        parcelLayerRef.current = null;
      }

      if (!parcelGeoJson || parcelGeoJson.features.length === 0) return;

      // Color map: cycle through agricultural palette for visual differentiation
      const colors = ["#1B5347", "#2A7A65", "#529286", "#3DDBB5", "#C89F62", "#1A5276"];

      const parcelLayer = L.geoJSON(parcelGeoJson, {
        style: (feature) => {
          const idx = (feature?.properties?.parcel_code || "")
            .charCodeAt(feature?.properties?.parcel_code.length - 1 || 0) || 0;
          const color = colors[idx % colors.length];
          return {
            color: "white",
            weight: 1.5,
            fillColor: color,
            fillOpacity: 0.55,
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          const parcelCode = props.parcel_code || props.PARCEL_ID || props.id || "Unknown";
          const area = props.area_ha || props.AREA_HA || props.area || "—";
          layer.bindTooltip(
            `<strong>${parcelCode}</strong><br/>Area: ${area} ha`,
            { sticky: true }
          );
          if (onParcelClick) {
            layer.on("click", () => onParcelClick(String(parcelCode)));
          }
        },
      }).addTo(mapRef.current);

      parcelLayerRef.current = parcelLayer;

      // Fit map to parcel bounds
      try {
        const bounds = parcelLayer.getBounds();
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch { /* bounds empty — leave default view */ }
    })();
    return () => { isMounted = false; };
  }, [parcelGeoJson, onParcelClick]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height, borderRadius: "0.5rem", overflow: "hidden", zIndex: 0 }}
    />
  );
}
