"use client";

import { getParcelsBySite, type SiteId } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, CheckCircle2, Clock } from "lucide-react";

interface IrrigationAdvisoryProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

export function IrrigationAdvisory({ siteId, selectedParcelId, onSelectParcel }: IrrigationAdvisoryProps) {
  const parcels = getParcelsBySite(siteId);
  const irrigateToday = parcels.filter(p => p.irrigationAdvisoryMm > 0);
  const noIrrigation = parcels.filter(p => p.irrigationAdvisoryMm === 0);
  const totalWaterM3 = irrigateToday.reduce(
    (sum, p) => sum + Math.round(p.irrigationAdvisoryMm * p.areaHa * 10),
    0
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-600" />
            Irrigation Advisory
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-normal">
            FAO-56
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary banner */}
        <div className="rounded-md bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 p-3 mb-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[10px] text-muted-foreground">To irrigate</div>
              <div className="text-lg font-bold text-blue-700">{irrigateToday.length}</div>
              <div className="text-[10px] text-muted-foreground">parcels</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Total water</div>
              <div className="text-lg font-bold text-blue-700">{(totalWaterM3 / 1000).toFixed(1)}k</div>
              <div className="text-[10px] text-muted-foreground">m³ today</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">On schedule</div>
              <div className="text-lg font-bold text-emerald-700">{noIrrigation.length}</div>
              <div className="text-[10px] text-muted-foreground">parcels</div>
            </div>
          </div>
        </div>

        {/* Advisory list */}
        <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
          {irrigateToday.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-6">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
              No irrigation required today. All parcels above MAD threshold.
            </div>
          )}
          {irrigateToday.map(parcel => {
            const isSelected = parcel.id === selectedParcelId;
            const waterM3 = Math.round(parcel.irrigationAdvisoryMm * parcel.areaHa * 10);
            return (
              <button
                key={parcel.id}
                onClick={() => onSelectParcel(parcel.id)}
                className={`w-full text-left rounded-md border p-2 transition-colors ${
                  isSelected
                    ? "bg-blue-50 border-blue-400"
                    : "bg-card border-border hover:bg-blue-50/50 hover:border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">{parcel.parcelCode}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{parcel.owner}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Last irrigated {parcel.lastIrrigationDays}d ago</span>
                      <span>·</span>
                      <span>Moisture {parcel.soilMoisture}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-blue-700">{parcel.irrigationAdvisoryMm} mm</div>
                    <div className="text-[10px] text-muted-foreground">{waterM3} m³</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
