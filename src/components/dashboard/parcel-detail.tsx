"use client";

import { getParcelsBySite, STATUS_COLORS, type SiteId, type Parcel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, User, Calendar, TrendingUp, Droplets, Leaf, AlertCircle } from "lucide-react";

interface ParcelDetailProps {
  siteId: SiteId;
  selectedParcelId: string | null;
}

function Sparkline({ data, color, label, suffix }: { data: number[]; color: string; label: string; suffix: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{data[data.length - 1]}{suffix}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-7" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r="1.5"
          fill={color}
        />
      </svg>
    </div>
  );
}

export function ParcelDetail({ siteId, selectedParcelId }: ParcelDetailProps) {
  const parcels = getParcelsBySite(siteId);
  const parcel: Parcel | null = selectedParcelId
    ? parcels.find(p => p.id === selectedParcelId) ?? null
    : parcels[0] ?? null;

  if (!parcel) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground text-sm py-12">
          No parcel selected.
        </CardContent>
      </Card>
    );
  }

  const colors = STATUS_COLORS[parcel.status];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Parcel Detail</CardTitle>
          <Badge variant="outline" className={cn("text-[10px]", colors.text)}>
            {colors.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Parcel header */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-lg font-bold text-foreground">{parcel.parcelCode}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3" /> {parcel.owner}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-foreground">{parcel.areaHa} ha</div>
              <div className="text-[10px] text-muted-foreground">area</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] mt-2 pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Sown:</span>
              <span className="font-medium text-foreground">{parcel.sowingDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Stage:</span>
              <span className="font-medium text-foreground">{parcel.growthStage}</span>
            </div>
          </div>
        </div>

        {/* Soil moisture */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Droplets className="w-3 h-3" /> Soil moisture
            </span>
            <span className={cn("font-mono font-semibold", parcel.soilMoisture < 25 ? "text-rose-600" : parcel.soilMoisture < 32 ? "text-amber-600" : "text-emerald-600")}>
              {parcel.soilMoisture}% · {parcel.soilTemp}°C
            </span>
          </div>
          <Progress value={parcel.soilMoisture} className={cn("h-2", parcel.soilMoisture < 25 ? "[&>div]:bg-rose-500" : parcel.soilMoisture < 32 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500")} />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0% (PWP)</span>
            <span>25% (MAD)</span>
            <span>50% (FC)</span>
          </div>
        </div>

        {/* NDVI */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NDVI
            </span>
            <span className={cn("font-mono font-semibold", parcel.ndvi < 0.5 ? "text-rose-600" : parcel.ndvi < 0.65 ? "text-amber-600" : "text-emerald-600")}>
              {parcel.ndvi.toFixed(2)}
            </span>
          </div>
          <Progress value={parcel.ndvi * 100} className="h-2 [&>div]:bg-emerald-500" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0.0 (bare soil)</span>
            <span>0.5 (sparse)</span>
            <span>1.0 (dense)</span>
          </div>
        </div>

        {/* 7-day trends */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Sparkline data={parcel.ndviTrend7d} color="#1B5347" label="NDVI 7d" suffix="" />
          <Sparkline data={parcel.moistureTrend7d} color="#1A5276" label="Moisture 7d" suffix="%" />
        </div>

        {/* Disease */}
        <div className={cn(
          "rounded-md p-2.5 border",
          parcel.diseaseSeverity > 0 ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1">
              <AlertCircle className={cn("w-3.5 h-3.5", parcel.diseaseSeverity > 0 ? "text-rose-600" : "text-emerald-600")} />
              Disease status
            </span>
            <span className={cn("font-mono text-xs font-semibold", parcel.diseaseSeverity > 0 ? "text-rose-700" : "text-emerald-700")}>
              {parcel.diseaseSeverity > 0 ? `${parcel.diseaseSeverity}% affected` : "No disease detected"}
            </span>
          </div>
          {parcel.diseaseClass && (
            <div className="text-[11px] text-rose-700 mt-1">
              Detected: <span className="font-semibold">{parcel.diseaseClass}</span> · advisory: fungicide application recommended
            </div>
          )}
        </div>

        {/* Yield forecast */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2">
            <div className="text-[10px] text-emerald-700">Yield forecast</div>
            <div className="text-lg font-bold text-emerald-700">{parcel.yieldForecast.toFixed(1)} <span className="text-[10px] font-normal">t/ha</span></div>
          </div>
          <div className="rounded-md bg-muted/50 border border-border p-2">
            <div className="text-[10px] text-muted-foreground">NDRE</div>
            <div className="text-lg font-bold text-foreground">{parcel.ndre.toFixed(2)}</div>
          </div>
        </div>

        {/* Irrigation advisory */}
        {parcel.irrigationAdvisoryMm > 0 ? (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-2.5">
            <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" /> Irrigation advisory (today)
            </div>
            <div className="text-base font-bold text-blue-700 mt-0.5">
              Apply {parcel.irrigationAdvisoryMm} mm · {Math.round(parcel.irrigationAdvisoryMm * parcel.areaHa * 10)} m³ water
            </div>
            <div className="text-[10px] text-blue-600 mt-1">
              Last irrigated {parcel.lastIrrigationDays} day(s) ago · soil-water depletion exceeded MAD threshold
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-muted/30 border border-border p-2.5">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" /> No irrigation needed today
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Last irrigated {parcel.lastIrrigationDays} day(s) ago · soil moisture adequate
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
