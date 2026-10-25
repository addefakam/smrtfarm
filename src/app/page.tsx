"use client";

import { useState } from "react";
import { SITES, getParcelsBySite, type SiteId } from "@/lib/mock-data";
import { EthiopiaMap } from "@/components/dashboard/ethiopia-map";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { AttentionRanking } from "@/components/dashboard/attention-ranking";
import { ParcelHeatmap } from "@/components/dashboard/parcel-heatmap";
import { ParcelDetail } from "@/components/dashboard/parcel-detail";
import { IrrigationAdvisory } from "@/components/dashboard/irrigation-advisory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Calendar, RefreshCw, Bell, Activity, Wheat } from "lucide-react";

export default function Home() {
  const [selectedSiteId, setSelectedSiteId] = useState<SiteId>("bishoftu");
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const site = SITES.find(s => s.id === selectedSiteId)!;
  const parcels = getParcelsBySite(selectedSiteId);

  // Auto-select first parcel when site changes
  const handleSiteChange = (id: SiteId) => {
    setSelectedSiteId(id);
    setSelectedParcelId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-emerald-700 flex items-center justify-center flex-shrink-0">
                <Wheat className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm sm:text-base text-foreground truncate">
                  Precision Farming Ecosystem
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Irrigated Wheat · Ethiopia · EIAR Pilot
                </div>
              </div>
            </div>

            {/* Site selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedSiteId} onValueChange={(v) => handleSiteChange(v as SiteId)}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {SITES.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{s.name}</span>
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {s.activeAlerts} alerts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="h-9 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Today</span>
              </Button>

              <Button variant="outline" size="sm" className="h-9 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="sr-only">Refresh</span>
              </Button>

              <Button variant="outline" size="sm" className="h-9 text-xs relative">
                <Bell className="w-3.5 h-3.5" />
                <span className="sr-only">Notifications</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {site.activeAlerts}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Site metadata banner ─── */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-muted-foreground">Site:</span>{" "}
                <span className="font-semibold text-foreground">{site.fullName}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-muted-foreground">Coords:</span>{" "}
                <span className="font-mono text-foreground">
                  {site.lat.toFixed(4)}°N, {site.lon.toFixed(4)}°E
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Elevation:</span>{" "}
                <span className="font-mono text-foreground">{site.elevation} m</span>
              </div>
              <div className="hidden md:block">
                <span className="text-muted-foreground">Region:</span>{" "}
                <span className="text-foreground">{site.region} / {site.zone}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {site.phase}
            </Badge>
          </div>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* KPI row */}
        <KPICards siteId={selectedSiteId} />

        {/* Main grid: Map + Attention Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map (2/3) */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  AOI Map — Three Pilot sites
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-normal">
                  Bishoftu · Asella · Ambo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-[5/3] w-full">
                <EthiopiaMap
                  selectedSiteId={selectedSiteId}
                  onSelectSite={handleSiteChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Attention ranking (1/3) */}
          <AttentionRanking
            siteId={selectedSiteId}
            selectedParcelId={selectedParcelId}
            onSelectParcel={setSelectedParcelId}
          />
        </div>

        {/* Second row: Parcel heatmap + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Parcel Status Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ParcelHeatmap
                siteId={selectedSiteId}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
              />
            </CardContent>
          </Card>

          {/* Parcel detail (1/3) */}
          <ParcelDetail
            siteId={selectedSiteId}
            selectedParcelId={selectedParcelId}
          />
        </div>

        {/* Third row: Irrigation advisory + Disease breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <IrrigationAdvisory
            siteId={selectedSiteId}
            selectedParcelId={selectedParcelId}
            onSelectParcel={setSelectedParcelId}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Module Status — 6 modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { id: "M1", name: "Spatial Database (PostGIS)", status: "operational", color: "emerald" },
                  { id: "M2", name: "UAV Disease Detection", status: "operational", color: "emerald" },
                  { id: "M3", name: "Vegetation Index Service", status: "operational", color: "emerald" },
                  { id: "M4", name: "IWSS — Irrigation Scheduling", status: "operational", color: "emerald" },
                  { id: "M5", name: "IWCYES — Yield Estimation", status: "degraded", color: "amber" },
                  { id: "M6", name: "Decision-Support Dashboard", status: "operational", color: "emerald" },
                ].map(m => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-md border p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-muted-foreground w-7">{m.id}</span>
                      <span className="text-sm text-foreground">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${m.color === "emerald" ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
                      <span className={`text-xs ${m.color === "emerald" ? "text-emerald-700" : "text-amber-700"} font-medium capitalize`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Last sync: {new Date().toLocaleTimeString()}</span>
                <span className="font-mono">v1.1</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parcel count + summary footer block */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Total parcels (this AOI)</div>
                <div className="font-semibold text-foreground">{parcels.length}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total monitored area</div>
                <div className="font-semibold text-foreground">{site.totalAreaHa.toFixed(1)} ha</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Health (parcels OK)</div>
                <div className="font-semibold text-emerald-700">
                  {parcels.filter(p => p.status === "healthy").length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Disease events today</div>
                <div className="font-semibold text-rose-700">
                  {parcels.filter(p => p.diseaseSeverity > 0).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-3 sm:px-4 py-3 text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground">
              Precision Farming Ecosystem v1.1
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              Source: <span className="font-mono">github.com/DivergenTechnology/smartfarming-ecosystem</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Deployed via Render</span>
            <span>·</span>
            <span>CC0 1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
