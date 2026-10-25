"use client";

import { SITES, ETHIOPIA_OUTLINE, type SiteId, type Site } from "@/lib/mock-data";

interface EthiopiaMapProps {
  selectedSiteId: SiteId;
  onSelectSite: (id: SiteId) => void;
}

// SVG viewBox: longitude 33-49, latitude 3-15.5 → "33 3 16 12.5"
const VIEWBOX = "33 3 16 12.5";

// Convert [lon, lat] → SVG x, y (note: SVG y is inverted)
function toSvgCoords([lon, lat]: [number, number]): [number, number] {
  return [lon, 15.5 - lat];
}

const outlinePoints = ETHIOPIA_OUTLINE.map(toSvgCoords);
const outlinePath = outlinePoints
  .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
  .join(" ") + " Z";

export function EthiopiaMap({ selectedSiteId, onSelectSite }: EthiopiaMapProps) {
  return (
    <div className="relative w-full h-full min-h-[320px]">
      <svg
        viewBox={VIEWBOX}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="ethiopiaFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EDF5F2" />
            <stop offset="100%" stopColor="#D9EAE3" />
          </linearGradient>
          <filter id="siteShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.05" stdDeviation="0.08" floodOpacity="0.35" />
          </filter>
          <radialGradient id="pulseGradient">
            <stop offset="0%" stopColor="#2A7A65" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2A7A65" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ethiopia outline */}
        <path
          d={outlinePath}
          fill="url(#ethiopiaFill)"
          stroke="#515A5A"
          strokeWidth="0.04"
          strokeLinejoin="round"
        />

        {/* Country label */}
        <text
          x="40.5"
          y="9"
          fontSize="0.9"
          fill="#515A5A"
          opacity="0.25"
          textAnchor="middle"
          fontWeight="bold"
        >
          ETHIOPIA
        </text>

        {/* Reference: Addis Ababa (capital) */}
        {(() => {
          const [x, y] = toSvgCoords([38.7469, 9.0250]);
          return (
            <g>
              <circle cx={x} cy={y} r="0.12" fill="#515A5A" />
              <text
                x={x + 0.18}
                y={y - 0.05}
                fontSize="0.32"
                fill="#515A5A"
                opacity="0.7"
              >
                Addis Ababa
              </text>
            </g>
          );
        })()}

        {/* Three AOI sites with pulse animation */}
        {SITES.map((site: Site) => {
          const [x, y] = toSvgCoords([site.lon, site.lat]);
          const isSelected = site.id === selectedSiteId;
          const color = isSelected ? "#1B5347" : "#2A7A65";
          const size = isSelected ? 0.30 : 0.22;
          return (
            <g
              key={site.id}
              className="cursor-pointer"
              onClick={() => onSelectSite(site.id)}
            >
              {/* Pulse ring (animated) */}
              {site.activeAlerts > 0 && (
                <circle
                  cx={x}
                  cy={y}
                  r={size + 0.15}
                  fill="url(#pulseGradient)"
                  className="animate-pulse"
                  style={{ animationDuration: "2.5s" }}
                />
              )}
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r={size + 0.18}
                  fill="none"
                  stroke="#C89F62"
                  strokeWidth="0.05"
                  strokeDasharray="0.15 0.08"
                />
              )}
              {/* Site marker */}
              <circle
                cx={x}
                cy={y}
                r={size}
                fill={color}
                stroke="white"
                strokeWidth="0.04"
                filter="url(#siteShadow)"
              />
              {/* Site label */}
              <text
                x={x + size + 0.15}
                y={y + 0.05}
                fontSize="0.36"
                fill={isSelected ? "#1B5347" : "#1A1A1A"}
                fontWeight={isSelected ? "bold" : "normal"}
                className="select-none"
              >
                {site.name}
              </text>
              {/* Alert count badge */}
              {site.activeAlerts > 0 && (
                <g>
                  <circle
                    cx={x - size - 0.05}
                    cy={y - size - 0.05}
                    r="0.16"
                    fill="#C0392B"
                    stroke="white"
                    strokeWidth="0.03"
                  />
                  <text
                    x={x - size - 0.05}
                    y={y - size}
                    fontSize="0.22"
                    fill="white"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {site.activeAlerts}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Lat/lon grid (subtle) */}
        {[36, 39, 42, 45].map(lon => {
          const [x] = toSvgCoords([lon, 0]);
          return (
            <line
              key={`v-${lon}`}
              x1={x}
              y1="3"
              x2={x}
              y2="15.5"
              stroke="#515A5A"
              strokeWidth="0.01"
              strokeDasharray="0.1 0.2"
              opacity="0.2"
            />
          );
        })}
        {[6, 9, 12].map(lat => {
          const [, y] = toSvgCoords([0, lat]);
          return (
            <line
              key={`h-${lat}`}
              x1="33"
              y1={y}
              x2="49"
              y2={y}
              stroke="#515A5A"
              strokeWidth="0.01"
              strokeDasharray="0.1 0.2"
              opacity="0.2"
            />
          );
        })}
      </svg>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 bg-white/95 border border-border rounded-md px-3 py-2 text-xs shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#1B5347" }} />
          <span>Selected AOI</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#2A7A65" }} />
          <span>Available AOI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#C0392B" }} />
          <span>N active alerts</span>
        </div>
      </div>

      {/* CRS note */}
      <div className="absolute top-2 right-2 text-[10px] text-muted-foreground bg-white/80 px-2 py-1 rounded">
        WGS84 (EPSG:4326) · schematic outline
      </div>
    </div>
  );
}
