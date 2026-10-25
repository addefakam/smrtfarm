"use client";

import { getSiteKPIs, type SiteId } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Droplets, AlertTriangle, TrendingUp, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  siteId: SiteId;
}

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: { value: string; up: boolean; good: boolean };
}

function KPICard({ label, value, unit, icon: Icon, iconColor, trend }: KPICardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
          <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", iconColor)} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">{value}</span>
          {unit && <span className="text-[10px] sm:text-xs text-muted-foreground">{unit}</span>}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 mt-1 text-[10px] sm:text-[11px]",
            trend.good ? "text-emerald-600" : "text-rose-600"
          )}>
            <span>{trend.up ? "▲" : "▼"}</span>
            <span className="font-medium">{trend.value}</span>
            <span className="text-muted-foreground">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KPICards({ siteId }: KPICardsProps) {
  const kpis = getSiteKPIs(siteId);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      <KPICard
        label="Parcels"
        value={kpis.totalParcels}
        icon={Layers}
        iconColor="text-emerald-600"
        trend={{ value: "+3", up: true, good: true }}
      />
      <KPICard
        label="Active alerts"
        value={kpis.activeAlerts}
        icon={AlertTriangle}
        iconColor="text-rose-600"
        trend={{ value: "-2", up: false, good: true }}
      />
      <KPICard
        label="Avg moisture"
        value={kpis.meanMoisture.toFixed(0)}
        unit="%"
        icon={Droplets}
        iconColor="text-blue-600"
      />
      <KPICard
        label="Disease risk"
        value={kpis.diseaseRisk}
        unit="%"
        icon={Leaf}
        iconColor="text-amber-600"
      />
      <KPICard
        label="Yield forecast"
        value={kpis.meanYield.toFixed(1)}
        unit="t/ha"
        icon={TrendingUp}
        iconColor="text-emerald-600"
        trend={{ value: "+0.3", up: true, good: true }}
      />
    </div>
  );
}
