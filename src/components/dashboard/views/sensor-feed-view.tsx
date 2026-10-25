"use client";

import { getParcelsBySite, SITES, type SiteId, type Parcel } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Radio, Activity, Wifi } from "lucide-react";

interface SensorFeedViewProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 16;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-4" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="1.5" fill={color} />
    </svg>
  );
}

export function SensorFeedView({ siteId, selectedParcelId, onSelectParcel }: SensorFeedViewProps) {
  const parcels = getParcelsBySite(siteId);
  const site = SITES.find(s => s.id === siteId)!;

  return (
    <div className="space-y-4">
      {/* Module banner */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600" />
                <span className="text-base font-semibold text-foreground">NPK Sensor Live Feed</span>
                <Badge variant="outline" className="text-[10px]">
                  <Wifi className="w-2.5 h-2.5 mr-1" /> MQTT/HTTPS
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Edge gateway → Firebase RTDB → dashboard. Offline-tolerant sync with 7-day local cache.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground">Active sensors</div>
                <div className="text-lg font-bold text-emerald-700">{parcels.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Last sync</div>
                <div className="text-lg font-bold text-foreground">{new Date().toLocaleTimeString().slice(0, 5)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Connectivity</div>
                <div className="text-sm font-bold text-emerald-700 mt-1">4G · stable</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site-level readings (weather from station) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            AOI Station — Real-Time Readings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
            <div className="rounded-md border bg-amber-50 p-2">
              <div className="text-[10px] text-amber-700">T_max</div>
              <div className="font-mono text-base font-bold text-amber-800">{site.weatherToday.t_max}°C</div>
            </div>
            <div className="rounded-md border bg-blue-50 p-2">
              <div className="text-[10px] text-blue-700">T_min</div>
              <div className="font-mono text-base font-bold text-blue-800">{site.weatherToday.t_min}°C</div>
            </div>
            <div className="rounded-md border bg-emerald-50 p-2">
              <div className="text-[10px] text-emerald-700">RH (air)</div>
              <div className="font-mono text-base font-bold text-emerald-800">{site.weatherToday.rh}%</div>
            </div>
            <div className="rounded-md border bg-teal-50 p-2">
              <div className="text-[10px] text-teal-700">Wind</div>
              <div className="font-mono text-base font-bold text-teal-800">{site.weatherToday.wind_speed}m/s</div>
            </div>
            <div className="rounded-md border bg-yellow-50 p-2">
              <div className="text-[10px] text-yellow-700">Solar rad</div>
              <div className="font-mono text-base font-bold text-yellow-800">{site.weatherToday.solar_rad}</div>
            </div>
            <div className="rounded-md border bg-orange-50 p-2">
              <div className="text-[10px] text-orange-700">ET₀</div>
              <div className="font-mono text-base font-bold text-orange-800">{site.weatherToday.et0}mm/d</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-parcel NPK sensor table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            Per-Parcel NPK Sensor Readings
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {parcels.length} sensors · live readings from in-situ probes · click to inspect parcel
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Parcel</th>
                  <th className="text-left py-2 pr-2 text-muted-foreground font-medium hidden sm:table-cell">Stage</th>
                  <th className="text-right py-2 px-1.5 text-amber-700 font-medium">N<br/><span className="text-[9px] text-muted-foreground font-normal">ppm</span></th>
                  <th className="text-right py-2 px-1.5 text-yellow-700 font-medium">P<br/><span className="text-[9px] text-muted-foreground font-normal">ppm</span></th>
                  <th className="text-right py-2 px-1.5 text-orange-700 font-medium">K<br/><span className="text-[9px] text-muted-foreground font-normal">ppm</span></th>
                  <th className="text-right py-2 px-1.5 text-muted-foreground font-medium">pH</th>
                  <th className="text-right py-2 px-1.5 text-muted-foreground font-medium">EC<br/><span className="text-[9px] text-muted-foreground font-normal">dS/m</span></th>
                  <th className="text-right py-2 px-1.5 text-blue-700 font-medium">Moist<br/><span className="text-[9px] text-muted-foreground font-normal">%</span></th>
                  <th className="text-right py-2 px-1.5 text-emerald-700 font-medium">RH<br/><span className="text-[9px] text-muted-foreground font-normal">%</span></th>
                  <th className="text-center py-2 px-1.5 text-muted-foreground font-medium hidden md:table-cell">Moist 7d</th>
                </tr>
              </thead>
              <tbody>
                {parcels.map((p: Parcel) => {
                  const isSelected = p.id === selectedParcelId;
                  const lowN = p.soilN < 25;
                  const lowP = p.soilP < 10;
                  const lowK = p.soilK < 150;
                  const lowMoisture = p.soilMoisture < 25;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectParcel(p.id)}
                      className={cn(
                        "border-b last:border-0 cursor-pointer transition-colors",
                        isSelected ? "bg-emerald-50" : "hover:bg-muted/50"
                      )}
                    >
                      <td className="py-1.5 pr-2 font-mono font-semibold text-foreground">{p.parcelCode}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground hidden sm:table-cell text-[11px]">{p.growthStage}</td>
                      <td className={cn("text-right py-1.5 px-1.5 font-mono", lowN ? "text-rose-700 font-semibold" : "text-foreground")}>{p.soilN}</td>
                      <td className={cn("text-right py-1.5 px-1.5 font-mono", lowP ? "text-rose-700 font-semibold" : "text-foreground")}>{p.soilP}</td>
                      <td className={cn("text-right py-1.5 px-1.5 font-mono", lowK ? "text-rose-700 font-semibold" : "text-foreground")}>{p.soilK}</td>
                      <td className="text-right py-1.5 px-1.5 font-mono text-foreground">{p.soilPh}</td>
                      <td className="text-right py-1.5 px-1.5 font-mono text-foreground">{p.soilEc}</td>
                      <td className={cn("text-right py-1.5 px-1.5 font-mono font-semibold", lowMoisture ? "text-rose-700" : p.soilMoisture < 32 ? "text-amber-700" : "text-emerald-700")}>{p.soilMoisture}%</td>
                      <td className="text-right py-1.5 px-1.5 font-mono text-foreground">{p.humidity}%</td>
                      <td className="py-1.5 px-1.5 hidden md:table-cell">
                        <div className="w-16 mx-auto">
                          <Sparkline data={p.moistureTrend7d} color={lowMoisture ? "#C0392B" : "#1B5347"} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground">
            Red values indicate below-optimal thresholds (N&lt;25, P&lt;10, K&lt;150 ppm, Moist&lt;25%)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
