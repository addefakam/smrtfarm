"use client";

import { useState } from "react";
import { SITES, type ModuleId, type SiteId } from "@/lib/mock-data";
import { Sidebar } from "@/components/dashboard/sidebar";
import { OverviewView } from "@/components/dashboard/views/overview-view";
import { MapView } from "@/components/dashboard/views/map-view";
import { YieldEstimationView } from "@/components/dashboard/views/yield-estimation-view";
import { IrrigationSchedulingView } from "@/components/dashboard/views/irrigation-scheduling-view";
import { DiseaseDetectionView } from "@/components/dashboard/views/disease-detection-view";
import { SensorFeedView } from "@/components/dashboard/views/sensor-feed-view";
import { AttentionHeatmapView } from "@/components/dashboard/views/attention-heatmap-view";
import { InputDataView } from "@/components/dashboard/views/input-data-view";
import { DiseaseAdvisorView } from "@/components/dashboard/views/disease-advisor-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Bell, Wheat } from "lucide-react";

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const [selectedSiteId, setSelectedSiteId] = useState<SiteId>("bishoftu");
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const site = SITES.find(s => s.id === selectedSiteId)!;

  const handleSiteChange = (id: SiteId) => {
    setSelectedSiteId(id);
    setSelectedParcelId(null);
  };

  const renderModule = () => {
    const props = {
      siteId: selectedSiteId,
      selectedParcelId,
      onSelectParcel: setSelectedParcelId,
    };
    switch (activeModule) {
      case "overview":
        return <OverviewView {...props} onSelectSite={handleSiteChange} />;
      case "map":
        return <MapView {...props} onSelectSite={handleSiteChange} />;
      case "yield":
        return <YieldEstimationView {...props} />;
      case "irrigation":
        return <IrrigationSchedulingView {...props} />;
      case "disease":
        return <DiseaseDetectionView {...props} />;
      case "sensor":
        return <SensorFeedView {...props} />;
      case "heatmap":
        return <AttentionHeatmapView {...props} />;
      case "input":
        return <InputDataView siteId={selectedSiteId} />;
      case "advisor":
        return <DiseaseAdvisorView {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 sm:px-4 py-2.5">
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
                  Irrigated Wheat · Ethiopia · EIAR Pilot · <span className="text-emerald-700 font-semibold">{site.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="h-9 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">{site.weatherToday.date}</span>
              </Button>

              <Button variant="outline" size="sm" className="h-9 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="sr-only">Refresh</span>
              </Button>

              <Button variant="outline" size="sm" className="h-9 text-xs relative">
                <Bell className="w-3.5 h-3.5" />
                <span className="sr-only">Notifications</span>
                {site.activeAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {site.activeAlerts}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Site metadata sub-bar */}
        <div className="border-t bg-muted/50 px-3 sm:px-4 py-1.5">
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium text-foreground">{site.fullName}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-muted-foreground hidden sm:inline">
                {site.lat.toFixed(4)}°N, {site.lon.toFixed(4)}°E · {site.elevation}m
              </span>
              <Badge variant="outline" className="text-[10px]">{site.phase}</Badge>
            </div>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>T_max <span className="font-mono font-semibold text-amber-700">{site.weatherToday.t_max}°C</span></span>
              <span>ET₀ <span className="font-mono font-semibold text-orange-700">{site.weatherToday.et0}mm</span></span>
              <span>Rain <span className="font-mono font-semibold text-blue-700">{site.weatherToday.rain}mm</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Body: Sidebar + Main ─── */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          selectedSiteId={selectedSiteId}
          onSiteChange={handleSiteChange}
        />

        <main className="flex-1 p-3 sm:p-4 min-w-0">
          {renderModule()}
        </main>
      </div>

      {/* ─── Footer ─── */}
      <footer className="border-t bg-background mt-auto">
        <div className="px-3 sm:px-4 py-3 text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium text-foreground">
              Precision Farming Ecosystem v1.2
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              <span className="font-mono">github.com/DivergenTechnology/smartfarming-ecosystem</span>
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
