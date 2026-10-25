"use client";

import dynamic from "next/dynamic";
import { SITES, getParcelsBySite, STATUS_COLORS, type SiteId, type Parcel } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Layers, Map as MapIcon } from "lucide-react";

// Leaflet map — dynamic import (ssr: false) avoids Next.js SSR issues
const LeafletMap = dynamic(() => import("@/components/dashboard/leaflet-map").then(m => m.default), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted/30 animate-pulse rounded-md flex items-center justify-center text-sm text-muted-foreground">Loading Leaflet map…</div>,
});

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
      {/* Big Leaflet map */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-emerald-600" />
              Leaflet Map — Ethiopia Pilot AOIs
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-normal">
              OpenStreetMap · EPSG:4326
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-[4/3] w-full">
            <LeafletMap
              selectedSiteId={siteId}
              onSelectSite={onSelectSite}
              height="100%"
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
