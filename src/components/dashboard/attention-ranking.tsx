"use client";

import { getAttentionRanking, STATUS_COLORS, type SiteId } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Droplets, TrendingDown, Leaf } from "lucide-react";

interface AttentionRankingProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

const STATUS_ICON: Record<string, React.ElementType> = {
  disease: AlertTriangle,
  irrigate: Droplets,
  low_yield: TrendingDown,
  watch: Leaf,
  healthy: Leaf,
};

export function AttentionRanking({ siteId, selectedParcelId, onSelectParcel }: AttentionRankingProps) {
  const ranking = getAttentionRanking(siteId, 8);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Attention Ranking</span>
          <Badge variant="outline" className="text-[10px] font-normal">
            Top {ranking.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {ranking.map((parcel, idx) => {
          const colors = STATUS_COLORS[parcel.status];
          const Icon = STATUS_ICON[parcel.status] || Leaf;
          const isSelected = parcel.id === selectedParcelId;
          return (
            <button
              key={parcel.id}
              onClick={() => onSelectParcel(parcel.id)}
              className={cn(
                "w-full text-left rounded-md p-2.5 transition-colors border",
                isSelected
                  ? "bg-emerald-50 border-emerald-400"
                  : "bg-card border-border hover:bg-muted/50 hover:border-emerald-200"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <span
                    className={cn(
                      "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold text-white",
                      colors.bg
                    )}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {parcel.parcelCode}
                      </span>
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", colors.text, "bg-current/10")} style={{ backgroundColor: "currentColor" }}>
                        <span className={colors.text} style={{ mixBlendMode: "normal" }}>
                          {colors.label}
                        </span>
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {parcel.owner} · {parcel.areaHa} ha
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {parcel.growthStage}
                    </div>
                  </div>
                </div>
                <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", colors.text)} />
              </div>

              {/* Mini metrics row */}
              <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
                <div>
                  <div className="text-muted-foreground">Moisture</div>
                  <div className={cn("font-semibold", parcel.soilMoisture < 25 ? "text-rose-600" : parcel.soilMoisture < 32 ? "text-amber-600" : "text-emerald-600")}>
                    {parcel.soilMoisture}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">NDVI</div>
                  <div className={cn("font-semibold", parcel.ndvi < 0.5 ? "text-rose-600" : parcel.ndvi < 0.65 ? "text-amber-600" : "text-emerald-600")}>
                    {parcel.ndvi.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Disease</div>
                  <div className={cn("font-semibold", parcel.diseaseSeverity > 15 ? "text-rose-600" : parcel.diseaseSeverity > 5 ? "text-amber-600" : "text-emerald-600")}>
                    {parcel.diseaseSeverity}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Yield</div>
                  <div className="font-semibold text-foreground">
                    {parcel.yieldForecast.toFixed(1)}t
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
