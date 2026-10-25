"use client";

import { getParcelsBySite, STATUS_COLORS, type Parcel, type SiteId } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ParcelHeatmapProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

/**
 * Disease & stress heatmap grid — each cell is a parcel.
 * Color encodes status (healthy / watch / irrigate / disease / low_yield).
 * Hover shows parcel code; click selects parcel.
 *
 * This is the "attention mechanism" — visual scan for high-priority parcels.
 */
export function ParcelHeatmap({ siteId, selectedParcelId, onSelectParcel }: ParcelHeatmapProps) {
  const parcels = getParcelsBySite(siteId);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Parcel Status Grid</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {parcels.length} parcels at this AOI · color = attention priority · click to drill down
        </p>
      </div>

      {/* Grid */}
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${Math.min(8, Math.ceil(Math.sqrt(parcels.length * 1.3)))}, minmax(0, 1fr))`,
        }}
      >
        {parcels.map((parcel: Parcel) => {
          const colors = STATUS_COLORS[parcel.status];
          const isSelected = parcel.id === selectedParcelId;
          return (
            <button
              key={parcel.id}
              onClick={() => onSelectParcel(parcel.id)}
              title={`${parcel.parcelCode} · ${parcel.owner} · ${colors.label} · moisture ${parcel.soilMoisture}% · NDVI ${parcel.ndvi} · disease ${parcel.diseaseSeverity}%`}
              className={cn(
                "aspect-square rounded-md transition-all hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400",
                colors.bg,
                isSelected && "ring-2 ring-emerald-900 ring-offset-1 scale-110 shadow-md"
              )}
            >
              <span className="sr-only">{parcel.parcelCode}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px]">
        {(Object.entries(STATUS_COLORS) as [keyof typeof STATUS_COLORS, typeof STATUS_COLORS[keyof typeof STATUS_COLORS]][]).map(([key, c]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-sm", c.bg)} />
            <span className="text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
        <div className="text-xs">
          <span className="text-muted-foreground">High priority:</span>{" "}
          <span className="font-semibold text-rose-700">
            {parcels.filter(p => p.status === "disease").length} disease · {" "}
            {parcels.filter(p => p.status === "irrigate").length} irrigate
          </span>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">Watch list:</span>{" "}
          <span className="font-semibold text-amber-700">
            {parcels.filter(p => p.status === "watch").length} parcels
          </span>
        </div>
      </div>
    </div>
  );
}
