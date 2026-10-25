"use client";

import { getParcelsBySite, type SiteId, type Parcel } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, BarChart3, Microscope, Cloud } from "lucide-react";

interface YieldEstimationViewProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

const YIELD_FEATURES = [
  { key: "ndvi_contribution",    label: "NDVI",        color: "bg-emerald-500", textColor: "text-emerald-700" },
  { key: "ndre_contribution",     label: "NDRE",        color: "bg-teal-500",    textColor: "text-teal-700" },
  { key: "soil_N_contribution",   label: "Soil N",      color: "bg-amber-500",   textColor: "text-amber-700" },
  { key: "soil_P_contribution",   label: "Soil P",      color: "bg-yellow-500",  textColor: "text-yellow-700" },
  { key: "soil_K_contribution",   label: "Soil K",      color: "bg-orange-500",  textColor: "text-orange-700" },
  { key: "weather_contribution",  label: "Weather",    color: "bg-blue-500",     textColor: "text-blue-700" },
  { key: "disease_contribution",  label: "Disease (-)", color: "bg-rose-500",    textColor: "text-rose-700" },
] as const;

export function YieldEstimationView({ siteId, selectedParcelId, onSelectParcel }: YieldEstimationViewProps) {
  const parcels = getParcelsBySite(siteId);

  // Sort by yield forecast for the bar chart
  const sortedParcels = [...parcels].sort((a, b) => b.yieldForecast - a.yieldForecast);
  const maxYield = Math.max(...parcels.map(p => p.yieldForecast));
  const minYield = Math.min(...parcels.map(p => p.yieldForecast));

  // Selected parcel for the feature breakdown
  const selectedParcel: Parcel | null = selectedParcelId
    ? parcels.find(p => p.id === selectedParcelId) ?? null
    : sortedParcels[0] ?? null;

  // Site-level mean
  const meanYield = (parcels.reduce((s, p) => s + p.yieldForecast, 0) / parcels.length).toFixed(2);
  const totalProduction = parcels.reduce((s, p) => s + p.yieldForecast * p.areaHa, 0).toFixed(0);

  return (
    <div className="space-y-4">
      {/* Top banner: Yield summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Site mean forecast</div>
              <div className="text-2xl font-bold text-emerald-700">{meanYield} <span className="text-xs font-normal">t/ha</span></div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total production</div>
              <div className="text-2xl font-bold text-foreground">{totalProduction} <span className="text-xs font-normal">t</span></div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Yield range</div>
              <div className="text-2xl font-bold text-foreground">{minYield.toFixed(1)}–{maxYield.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Model</div>
              <div className="text-sm font-bold text-foreground mt-1">XGBoost (M5)</div>
              <div className="text-[10px] text-muted-foreground">7 features · target MAE ≤0.4</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data flow diagram — shows inputs → IWCYES → yield */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Microscope className="w-4 h-4 text-emerald-600" />
            IWCYES — Inference Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-amber-50 border-amber-200 p-3">
              <div className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                <Microscope className="w-3.5 h-3.5" /> Soil (NPK sensor)
              </div>
              <ul className="text-[11px] text-amber-700 space-y-0.5">
                <li>N (ppm)</li>
                <li>P-Olsen (ppm)</li>
                <li>K-exch (ppm)</li>
                <li>pH · EC</li>
                <li>Soil moisture · temp</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-3">
              <div className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" /> Spectral (UAV + Sentinel-2)
              </div>
              <ul className="text-[11px] text-emerald-700 space-y-0.5">
                <li>Blue · Green · Red</li>
                <li>NIR · Red-Edge</li>
                <li>SWIR1</li>
                <li>NDVI · EVI · GNDVI</li>
                <li>NDRE · NDMI · LAI</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-blue-50 border-blue-200 p-3">
              <div className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5" /> Weather (per AOI)
              </div>
              <ul className="text-[11px] text-blue-700 space-y-0.5">
                <li>T_max · T_min</li>
                <li>RH · wind · solar_rad</li>
                <li>Rain (mm)</li>
                <li>ET₀ (Penman-Monteith)</li>
                <li>Cumulative GDD</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-emerald-700 border-emerald-700 p-3 text-white">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> M5 IWCYES → Yield
              </div>
              <ul className="text-[11px] space-y-0.5">
                <li>Feature engineering</li>
                <li>XGBoost regressor</li>
                <li>Growth-stage weighting</li>
                <li>Leave-one-AOI-out CV</li>
                <li>Feature importance</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground text-center">
            Inputs flow left-to-right → M5 produces per-parcel yield forecast (t/ha) + feature contributions for XAI
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Yield bar chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Yield Forecast per Parcel
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {parcels.length} parcels · sorted by yield desc · click to inspect
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {sortedParcels.map((p, idx) => {
                const isSelected = p.id === selectedParcel?.id;
                const widthPct = (p.yieldForecast / maxYield) * 100;
                const isLow = p.yieldForecast < 3.5;
                const isHigh = p.yieldForecast >= 4.5;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectParcel(p.id)}
                    className={cn(
                      "w-full text-left rounded border p-1.5 transition-colors",
                      isSelected ? "bg-emerald-50 border-emerald-400" : "bg-card border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] text-muted-foreground font-mono w-5 text-right">{idx + 1}</span>
                        <span className="font-mono text-xs font-semibold text-foreground truncate">{p.parcelCode}</span>
                      </div>
                      <span className={cn(
                        "font-mono text-xs font-bold tabular-nums",
                        isLow ? "text-rose-700" : isHigh ? "text-emerald-700" : "text-amber-700"
                      )}>
                        {p.yieldForecast.toFixed(1)} t/ha
                      </span>
                    </div>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded",
                          isLow ? "bg-rose-500" : isHigh ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feature breakdown for selected parcel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Feature Contributions
            </CardTitle>
            {selectedParcel && (
              <p className="text-xs text-muted-foreground">
                {selectedParcel.parcelCode} · {selectedParcel.owner} · forecast{" "}
                <span className="font-mono font-bold text-emerald-700">{selectedParcel.yieldForecast.toFixed(1)} t/ha</span>
              </p>
            )}
          </CardHeader>
          <CardContent>
            {selectedParcel && (
              <div className="space-y-3">
                <div className="text-[10px] text-muted-foreground mb-1">
                  Baseline: 3.5 t/ha · positive = boost, negative = drag
                </div>
                {YIELD_FEATURES.map(f => {
                  const value = selectedParcel.yieldFeatures[f.key as keyof typeof selectedParcel.yieldFeatures];
                  const isPositive = value >= 0;
                  const absValue = Math.abs(value);
                  const maxAbs = Math.max(
                    ...YIELD_FEATURES.map(ff =>
                      Math.abs(selectedParcel.yieldFeatures[ff.key as keyof typeof selectedParcel.yieldFeatures])
                    )
                  );
                  const widthPct = maxAbs > 0 ? (absValue / maxAbs) * 50 : 0;
                  return (
                    <div key={f.key} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className={cn("font-mono font-semibold", isPositive ? "text-emerald-700" : "text-rose-700")}>
                          {isPositive ? "+" : ""}{value.toFixed(2)} t/ha
                        </span>
                      </div>
                      <div className="relative h-2 rounded bg-muted">
                        {/* Center line */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
                        {/* Bar */}
                        <div
                          className={cn("absolute top-0 bottom-0 h-2 rounded", f.color)}
                          style={{
                            left: isPositive ? "50%" : `${50 - widthPct}%`,
                            width: `${widthPct}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Total */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Sum of contributions</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {(selectedParcel.yieldForecast - 3.5 >= 0 ? "+" : "")}{(selectedParcel.yieldForecast - 3.5).toFixed(2)} t/ha
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spectral reflectance table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Microscope className="w-4 h-4 text-emerald-600" />
            Spectral Reflectance — Per Band (Sentinel-2 + UAV)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Raw reflectance values feeding the IWCYES feature engineering pipeline
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Parcel</th>
                  <th className="text-right py-2 px-2 text-blue-700 font-medium">Blue</th>
                  <th className="text-right py-2 px-2 text-emerald-700 font-medium">Green</th>
                  <th className="text-right py-2 px-2 text-rose-700 font-medium">Red</th>
                  <th className="text-right py-2 px-2 text-emerald-900 font-medium">NIR</th>
                  <th className="text-right py-2 px-2 text-teal-700 font-medium">RedEdge</th>
                  <th className="text-right py-2 px-2 text-amber-700 font-medium">SWIR1</th>
                  <th className="text-right py-2 pl-2 text-muted-foreground font-medium">NDVI</th>
                  <th className="text-right py-2 pl-2 text-muted-foreground font-medium">NDRE</th>
                  <th className="text-right py-2 pl-2 text-muted-foreground font-medium">LAI</th>
                </tr>
              </thead>
              <tbody>
                {parcels.slice(0, 12).map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-1.5 pr-3 font-mono font-semibold text-foreground">{p.parcelCode}</td>
                    <td className="text-right py-1.5 px-2 font-mono">{p.spectralBlue.toFixed(3)}</td>
                    <td className="text-right py-1.5 px-2 font-mono">{p.spectralGreen.toFixed(3)}</td>
                    <td className="text-right py-1.5 px-2 font-mono">{p.spectralRed.toFixed(3)}</td>
                    <td className="text-right py-1.5 px-2 font-mono font-semibold text-emerald-700">{p.spectralNIR.toFixed(3)}</td>
                    <td className="text-right py-1.5 px-2 font-mono">{p.spectralRE.toFixed(3)}</td>
                    <td className="text-right py-1.5 px-2 font-mono">{p.spectralSWIR1.toFixed(3)}</td>
                    <td className="text-right py-1.5 pl-2 font-mono font-semibold">{p.ndvi.toFixed(2)}</td>
                    <td className="text-right py-1.5 pl-2 font-mono">{p.ndre.toFixed(2)}</td>
                    <td className="text-right py-1.5 pl-2 font-mono">{p.lai.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parcels.length > 12 && (
              <div className="text-center text-[10px] text-muted-foreground mt-2">
                + {parcels.length - 12} more parcels — see Map View for full list
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
