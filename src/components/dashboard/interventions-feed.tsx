"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Droplets, Microscope, AlertTriangle, Activity, Cloud,
  type LucideIcon,
} from "lucide-react";
import type { Intervention } from "@/hooks/use-live-sensor-data";

interface InterventionsFeedProps {
  interventions: Intervention[];
  title?: string;
  maxItems?: number;
  compact?: boolean;
}

const SEVERITY_STYLES: Record<Intervention["severity"], { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "bg-rose-600",   text: "text-rose-700",   border: "border-rose-300",   label: "Critical" },
  high:     { bg: "bg-orange-500", text: "text-orange-700", border: "border-orange-300", label: "High" },
  medium:   { bg: "bg-amber-500",  text: "text-amber-700",  border: "border-amber-300",  label: "Medium" },
  low:      { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-300", label: "Low" },
};

const CATEGORY_ICONS: Record<Intervention["category"], LucideIcon> = {
  irrigation:     Droplets,
  fertilization:  Microscope,
  disease:        AlertTriangle,
  canopy:         Activity,
  weather:        Cloud,
};

const CATEGORY_LABELS: Record<Intervention["category"], string> = {
  irrigation:     "Irrigation",
  fertilization:  "Fertilization",
  disease:        "Disease risk",
  canopy:         "Canopy",
  weather:        "Weather",
};

export function InterventionsFeed({
  interventions,
  title = "Auto-detected Interventions",
  maxItems = 8,
  compact = false,
}: InterventionsFeedProps) {
  const visibleInterventions = interventions.slice(0, maxItems);
  const counts = interventions.reduce((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {(["critical", "high", "medium", "low"] as const).map(s => {
              const count = counts[s] || 0;
              if (count === 0) return null;
              return (
                <Badge
                  key={s}
                  variant="outline"
                  className={cn("text-[10px] font-semibold", SEVERITY_STYLES[s].text, SEVERITY_STYLES[s].border)}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full mr-1", SEVERITY_STYLES[s].bg)} />
                  {count} {SEVERITY_STYLES[s].label}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {visibleInterventions.length === 0 ? (
          <div className="text-center py-6 text-sm text-emerald-700">
            <Activity className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
            All parcels within optimal range. No interventions needed.
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {visibleInterventions.map((iv) => {
              const styles = SEVERITY_STYLES[iv.severity];
              const Icon = CATEGORY_ICONS[iv.category];
              const ageSeconds = Math.floor((Date.now() - iv.ts) / 1000);
              const ageText = ageSeconds < 60 ? `${ageSeconds}s ago` :
                              ageSeconds < 3600 ? `${Math.floor(ageSeconds / 60)}m ago` :
                              `${Math.floor(ageSeconds / 3600)}h ago`;
              return (
                <div
                  key={iv.id}
                  className={cn(
                    "rounded-md border p-2.5 transition-colors hover:bg-muted/40",
                    styles.border,
                    iv.severity === "critical" && "bg-rose-50",
                    iv.severity === "high" && "bg-orange-50/50",
                    iv.severity === "medium" && "bg-amber-50/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className={cn(
                        "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded text-white",
                        styles.bg
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {iv.parcelCode}
                          </span>
                          <Badge variant="outline" className={cn("text-[9px]", styles.text)}>
                            {CATEGORY_LABELS[iv.category]}
                          </Badge>
                          {!compact && (
                            <span className="text-[10px] text-muted-foreground">· {iv.owner}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">{ageText}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 italic">
                          {iv.pattern}
                        </div>
                        <div className="text-xs text-foreground font-medium mt-1">
                          {iv.message}
                        </div>
                        <div className="text-[11px] mt-1 px-2 py-1 rounded bg-muted/40 text-foreground border-l-2 border-emerald-500">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mr-1">Action:</span>
                          {iv.action}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {interventions.length > maxItems && (
          <div className="text-center text-[10px] text-muted-foreground mt-2">
            + {interventions.length - maxItems} more interventions · see full list in Interventions panel
          </div>
        )}
      </CardContent>
    </Card>
  );
}
