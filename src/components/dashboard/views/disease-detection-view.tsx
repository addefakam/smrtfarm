"use client";

import { getParcelsBySite, getDiseaseDistribution, STATUS_COLORS, type SiteId, type Parcel } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertTriangle, Plane, Activity, Image as ImageIcon } from "lucide-react";

interface DiseaseDetectionViewProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

const DISEASE_COLORS: Record<string, string> = {
  "Yellow rust":          "bg-yellow-500",
  "Stem rust":            "bg-rose-700",
  "Leaf rust":            "bg-orange-600",
  "Powdery mildew":       "bg-purple-500",
  "Septoria leaf blotch": "bg-amber-700",
  "Tan spot":             "bg-stone-500",
};

const DISEASE_INFO: Record<string, { pathogen: string; threshold: string }> = {
  "Yellow rust":          { pathogen: "Puccinia striiformis f.sp. tritici", threshold: "Cool (10-15°C) + humid" },
  "Stem rust":            { pathogen: "Puccinia graminis f.sp. tritici",    threshold: "Warm (20-25°C) + humid" },
  "Leaf rust":            { pathogen: "Puccinia triticina",                  threshold: "Warm (15-25°C) + humid" },
  "Powdery mildew":       { pathogen: "Blumeria graminis",                  threshold: "Cool + low light" },
  "Septoria leaf blotch": { pathogen: "Zymoseptoria tritici",                threshold: "Wet + cool (15-20°C)" },
  "Tan spot":             { pathogen: "Pyrenophora tritici-repentis",        threshold: "Wet + warm (20-28°C)" },
};

export function DiseaseDetectionView({ siteId, selectedParcelId, onSelectParcel }: DiseaseDetectionViewProps) {
  const parcels = getParcelsBySite(siteId);
  const distribution = getDiseaseDistribution(siteId);
  const diseaseParcels = parcels.filter(p => p.diseaseSeverity > 0);
  const sortedDiseased = [...diseaseParcels].sort((a, b) => b.diseaseSeverity - a.diseaseSeverity);

  const selectedParcel: Parcel | null = selectedParcelId
    ? parcels.find(p => p.id === selectedParcelId) ?? null
    : sortedDiseased[0] ?? null;

  return (
    <div className="space-y-4">
      {/* Module banner */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-rose-600" />
                <span className="text-base font-semibold text-foreground">M2 — UAV Disease Early Detection</span>
                <Badge variant="outline" className="text-[10px]">EfficientNet-B0</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                RGB + multispectral + thermal UAV imagery → CNN classification → parcel-level severity aggregation
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground">Parcels scanned</div>
                <div className="text-lg font-bold text-foreground">{parcels.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Disease detected</div>
                <div className="text-lg font-bold text-rose-700">{diseaseParcels.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Avg severity</div>
                <div className="text-lg font-bold text-amber-700">
                  {diseaseParcels.length > 0 ? Math.round(diseaseParcels.reduce((s, p) => s + p.diseaseSeverity, 0) / diseaseParcels.length) : 0}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disease class distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-600" />
            Disease Class Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {distribution.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No disease detected at this AOI in the latest UAV mission.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {distribution.map(d => {
                const color = DISEASE_COLORS[d.class] || "bg-stone-500";
                const info = DISEASE_INFO[d.class] || { pathogen: "—", threshold: "—" };
                const maxCount = Math.max(...distribution.map(x => x.count));
                return (
                  <div key={d.class} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-3 h-3 rounded", color)} />
                          <span className="font-semibold text-sm text-foreground">{d.class}</span>
                        </div>
                        <div className="text-[10px] italic text-muted-foreground mt-0.5">{info.pathogen}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{d.count} parcels</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">Parcel count</span>
                        <span className="font-mono font-semibold">{d.count}/{parcels.length}</span>
                      </div>
                      <Progress value={(d.count / maxCount) * 100} className={cn("h-2", `[&>div]:${color}`)} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Mean severity</span>
                      <span className="font-mono font-semibold text-rose-700">{d.avgSeverity}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Outbreak trigger: {info.threshold}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Disease list (sorted by severity) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Diseased Parcels — Sorted by Severity
            </CardTitle>
            <p className="text-xs text-muted-foreground">Click any parcel to inspect UAV imagery metadata</p>
          </CardHeader>
          <CardContent>
            {sortedDiseased.length === 0 ? (
              <div className="text-center py-6 text-sm text-emerald-700">
                ✓ No disease detected across all parcels. Last UAV mission: clean.
              </div>
            ) : (
              <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
                {sortedDiseased.map(p => {
                  const isSelected = p.id === selectedParcel?.id;
                  const diseaseColor = p.diseaseClass ? DISEASE_COLORS[p.diseaseClass] : "bg-stone-500";
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectParcel(p.id)}
                      className={cn(
                        "w-full text-left rounded-md border p-2.5 transition-colors",
                        isSelected ? "bg-rose-50 border-rose-400" : "bg-card border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-foreground">{p.parcelCode}</span>
                            <span className={cn("inline-block w-2 h-2 rounded-full", diseaseColor)} />
                            <span className="text-xs font-semibold text-rose-700">{p.diseaseClass}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {p.owner} · {p.areaHa}ha · {p.growthStage}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[10px] text-muted-foreground">Severity</div>
                          <div className="font-mono text-sm font-bold text-rose-700">{p.diseaseSeverity}%</div>
                        </div>
                      </div>
                      <div className="mt-1.5">
                        <Progress value={p.diseaseSeverity} className={cn("h-1.5", "[&>div]:bg-rose-500")} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected parcel UAV mission detail */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-rose-600" />
              UAV Mission Detail
            </CardTitle>
            {selectedParcel && (
              <p className="text-xs text-muted-foreground">{selectedParcel.parcelCode}</p>
            )}
          </CardHeader>
          <CardContent>
            {selectedParcel && (
              <div className="space-y-3">
                {/* UAV thumbnail placeholder */}
                <div className="aspect-square rounded-md bg-gradient-to-br from-emerald-50 via-emerald-100 to-amber-50 border border-emerald-200 flex items-center justify-center relative overflow-hidden">
                  {/* Fake "parcel outline" overlay */}
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#2A7A65" strokeWidth="0.3" opacity="0.2"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                    {/* Parcel shape */}
                    <polygon
                      points={selectedParcel.parcelShape === "rect" ? "20,20 80,20 80,80 20,80" :
                              selectedParcel.parcelShape === "triangle" ? "20,30 80,30 50,80" :
                              "25,25 75,20 80,55 70,80 30,75 22,55"}
                      fill={selectedParcel.diseaseSeverity > 15 ? "rgba(192, 57, 43, 0.25)" : "rgba(42, 122, 101, 0.15)"}
                      stroke={selectedParcel.diseaseSeverity > 15 ? "#C0392B" : "#1B5347"}
                      strokeWidth="1.5"
                    />
                    {/* Disease hotspot markers */}
                    {selectedParcel.diseaseClass && Array.from({ length: Math.ceil(selectedParcel.diseaseSeverity / 10) }).map((_, i) => {
                      const cx = 30 + (i * 13) % 50;
                      const cy = 35 + ((i * 7) % 30);
                      return (
                        <circle key={i} cx={cx} cy={cy} r="3" fill="#C0392B" opacity="0.7">
                          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                        </circle>
                      );
                    })}
                  </svg>
                  <div className="absolute top-1 left-1 bg-white/90 px-1.5 py-0.5 rounded text-[9px] font-mono">
                    {selectedParcel.uavBands.join(" + ")}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[9px]">
                    {selectedParcel.uavImageCount} imgs
                  </div>
                </div>

                {/* UAV metadata */}
                <div className="rounded-md border bg-muted/30 p-2.5 text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">Last mission</span><span className="font-mono font-semibold">{selectedParcel.uavLastMission}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Imagery bands</span><span className="font-mono">{selectedParcel.uavBands.join(", ")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total images</span><span className="font-mono">{selectedParcel.uavImageCount}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Shapefile</span><span className={cn("font-mono", selectedParcel.shapefileVerified ? "text-emerald-700" : "text-rose-700")}>{selectedParcel.shapefileVerified ? "✓ verified" : "✗ pending"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Parcel shape</span><span className="font-mono">{selectedParcel.parcelShape}</span></div>
                </div>

                {/* Disease detection summary */}
                {selectedParcel.diseaseSeverity > 0 ? (
                  <div className="rounded-md bg-rose-50 border border-rose-200 p-2.5">
                    <div className="text-xs font-semibold text-rose-700 mb-1">Detection result</div>
                    <div className="text-sm font-bold text-rose-700">{selectedParcel.diseaseClass}</div>
                    <div className="text-[10px] text-rose-700 mt-1">
                      Severity: {selectedParcel.diseaseSeverity}% of canopy affected
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Model: EfficientNet-B0 · Confidence: 0.78 (held-out validation)
                    </div>
                    <div className="text-[11px] text-rose-700 mt-2 font-medium">
                      → Advisory: fungicide application recommended within 48h
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2.5">
                    <div className="text-xs font-semibold text-emerald-700">Detection result</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">No disease detected</div>
                    <div className="text-[10px] text-emerald-700 mt-1">All tiles classified as healthy canopy</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
