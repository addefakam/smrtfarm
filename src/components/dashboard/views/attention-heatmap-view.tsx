"use client";

import { getParcelsBySite, STATUS_COLORS, type SiteId, type ParcelStatus } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Grid3x3, Filter } from "lucide-react";
import { useState } from "react";

interface AttentionHeatmapViewProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

type MetricKey = "status" | "moisture" | "ndvi" | "disease" | "yield";

const METRIC_CONFIG: Record<MetricKey, { label: string; description: string }> = {
  status:   { label: "Status flag",        description: "Attention priority (disease → irrigate → low_yield → watch → healthy)" },
  moisture: { label: "Soil moisture %",    description: "From NPK sensor — low moisture = urgent" },
  ndvi:     { label: "NDVI",               description: "General canopy vigor — low NDVI = stress" },
  disease:  { label: "Disease severity %", description: "From M2 UAV inference — high severity = urgent" },
  yield:    { label: "Yield forecast t/ha", description: "From M5 IWCYES — low forecast = concern" },
};

function getCellColor(parcel: { soilMoisture: number; ndvi: number; diseaseSeverity: number; yieldForecast: number; status: ParcelStatus }, metric: MetricKey): string {
  switch (metric) {
    case "status":
      return STATUS_COLORS[parcel.status].bg;
    case "moisture":
      return parcel.soilMoisture < 25 ? "bg-rose-500" :
             parcel.soilMoisture < 32 ? "bg-amber-500" :
             parcel.soilMoisture < 40 ? "bg-emerald-400" :
             "bg-emerald-600";
    case "ndvi":
      return parcel.ndvi < 0.5 ? "bg-rose-500" :
             parcel.ndvi < 0.65 ? "bg-amber-500" :
             parcel.ndvi < 0.75 ? "bg-emerald-400" :
             "bg-emerald-600";
    case "disease":
      return parcel.diseaseSeverity > 25 ? "bg-rose-700" :
             parcel.diseaseSeverity > 15 ? "bg-rose-500" :
             parcel.diseaseSeverity > 5 ? "bg-amber-500" :
             "bg-emerald-400";
    case "yield":
      return parcel.yieldForecast < 3.2 ? "bg-rose-500" :
             parcel.yieldForecast < 3.8 ? "bg-amber-500" :
             parcel.yieldForecast < 4.5 ? "bg-emerald-400" :
             "bg-emerald-600";
  }
}

export function AttentionHeatmapView({ siteId, selectedParcelId, onSelectParcel }: AttentionHeatmapViewProps) {
  const parcels = getParcelsBySite(siteId);
  const [metric, setMetric] = useState<MetricKey>("status");

  // Counts for legend
  const statusCounts = parcels.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<ParcelStatus, number>);

  return (
    <div className="space-y-4">
      {/* Metric selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Grid3x3 className="w-4 h-4 text-emerald-600" />
              Parcel Attention Heatmap
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-normal">
              {parcels.length} parcels · {siteId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Color by:</span>
            <div className="flex gap-1 flex-wrap">
              {(Object.keys(METRIC_CONFIG) as MetricKey[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs transition-colors border",
                    metric === m ? "bg-emerald-700 text-white border-emerald-700" : "bg-card hover:bg-muted/50 border-border"
                  )}
                >
                  {METRIC_CONFIG[m].label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{METRIC_CONFIG[metric].description}</p>
        </CardContent>
      </Card>

      {/* Heatmap grid — large */}
      <Card>
        <CardContent className="p-4">
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${Math.min(10, Math.ceil(Math.sqrt(parcels.length * 1.5)))}, minmax(0, 1fr))`,
            }}
          >
            {parcels.map(p => {
              const isSelected = p.id === selectedParcelId;
              const color = getCellColor(p, metric);
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectParcel(p.id)}
                  title={`${p.parcelCode} · ${p.owner}
  Moisture: ${p.soilMoisture}%
  NDVI: ${p.ndvi.toFixed(2)}
  Disease: ${p.diseaseSeverity}%
  Yield: ${p.yieldForecast.toFixed(1)} t/ha
  Status: ${STATUS_COLORS[p.status].label}`}
                  className={cn(
                    "aspect-square rounded-md transition-all hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400",
                    color,
                    isSelected && "ring-2 ring-emerald-900 ring-offset-1 scale-110 shadow-md"
                  )}
                >
                  <span className="sr-only">{p.parcelCode}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Color Legend</CardTitle>
        </CardHeader>
        <CardContent>
          {metric === "status" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {(Object.keys(STATUS_COLORS) as ParcelStatus[]).map(s => {
                const c = STATUS_COLORS[s];
                return (
                  <div key={s} className="rounded-md border p-2 text-center">
                    <div className={cn("w-full h-3 rounded mb-1.5", c.bg)} />
                    <div className={cn("text-xs font-semibold", c.text)}>{c.label}</div>
                    <div className="font-mono text-sm font-bold text-foreground">{statusCounts[s] || 0}</div>
                    <div className="text-[10px] text-muted-foreground">parcels</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {metric === "moisture" && (
                <>
                  <LegendCell color="bg-rose-500" label="<25% (urgent)" />
                  <LegendCell color="bg-amber-500" label="25-32% (watch)" />
                  <LegendCell color="bg-emerald-400" label="32-40% (OK)" />
                  <LegendCell color="bg-emerald-600" label=">40% (wet)" />
                </>
              )}
              {metric === "ndvi" && (
                <>
                  <LegendCell color="bg-rose-500" label="<0.50 (stressed)" />
                  <LegendCell color="bg-amber-500" label="0.50-0.65 (sparse)" />
                  <LegendCell color="bg-emerald-400" label="0.65-0.75 (OK)" />
                  <LegendCell color="bg-emerald-600" label=">0.75 (dense)" />
                </>
              )}
              {metric === "disease" && (
                <>
                  <LegendCell color="bg-emerald-400" label="0% (clean)" />
                  <LegendCell color="bg-amber-500" label="1-15% (mild)" />
                  <LegendCell color="bg-rose-500" label="16-25% (severe)" />
                  <LegendCell color="bg-rose-700" label=">25% (critical)" />
                </>
              )}
              {metric === "yield" && (
                <>
                  <LegendCell color="bg-rose-500" label="<3.2 t/ha (low)" />
                  <LegendCell color="bg-amber-500" label="3.2-3.8" />
                  <LegendCell color="bg-emerald-400" label="3.8-4.5" />
                  <LegendCell color="bg-emerald-600" label=">4.5 t/ha (high)" />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected parcel quick summary */}
      {selectedParcelId && (() => {
        const p = parcels.find(x => x.id === selectedParcelId);
        if (!p) return null;
        const c = STATUS_COLORS[p.status];
        return (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={cn("w-3 h-3 rounded", c.bg)} />
                  <span className="font-mono text-sm font-bold text-foreground">{p.parcelCode}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{p.owner}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{p.areaHa}ha</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span>Moist <span className={cn("font-mono font-semibold", p.soilMoisture < 25 ? "text-rose-700" : "text-foreground")}>{p.soilMoisture}%</span></span>
                  <span>NDVI <span className="font-mono font-semibold text-foreground">{p.ndvi.toFixed(2)}</span></span>
                  <span>Disease <span className={cn("font-mono font-semibold", p.diseaseSeverity > 0 ? "text-rose-700" : "text-foreground")}>{p.diseaseSeverity}%</span></span>
                  <span>Yield <span className="font-mono font-semibold text-emerald-700">{p.yieldForecast.toFixed(1)}t</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}

function LegendCell({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-4 h-4 rounded", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
