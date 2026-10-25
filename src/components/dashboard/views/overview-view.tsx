"use client";

import { useLiveSensorData } from "@/hooks/use-live-sensor-data";
import { InterventionsFeed } from "@/components/dashboard/interventions-feed";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { AttentionRanking } from "@/components/dashboard/attention-ranking";
import { ParcelDetail } from "@/components/dashboard/parcel-detail";
import { IrrigationAdvisory } from "@/components/dashboard/irrigation-advisory";
import { EthiopiaMap } from "@/components/dashboard/ethiopia-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MapPin } from "lucide-react";
import { SITES, getSiteKPIs, type SiteId } from "@/lib/mock-data";

interface OverviewViewProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
  onSelectSite: (id: SiteId) => void;
}

export function OverviewView({ siteId, selectedParcelId, onSelectParcel, onSelectSite }: OverviewViewProps) {
  const site = SITES.find(s => s.id === siteId)!;
  const kpis = getSiteKPIs(siteId);
  // Live interventions (real-time pattern detection)
  const { interventions, latestWeather, lastUpdate } = useLiveSensorData({ siteId, intervalMs: 3000 });

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <KPICards siteId={siteId} />

      {/* Main grid: Map + Attention Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                AOI Map — Three Pilot Sites
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-normal">
                Bishoftu · Asella · Ambo
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-[5/3] w-full">
              <EthiopiaMap
                selectedSiteId={siteId}
                onSelectSite={onSelectSite}
              />
            </div>
          </CardContent>
        </Card>

        <AttentionRanking
          siteId={siteId}
          selectedParcelId={selectedParcelId}
          onSelectParcel={onSelectParcel}
        />
      </div>

      {/* Second row: Parcel detail + Irrigation summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ParcelDetail siteId={siteId} selectedParcelId={selectedParcelId} />
        <div className="lg:col-span-2">
          <IrrigationAdvisory
            siteId={siteId}
            selectedParcelId={selectedParcelId}
            onSelectParcel={onSelectParcel}
          />
        </div>
      </div>

      {/* Site summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Site Summary — {site.fullName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Total parcels</div>
              <div className="font-semibold text-foreground">{kpis.totalParcels}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total area</div>
              <div className="font-semibold text-foreground">{kpis.totalArea.toFixed(1)} ha</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Mean NDVI</div>
              <div className="font-semibold text-emerald-700">{kpis.meanNdvi.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Mean moisture</div>
              <div className="font-semibold text-blue-700">{kpis.meanMoisture.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Disease events</div>
              <div className="font-semibold text-rose-700">{kpis.diseaseParcels}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Need irrigation</div>
              <div className="font-semibold text-blue-700">{kpis.irrigateParcels}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Yield forecast</div>
              <div className="font-semibold text-emerald-700">{kpis.meanYield.toFixed(1)} t/ha</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live interventions feed — auto-detected plot-specific recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <InterventionsFeed interventions={interventions} maxItems={6} />
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
              Live AOI Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestWeather && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-2">
                    <div className="text-[10px] text-amber-700">T_max</div>
                    <div className="font-mono font-bold text-amber-800">{latestWeather.tMax.toFixed(1)}°C</div>
                  </div>
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2">
                    <div className="text-[10px] text-emerald-700">RH</div>
                    <div className="font-mono font-bold text-emerald-800">{latestWeather.rh.toFixed(0)}%</div>
                  </div>
                  <div className="rounded-md bg-orange-50 border border-orange-200 p-2">
                    <div className="text-[10px] text-orange-700">ET₀</div>
                    <div className="font-mono font-bold text-orange-800">{latestWeather.et0.toFixed(1)}mm</div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last update</div>
                <div className="font-mono text-sm font-semibold text-foreground">
                  {new Date(lastUpdate).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Active interventions</div>
                <div className="text-2xl font-bold text-emerald-700">{interventions.length}</div>
                <div className="text-[10px] text-muted-foreground">
                  {interventions.filter(i => i.severity === "critical").length} critical · {" "}
                  {interventions.filter(i => i.severity === "high").length} high
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground text-center pt-2 border-t">
                Auto-detected every 3s from live NPK + weather streams
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
