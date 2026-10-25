"use client";

import { SITES, getParcelsBySite, STATUS_COLORS, type SiteId, type Parcel } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Layers, Map as MapIcon } from "lucide-react";

interface MapViewProps {
  siteId: SiteId;
  onSelectSite: (id: SiteId) => void;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

export function MapView({ siteId, onSelectSite, selectedParcelId, onSelectParcel }: MapViewProps) {
  const parcels = getParcelsBySite(siteId);
  const site = SITES.find(s => s.id === siteId)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Big map */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-emerald-600" />
              Ethiopia — Three Pilot AOIs
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-normal">
              WGS84 (EPSG:4326)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-[4/3] w-full">
            <EthiopiaMapInline
              selectedSiteId={siteId}
              onSelectSite={onSelectSite}
            />
          </div>
          <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs">
            {SITES.map(s => (
              <div key={s.id} className="text-center">
                <div className="text-muted-foreground text-[10px]">{s.name}</div>
                <div className="font-mono text-foreground">{s.lat.toFixed(4)}°N</div>
                <div className="font-mono text-foreground">{s.lon.toFixed(4)}°E</div>
                <div className="text-[10px] text-muted-foreground">{s.elevation}m</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parcel list (shapefile-verified) */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Parcels — {site.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {parcels.length} parcels · shapefile-bound · click to select
          </p>
        </CardHeader>
        <CardContent>
          <div className="max-h-[480px] overflow-y-auto pr-1 space-y-1">
            {parcels.map((p: Parcel) => {
              const colors = STATUS_COLORS[p.status];
              const isSelected = p.id === selectedParcelId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectParcel(p.id)}
                  className={cn(
                    "w-full text-left rounded-md border p-2 transition-colors",
                    isSelected ? "bg-emerald-50 border-emerald-400" : "bg-card border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">{p.parcelCode}</span>
                        <span className={cn("inline-block w-2 h-2 rounded-full", colors.bg)} />
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">{p.owner}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{p.areaHa}ha</span>
                        <span>·</span>
                        <span>{p.parcelShape}</span>
                        <span>·</span>
                        <span>{p.cultivar}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 text-[10px]">
                      <div className={cn("font-semibold", p.ndvi < 0.55 ? "text-amber-700" : "text-emerald-700")}>
                        NDVI {p.ndvi.toFixed(2)}
                      </div>
                      <div className="text-muted-foreground">
                        {p.uavImageCount} imgs
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline mini-Ethiopia map (reuses the SVG without legend overlay for the larger map view)
import { ETHIOPIA_OUTLINE } from "@/lib/mock-data";
function EthiopiaMapInline({ selectedSiteId, onSelectSite }: {
  selectedSiteId: SiteId;
  onSelectSite: (id: SiteId) => void;
}) {
  const VIEWBOX = "33 3 16 12.5";
  const toSvg = ([lon, lat]: [number, number]): [number, number] => [lon, 15.5 - lat];
  const outline = ETHIOPIA_OUTLINE.map(toSvg);
  const path = outline.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ") + " Z";

  return (
    <div className="relative w-full h-full">
      <svg viewBox={VIEWBOX} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="mapEthFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EDF5F2" />
            <stop offset="100%" stopColor="#D9EAE3" />
          </linearGradient>
          <radialGradient id="mapPulse">
            <stop offset="0%" stopColor="#2A7A65" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2A7A65" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={path} fill="url(#mapEthFill)" stroke="#515A5A" strokeWidth="0.04" strokeLinejoin="round" />
        <text x="40.5" y="9" fontSize="1.2" fill="#515A5A" opacity="0.18" textAnchor="middle" fontWeight="bold">ETHIOPIA</text>
        {/* Addis Ababa */}
        {(() => {
          const [x, y] = toSvg([38.7469, 9.0250]);
          return (
            <g>
              <circle cx={x} cy={y} r="0.16" fill="#515A5A" />
              <text x={x + 0.25} y={y - 0.05} fontSize="0.42" fill="#515A5A" opacity="0.8">Addis Ababa</text>
            </g>
          );
        })()}
        {SITES.map(site => {
          const [x, y] = toSvg([site.lon, site.lat]);
          const isSelected = site.id === selectedSiteId;
          const color = isSelected ? "#1B5347" : "#2A7A65";
          const size = isSelected ? 0.42 : 0.32;
          return (
            <g key={site.id} className="cursor-pointer" onClick={() => onSelectSite(site.id)}>
              {site.activeAlerts > 0 && (
                <circle cx={x} cy={y} r={size + 0.22} fill="url(#mapPulse)" className="animate-pulse" />
              )}
              {isSelected && (
                <circle cx={x} cy={y} r={size + 0.25} fill="none" stroke="#C89F62" strokeWidth="0.06" strokeDasharray="0.2 0.1" />
              )}
              <circle cx={x} cy={y} r={size} fill={color} stroke="white" strokeWidth="0.05" />
              <text x={x + size + 0.18} y={y + 0.08} fontSize="0.48" fill={isSelected ? "#1B5347" : "#1A1A1A"} fontWeight={isSelected ? "bold" : "normal"}>
                {site.name}
              </text>
              <text x={x + size + 0.18} y={y + 0.55} fontSize="0.32" fill="#515A5A">
                {site.parcelCount} parcels · {site.elevation}m
              </text>
              {site.activeAlerts > 0 && (
                <g>
                  <circle cx={x - size - 0.08} cy={y - size - 0.08} r="0.22" fill="#C0392B" stroke="white" strokeWidth="0.04" />
                  <text x={x - size - 0.08} y={y - size - 0.02} fontSize="0.3" fill="white" textAnchor="middle" fontWeight="bold">
                    {site.activeAlerts}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute top-2 right-2 text-[10px] text-muted-foreground bg-white/80 px-2 py-1 rounded">
        Click any AOI marker to switch site
      </div>
    </div>
  );
}
