"use client";

import { MODULES, type ModuleId, type SiteId, SITES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, MapPin, TrendingUp, Droplets, AlertTriangle,
  Radio, Grid3x3, Wheat, Database,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Droplets,
  AlertTriangle,
  Radio,
  Grid3x3,
  Database,
};

interface SidebarProps {
  activeModule: ModuleId;
  onModuleChange: (id: ModuleId) => void;
  selectedSiteId: SiteId;
  onSiteChange: (id: SiteId) => void;
}

export function Sidebar({ activeModule, onModuleChange, selectedSiteId, onSiteChange }: SidebarProps) {
  return (
    <aside className="w-full lg:w-60 lg:flex-shrink-0 border-r bg-background lg:h-[calc(100vh-129px)] lg:sticky lg:top-[129px] overflow-y-auto">
      {/* Site selector (mobile: full row, desktop: sidebar header) */}
      <div className="p-3 border-b">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
          Active AOI
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-1">
          {SITES.map(s => (
            <button
              key={s.id}
              onClick={() => onSiteChange(s.id)}
              className={cn(
                "text-left px-2.5 py-2 rounded-md border text-xs transition-colors",
                s.id === selectedSiteId
                  ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                  : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <div className="font-semibold truncate">{s.name.replace(" ARC", "").replace(" AERC", "")}</div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-between mt-0.5">
                <span>{s.parcelCount} parcels</span>
                {s.activeAlerts > 0 && (
                  <span className="bg-rose-100 text-rose-700 px-1.5 rounded-full font-semibold">
                    {s.activeAlerts}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Module navigation */}
      <nav className="p-2 space-y-0.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 px-2 font-medium">
          Modules
        </div>
        {MODULES.map(m => {
          const Icon = ICON_MAP[m.icon] || LayoutDashboard;
          const isActive = m.id === activeModule;
          return (
            <button
              key={m.id}
              onClick={() => onModuleChange(m.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md transition-colors group flex items-start gap-2.5",
                isActive
                  ? "bg-emerald-700 text-white"
                  : "hover:bg-muted/50 text-foreground"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 mt-0.5 flex-shrink-0",
                isActive ? "text-white" : "text-emerald-700"
              )} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{m.label}</div>
                <div className={cn(
                  "text-[10px] leading-tight mt-0.5",
                  isActive ? "text-emerald-100" : "text-muted-foreground"
                )}>
                  {m.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Branding footer (sidebar) */}
      <div className="p-3 mt-auto border-t hidden lg:block">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Wheat className="w-3 h-3 text-emerald-700" />
          <span>v1.2 · CC0 · EIAR pilot</span>
        </div>
      </div>
    </aside>
  );
}
