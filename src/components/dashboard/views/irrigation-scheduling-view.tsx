"use client";

import { SITES, getParcelsBySite, type SiteId, type Parcel } from "@/lib/mock-data";
import { useLiveSensorData } from "@/hooks/use-live-sensor-data";
import { InterventionsFeed } from "@/components/dashboard/interventions-feed";
import { LiveChartCard, CHART_COLORS } from "@/components/dashboard/live-chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Droplets, CloudRain, Thermometer, Wind, Sun, Cloud, Gauge, Activity } from "lucide-react";

interface IrrigationSchedulingViewProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

export function IrrigationSchedulingView({ siteId, selectedParcelId, onSelectParcel }: IrrigationSchedulingViewProps) {
  const site = SITES.find(s => s.id === siteId)!;
  const parcels = getParcelsBySite(siteId);
  // Live weather + per-parcel moisture for real-time scheduling
  const { latestWeather, latest, live, interventions, lastUpdate } = useLiveSensorData({ siteId, intervalMs: 3000 });
  const weather = latestWeather ?? site.weatherToday;

  // Sort by soil-water depletion (highest = most urgent)
  const sortedParcels = [...parcels].sort((a, b) => b.soilWaterDepletion - a.soilWaterDepletion);
  const needIrrigation = parcels.filter(p => p.irrigationAdvisoryMm > 0);
  const totalWaterM3 = needIrrigation.reduce((s, p) => s + Math.round(p.irrigationAdvisoryMm * p.areaHa * 10), 0);

  const selectedParcel: Parcel | null = selectedParcelId
    ? parcels.find(p => p.id === selectedParcelId) ?? null
    : sortedParcels[0] ?? null;

  return (
    <div className="space-y-4">
      {/* Today's weather banner */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-600" />
            Today's Weather — {site.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{weather.date} · FAO-56 Penman-Monteith reference ET₀</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="rounded-md bg-amber-50 border border-amber-200 p-2">
              <div className="text-[10px] text-amber-700 flex items-center gap-1"><Thermometer className="w-3 h-3" />T_max</div>
              <div className="text-base font-bold text-amber-800">{weather.t_max}°C</div>
            </div>
            <div className="rounded-md bg-blue-50 border border-blue-200 p-2">
              <div className="text-[10px] text-blue-700 flex items-center gap-1"><Thermometer className="w-3 h-3" />T_min</div>
              <div className="text-base font-bold text-blue-800">{weather.t_min}°C</div>
            </div>
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2">
              <div className="text-[10px] text-emerald-700 flex items-center gap-1"><Cloud className="w-3 h-3" />RH</div>
              <div className="text-base font-bold text-emerald-800">{weather.rh}%</div>
            </div>
            <div className="rounded-md bg-teal-50 border border-teal-200 p-2">
              <div className="text-[10px] text-teal-700 flex items-center gap-1"><Wind className="w-3 h-3" />Wind</div>
              <div className="text-base font-bold text-teal-800">{weather.wind_speed} m/s</div>
            </div>
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-2">
              <div className="text-[10px] text-yellow-700 flex items-center gap-1"><Sun className="w-3 h-3" />Solar rad</div>
              <div className="text-base font-bold text-yellow-800">{weather.solar_rad}</div>
              <div className="text-[9px] text-yellow-700">MJ/m²/d</div>
            </div>
            <div className="rounded-md bg-blue-50 border border-blue-200 p-2">
              <div className="text-[10px] text-blue-700 flex items-center gap-1"><CloudRain className="w-3 h-3" />Rain</div>
              <div className="text-base font-bold text-blue-800">{weather.rain}<span className="text-[9px]"> mm</span></div>
            </div>
            <div className="rounded-md bg-orange-50 border border-orange-200 p-2">
              <div className="text-[10px] text-orange-700 flex items-center gap-1"><Gauge className="w-3 h-3" />ET₀</div>
              <div className="text-base font-bold text-orange-800">{weather.et0}<span className="text-[9px]"> mm/d</span></div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground text-center">
            ET₀ drives the soil-water balance; rain reduces net irrigation requirement
          </div>
        </CardContent>
      </Card>

      {/* Irrigation summary banner */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Parcels to irrigate today</div>
              <div className="text-2xl font-bold text-blue-700">{needIrrigation.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total water needed</div>
              <div className="text-2xl font-bold text-blue-700">{(totalWaterM3 / 1000).toFixed(1)}k <span className="text-xs font-normal">m³</span></div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Site mean depletion</div>
              <div className="text-2xl font-bold text-amber-700">
                {(parcels.reduce((s, p) => s + p.soilWaterDepletion, 0) / parcels.length).toFixed(0)}<span className="text-xs font-normal"> mm</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Methodology</div>
              <div className="text-sm font-bold text-foreground mt-1">FAO-56 dual Kc</div>
              <div className="text-[10px] text-muted-foreground">Allen et al. 1998</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Irrigation queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              Irrigation Queue — Sorted by Depletion
            </CardTitle>
            <p className="text-xs text-muted-foreground">Click any parcel to see soil-water balance breakdown</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
              {sortedParcels.map(p => {
                const isSelected = p.id === selectedParcel?.id;
                const needsIrrigation = p.irrigationAdvisoryMm > 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectParcel(p.id)}
                    className={cn(
                      "w-full text-left rounded-md border p-2.5 transition-colors",
                      isSelected ? "bg-blue-50 border-blue-400" : "bg-card border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">{p.parcelCode}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{p.owner}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Stage: {p.growthStage} · Kc: {p.currentKc} · Last irrig: {p.lastIrrigationDays}d ago
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right flex-shrink-0">
                        <div>
                          <div className="text-[9px] text-muted-foreground">Depletion</div>
                          <div className={cn(
                            "font-mono text-xs font-bold",
                            p.soilWaterDepletion > 50 ? "text-rose-700" :
                            p.soilWaterDepletion > 30 ? "text-amber-700" : "text-emerald-700"
                          )}>
                            {p.soilWaterDepletion}mm
                          </div>
                        </div>
                        <div className={cn(
                          "rounded px-2 py-0.5",
                          needsIrrigation ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <div className="text-[9px]">{needsIrrigation ? "Apply" : "OK"}</div>
                          <div className="font-bold text-xs">{needsIrrigation ? `${p.irrigationAdvisoryMm}mm` : "—"}</div>
                        </div>
                      </div>
                    </div>
                    {/* Moisture progress */}
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">Soil moisture</span>
                        <span className={cn(
                          "font-mono font-semibold",
                          p.soilMoisture < 25 ? "text-rose-600" :
                          p.soilMoisture < 32 ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {p.soilMoisture}% {needsIrrigation && <span className="text-blue-700">(below MAD)</span>}
                        </span>
                      </div>
                      <Progress
                        value={p.soilMoisture}
                        className={cn("h-1.5",
                          p.soilMoisture < 25 ? "[&>div]:bg-rose-500" :
                          p.soilMoisture < 32 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected parcel soil-water balance detail */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600" />
              Soil-Water Balance
            </CardTitle>
            {selectedParcel && (
              <p className="text-xs text-muted-foreground">{selectedParcel.parcelCode} · {selectedParcel.owner}</p>
            )}
          </CardHeader>
          <CardContent>
            {selectedParcel && (
              <div className="space-y-3">
                {/* Moisture gauge */}
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Current soil moisture</div>
                  <div className="text-4xl font-bold text-foreground">
                    {selectedParcel.soilMoisture}<span className="text-lg text-muted-foreground">%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Field capacity ~50% · PWP ~10%</div>
                </div>

                {/* Depletion bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Soil-water depletion</span>
                    <span className="font-mono font-bold text-foreground">{selectedParcel.soilWaterDepletion} mm</span>
                  </div>
                  <Progress value={Math.min(100, selectedParcel.soilWaterDepletion)} className="h-2.5 [&>div]:bg-amber-500" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>MAD threshold ~30mm</span>
                    <span>Max ~80mm</span>
                  </div>
                </div>

                {/* Crop coefficients */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-muted/50 border p-2">
                    <div className="text-[10px] text-muted-foreground">Kc (single)</div>
                    <div className="text-lg font-bold text-foreground">{selectedParcel.currentKc}</div>
                  </div>
                  <div className="rounded-md bg-muted/50 border p-2">
                    <div className="text-[10px] text-muted-foreground">Kcb (basal)</div>
                    <div className="text-lg font-bold text-foreground">{selectedParcel.currentKcb}</div>
                  </div>
                </div>

                {/* NPK sensor readings */}
                <div className="rounded-md border bg-amber-50/50 p-2.5">
                  <div className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" /> NPK Sensor Readings
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">N</span><span className="font-mono font-semibold text-foreground">{selectedParcel.soilN} ppm</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">P (Olsen)</span><span className="font-mono font-semibold text-foreground">{selectedParcel.soilP} ppm</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">K (exch.)</span><span className="font-mono font-semibold text-foreground">{selectedParcel.soilK} ppm</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">pH</span><span className="font-mono font-semibold text-foreground">{selectedParcel.soilPh}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">EC</span><span className="font-mono font-semibold text-foreground">{selectedParcel.soilEc} dS/m</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Soil T</span><span className="font-mono font-semibold text-foreground">{selectedParcel.soilTemp}°C</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Air RH</span><span className="font-mono font-semibold text-foreground">{selectedParcel.humidity}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Sensor</span><span className="font-mono font-semibold text-emerald-700">Live</span></div>
                  </div>
                </div>

                {/* Recommendation */}
                {selectedParcel.irrigationAdvisoryMm > 0 ? (
                  <div className="rounded-md bg-blue-50 border border-blue-300 p-3 text-center">
                    <div className="text-[11px] text-blue-700 font-medium">Today's recommendation</div>
                    <div className="text-2xl font-bold text-blue-700 mt-0.5">
                      {selectedParcel.irrigationAdvisoryMm} mm
                    </div>
                    <div className="text-[10px] text-blue-700">
                      = {Math.round(selectedParcel.irrigationAdvisoryMm * selectedParcel.areaHa * 10)} m³ on {selectedParcel.areaHa} ha
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-emerald-50 border border-emerald-300 p-3 text-center">
                    <div className="text-[11px] text-emerald-700 font-medium">Status</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">No irrigation needed today</div>
                    <div className="text-[10px] text-emerald-600">Soil moisture above MAD threshold</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7-day ET₀ & rain trend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-600" />
            7-Day Weather History & ET₀ Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {site.weather7d.map((w, i) => (
              <div key={i} className="rounded-md border p-2 text-center text-[10px]">
                <div className="text-muted-foreground">{w.date.slice(5)}</div>
                <div className="font-semibold text-amber-700 mt-0.5">{w.t_max}°/{w.t_min}°</div>
                <div className="text-blue-700">{w.rain}mm rain</div>
                <div className="text-orange-700 font-bold">{w.et0} ET₀</div>
                <div className="text-muted-foreground mt-0.5">RH {w.rh}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live charts: ET₀ + RH + selected parcel moisture */}
      {selectedParcel && live[selectedParcel.id] && latest[selectedParcel.id] && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Live Pattern Tracking
                <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 font-semibold">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  LIVE
                </Badge>
              </CardTitle>
              <div className="text-[10px] text-muted-foreground">
                Last update: <span className="font-mono font-semibold text-foreground">{new Date(lastUpdate).toLocaleTimeString()}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedParcel.parcelCode} · {selectedParcel.owner} · 3s interval · 30-point rolling buffer (~90s window)
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <LiveChartCard
                title="Soil Moisture" unit="%"
                values={live[selectedParcel.id].moisture}
                timestamps={live[selectedParcel.id].timestamps}
                color={CHART_COLORS.blue}
                minThreshold={25} maxThreshold={50}
                height={130}
                icon={Droplets} iconColor="text-blue-600"
              />
              <LiveChartCard
                title="Reference ET₀" unit="mm/d"
                values={live[selectedParcel.id].soilTemp.length > 0 ?
                  Array.from({ length: live[selectedParcel.id].soilTemp.length }, (_, i) =>
                    Math.round((0.0023 * weather.solarRad * (live[selectedParcel.id].soilTemp[i] + 17.8) *
                      Math.sqrt(Math.max(0.1, weather.tMax - weather.tMin))) * 10) / 10
                  ) : []}
                timestamps={live[selectedParcel.id].timestamps}
                color={CHART_COLORS.orange}
                minThreshold={3}
                height={130}
                icon={Gauge} iconColor="text-orange-600"
              />
              <LiveChartCard
                title="Air Humidity" unit="%"
                values={live[selectedParcel.id].humidity}
                timestamps={live[selectedParcel.id].timestamps}
                color={CHART_COLORS.teal}
                minThreshold={40} maxThreshold={85}
                height={130}
                icon={Droplets} iconColor="text-teal-600"
              />
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground text-center">
              Red dashed line = critical threshold · live ET₀ recomputed every tick from soil T + solar radiation
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-detected interventions */}
      <InterventionsFeed interventions={interventions} maxItems={8} />
    </div>
  );
}
