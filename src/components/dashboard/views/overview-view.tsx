"use client";

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
    </div>
  );
}
