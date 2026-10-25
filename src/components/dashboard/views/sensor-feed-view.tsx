"use client";

import { useState } from "react";
import { useLiveSensorData } from "@/hooks/use-live-sensor-data";
import { getParcelsBySite, SITES, type SiteId } from "@/lib/mock-data";
import { LiveChartCard, CHART_COLORS } from "@/components/dashboard/live-chart-card";
import { InterventionsFeed } from "@/components/dashboard/interventions-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Radio, Activity, Wifi, Droplets, Thermometer, Beaker, Wind,
} from "lucide-react";

interface SensorFeedViewProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

export function SensorFeedView({ siteId, selectedParcelId, onSelectParcel }: SensorFeedViewProps) {
  const { live, latest, interventions, latestWeather, lastUpdate } = useLiveSensorData({ siteId, intervalMs: 3000 });
  const parcels = getParcelsBySite(siteId);
  const site = SITES.find(s => s.id === siteId)!;
  const [selectedForChart, setSelectedForChart] = useState<string>(selectedParcelId || parcels[0]?.id || "");

  const selectedParcel = parcels.find(p => p.id === selectedForChart) || parcels[0];
  const selectedBuffer = selectedParcel ? live[selectedParcel.id] : undefined;
  const selectedLatest = selectedParcel ? latest[selectedParcel.id] : null;

  return (
    <div className="space-y-4">
      {/* Module banner with LIVE indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600" />
                <span className="text-base font-semibold text-foreground">NPK Sensor Live Feed</span>
                {/* LIVE badge with pulsing dot */}
                <Badge variant="outline" className="text-[10px] font-semibold border-emerald-400 text-emerald-700">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  LIVE
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Wifi className="w-2.5 h-2.5 mr-1" /> 3s interval
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time NPK probe + weather station telemetry. Pattern auto-detection surfaces plot-specific interventions.
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="text-muted-foreground">Last update</div>
              <div className="font-mono font-semibold text-foreground">
                {new Date(lastUpdate).toLocaleTimeString()}
              </div>
              <div className="text-[10px] text-emerald-700">{parcels.length} sensors active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live weather ticker */}
      {latestWeather && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live Weather — {site.name}
              <Badge variant="outline" className="text-[10px] ml-auto">FAO-56 PM ET₀</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
              <div className="rounded-md border bg-amber-50 p-2">
                <div className="text-[10px] text-amber-700 flex items-center gap-1"><Thermometer className="w-3 h-3" />T_max</div>
                <div className="text-base font-bold text-amber-800 font-mono">{latestWeather.tMax}°C</div>
              </div>
              <div className="rounded-md border bg-blue-50 p-2">
                <div className="text-[10px] text-blue-700 flex items-center gap-1"><Thermometer className="w-3 h-3" />T_min</div>
                <div className="text-base font-bold text-blue-800 font-mono">{latestWeather.tMin}°C</div>
              </div>
              <div className="rounded-md border bg-emerald-50 p-2">
                <div className="text-[10px] text-emerald-700 flex items-center gap-1"><Droplets className="w-3 h-3" />RH</div>
                <div className={cn(
                  "text-base font-bold font-mono",
                  latestWeather.rh > 80 ? "text-rose-700" :
                  latestWeather.rh < 40 ? "text-amber-700" : "text-emerald-700"
                )}>{latestWeather.rh.toFixed(0)}%</div>
              </div>
              <div className="rounded-md border bg-teal-50 p-2">
                <div className="text-[10px] text-teal-700 flex items-center gap-1"><Wind className="w-3 h-3" />Wind</div>
                <div className="text-base font-bold text-teal-800 font-mono">{latestWeather.wind.toFixed(1)} m/s</div>
              </div>
              <div className="rounded-md border bg-yellow-50 p-2">
                <div className="text-[10px] text-yellow-700 flex items-center gap-1"><Activity className="w-3 h-3" />Solar</div>
                <div className="text-base font-bold text-yellow-800 font-mono">{latestWeather.solarRad.toFixed(1)}</div>
              </div>
              <div className="rounded-md border bg-blue-50 p-2">
                <div className="text-[10px] text-blue-700 flex items-center gap-1"><Droplets className="w-3 h-3" />Rain</div>
                <div className="text-base font-bold text-blue-800 font-mono">{latestWeather.rain.toFixed(1)} mm</div>
              </div>
              <div className="rounded-md border bg-orange-50 p-2">
                <div className="text-[10px] text-orange-700 flex items-center gap-1"><Beaker className="w-3 h-3" />ET₀</div>
                <div className="text-base font-bold text-orange-800 font-mono">{latestWeather.et0.toFixed(1)} mm/d</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parcel selector + 4-chart grid for selected parcel */}
      {selectedParcel && selectedBuffer && selectedLatest && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                Live NPK Trends — Parcel Selected
              </CardTitle>
              <select
                value={selectedForChart}
                onChange={e => setSelectedForChart(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm max-w-xs flex-shrink-0"
              >
                {parcels.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.parcelCode} · {p.owner} ({p.areaHa}ha)
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedParcel.parcelCode} · {selectedParcel.cultivar} · stage: {selectedParcel.growthStage} · sown {selectedParcel.sowingDate}
            </p>
          </CardHeader>
          <CardContent>
            {/* Live charts grid — 6 metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <LiveChartCard
                title="Soil Moisture" unit="%"
                values={selectedBuffer.moisture} timestamps={selectedBuffer.timestamps}
                color={CHART_COLORS.blue}
                minThreshold={25} maxThreshold={50}
                height={100}
                icon={Droplets} iconColor="text-blue-600"
              />
              <LiveChartCard
                title="Air Humidity" unit="%"
                values={selectedBuffer.humidity} timestamps={selectedBuffer.timestamps}
                color={CHART_COLORS.teal}
                minThreshold={40} maxThreshold={85}
                height={100}
                icon={Droplets} iconColor="text-teal-600"
              />
              <LiveChartCard
                title="Soil Temperature" unit="°C"
                values={selectedBuffer.soilTemp} timestamps={selectedBuffer.timestamps}
                color={CHART_COLORS.amber}
                minThreshold={15} maxThreshold={30}
                height={100}
                icon={Thermometer} iconColor="text-amber-600"
              />
              <LiveChartCard
                title="Nitrogen (N)" unit="ppm"
                values={selectedBuffer.soilN} timestamps={selectedBuffer.timestamps}
                color={CHART_COLORS.emerald}
                minThreshold={25}
                height={100}
                icon={Beaker} iconColor="text-amber-700"
              />
              <LiveChartCard
                title="Phosphorus (P)" unit="ppm"
                values={selectedBuffer.soilP} timestamps={selectedBuffer.timestamps}
                color={CHART_COLORS.orange}
                minThreshold={10}
                height={100}
                icon={Beaker} iconColor="text-yellow-700"
              />
              <LiveChartCard
                title="Potassium (K)" unit="ppm"
                values={selectedBuffer.soilK} timestamps={selectedBuffer.timestamps}
                color={CHART_COLORS.rose}
                minThreshold={130}
                height={100}
                icon={Beaker} iconColor="text-orange-700"
              />
            </div>

            {/* Latest reading summary */}
            <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
              <div><span className="text-muted-foreground">Moisture</span> <span className={cn("font-mono font-bold", selectedLatest.moisture < 25 ? "text-rose-700" : "text-foreground")}>{selectedLatest.moisture.toFixed(1)}%</span></div>
              <div><span className="text-muted-foreground">Humidity</span> <span className={cn("font-mono font-bold", selectedLatest.humidity > 80 ? "text-rose-700" : "text-foreground")}>{selectedLatest.humidity.toFixed(0)}%</span></div>
              <div><span className="text-muted-foreground">Soil T</span> <span className="font-mono font-bold text-foreground">{selectedLatest.soilTemp.toFixed(1)}°C</span></div>
              <div><span className="text-muted-foreground">N</span> <span className={cn("font-mono font-bold", selectedLatest.soilN < 22 ? "text-rose-700" : "text-foreground")}>{selectedLatest.soilN.toFixed(0)} ppm</span></div>
              <div><span className="text-muted-foreground">P</span> <span className={cn("font-mono font-bold", selectedLatest.soilP < 10 ? "text-rose-700" : "text-foreground")}>{selectedLatest.soilP.toFixed(0)} ppm</span></div>
              <div><span className="text-muted-foreground">K</span> <span className={cn("font-mono font-bold", selectedLatest.soilK < 130 ? "text-rose-700" : "text-foreground")}>{selectedLatest.soilK.toFixed(0)} ppm</span></div>
              <div><span className="text-muted-foreground">pH</span> <span className="font-mono font-bold text-foreground">{selectedLatest.soilPh.toFixed(2)}</span></div>
            </div>

            <div className="mt-2 text-[10px] text-muted-foreground text-center">
              Red dashed line = critical threshold · 30 readings rolling buffer (≈90 seconds) · updates every 3s
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interventions feed */}
      <InterventionsFeed interventions={interventions} maxItems={10} />

      {/* Per-parcel NPK sensor table (live values) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            Per-Parcel Live NPK Readings
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {parcels.length} sensors · live values · click row to select parcel for charts above
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
                  <th className="text-right py-2 px-1.5 text-blue-700 font-medium">Moist<br/><span className="text-[9px] text-muted-foreground font-normal">%</span></th>
                  <th className="text-right py-2 px-1.5 text-emerald-700 font-medium">RH<br/><span className="text-[9px] text-muted-foreground font-normal">%</span></th>
                </tr>
              </thead>
              <tbody>
                {parcels.map(p => {
                  const reading = latest[p.id];
                  if (!reading) return null;
                  const isSelected = p.id === selectedForChart;
                  const lowN = reading.soilN < 25;
                  const lowP = reading.soilP < 10;
                  const lowK = reading.soilK < 150;
                  const lowMoisture = reading.moisture < 25;
                  const hasIntervention = interventions.some(i => i.parcelId === p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => { setSelectedForChart(p.id); onSelectParcel(p.id); }}
                      className={cn(
                        "border-b last:border-0 cursor-pointer transition-colors",
                        isSelected ? "bg-emerald-50" : "hover:bg-muted/50",
                        hasIntervention && !isSelected && "bg-amber-50/40"
                      )}
                    >
                      <td className="py-1.5 pr-2 font-mono font-semibold text-foreground">
                        {p.parcelCode}
                        {hasIntervention && (
                          <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-rose-500" title="Active intervention" />
                        )}
                      </td>
                      <td className="py-1.5 pr-2 text-muted-foreground hidden sm:table-cell text-[11px]">{p.growthStage}</td>
                      <td className={cn("text-right py-1.5 px-1.5 font-mono", lowN ? "text-rose-700 font-semibold" : "text-foreground")}>{reading.soilN.toFixed(1)}</td>
                      <td className={cn("text-right py-1.5 px-1.5 font-mono", lowP ? "text-rose-700 font-semibold" : "text-foreground")}>{reading.soilP.toFixed(1)}</td>
                      <td className={cn("text-right py-1.5 px-1.5 font-mono", lowK ? "text-rose-700 font-semibold" : "text-foreground")}>{reading.soilK.toFixed(0)}</td>
                      <td className="text-right py-1.5 px-1.5 font-mono text-foreground">{reading.soilPh.toFixed(2)}</td>
                      <td className={cn("text-right py-1.5 px-1.5 font-mono font-semibold", lowMoisture ? "text-rose-700" : reading.moisture < 32 ? "text-amber-700" : "text-emerald-700")}>{reading.moisture.toFixed(1)}%</td>
                      <td className={cn("text-right py-1.5 px-1.5 font-mono", reading.humidity > 80 ? "text-rose-700 font-semibold" : "text-foreground")}>{reading.humidity.toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground">
            Red values indicate below-optimal thresholds · rows with amber background have active interventions · rows with red dot have pending advisories
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
