"use client";

import { useState, useMemo } from "react";
import { useLiveSensorData } from "@/hooks/use-live-sensor-data";
import { getParcelsBySite, SITES, type SiteId, type Parcel } from "@/lib/mock-data";
import {
  DISEASE_KNOWLEDGE_BASE, SYMPTOM_OPTIONS, SEVERITY_STYLES, PATHOGEN_STYLES,
  type DiseaseEntry, type SymptomOption,
} from "@/lib/disease-knowledge-base";
import { inferDiseases, generateVoiceDialogue, type DiseaseMatch } from "@/lib/disease-inference-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VoicePlayer } from "@/components/dashboard/voice-player";
import { cn } from "@/lib/utils";
import {
  Brain, Stethoscope, Volume2, Microscope, Cloud, Activity,
  Lightbulb, ChevronRight, AlertTriangle, RefreshCw,
} from "lucide-react";

interface DiseaseAdvisorViewProps {
  siteId: SiteId;
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

const SYMPTOM_CATEGORY_LABELS: Record<SymptomOption["category"], string> = {
  leaf:   "Leaf symptoms",
  head:   "Head / grain symptoms",
  stem:   "Stem symptoms",
  root:   "Root symptoms",
  growth: "Growth symptoms",
  color:  "Color changes",
};

export function DiseaseAdvisorView({ siteId, selectedParcelId, onSelectParcel }: DiseaseAdvisorViewProps) {
  const parcels = getParcelsBySite(siteId);
  const site = SITES.find(s => s.id === siteId)!;
  const { latest, latestWeather, lastUpdate } = useLiveSensorData({ siteId, intervalMs: 3000 });

  // Local state for the advisor
  const [parcelId, setParcelId] = useState<string>(selectedParcelId || parcels[0]?.id || "");
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [inferenceResults, setInferenceResults] = useState<DiseaseMatch[] | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const selectedParcel: Parcel | undefined = parcels.find(p => p.id === parcelId);
  const liveReading = selectedParcel ? latest[selectedParcel.id] : null;
  const liveWeather = latestWeather;

  // Group symptoms by category for the UI
  const symptomsByCategory = useMemo(() => {
    const grouped: Record<SymptomOption["category"], SymptomOption[]> = {
      leaf: [], head: [], stem: [], root: [], growth: [], color: [],
    };
    SYMPTOM_OPTIONS.forEach(s => grouped[s.category].push(s));
    return grouped;
  }, []);

  function toggleSymptom(id: string) {
    setSelectedSymptomIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function runInference() {
    if (!selectedParcel || !liveReading || !liveWeather) return;
    const results = inferDiseases({
      parcel: selectedParcel,
      selectedSymptomIds,
      currentHumidity: liveReading.humidity,
      currentTemp: liveReading.soilTemp,
      recentRain: liveWeather.rain > 0,
      currentSoilMoisture: liveReading.moisture,
    });
    setInferenceResults(results);
    setSelectedResultId(results[0]?.disease.id ?? null);
  }

  function resetAll() {
    setSelectedSymptomIds([]);
    setInferenceResults(null);
    setSelectedResultId(null);
  }

  const selectedResult = inferenceResults?.find(r => r.disease.id === selectedResultId);

  return (
    <div className="space-y-4">
      {/* Module banner */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-600" />
                <span className="text-base font-semibold text-foreground">Disease Inference Engine</span>
                <Badge variant="outline" className="text-[10px]">
                  {DISEASE_KNOWLEDGE_BASE.length} diseases in KB
                </Badge>
                <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 font-semibold">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  LIVE env context
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rule-based inference over 10 wheat diseases from the ground-truth knowledge base. Combines user-observed symptoms with live NPK + weather data for area-specific recommendations.
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="text-muted-foreground">Live context (last update)</div>
              <div className="font-mono font-semibold text-foreground">
                {new Date(lastUpdate).toLocaleTimeString()}
              </div>
              {liveWeather && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  RH {liveWeather.rh.toFixed(0)}% · T {liveWeather.tMax}°C · rain {liveWeather.rain}mm
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── LEFT: Parcel selector + symptom multi-select ─── */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              Symptom Selection
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Select observed symptoms for the parcel — inference runs against the live environmental context
            </p>
          </CardHeader>
          <CardContent>
            {/* Parcel selector */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Parcel</label>
              <select
                value={parcelId}
                onChange={e => { setParcelId(e.target.value); onSelectParcel(e.target.value); }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {parcels.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.parcelCode} · {p.owner} · {p.growthStage}
                  </option>
                ))}
              </select>
              {selectedParcel && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  {selectedParcel.areaHa}ha · cultivar: {selectedParcel.cultivar} · sown {selectedParcel.sowingDate}
                </div>
              )}
            </div>

            {/* Live environmental context preview */}
            {liveReading && liveWeather && (
              <div className="grid grid-cols-4 gap-2 mb-4 p-2 rounded-md bg-muted/30 border">
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Humidity</div>
                  <div className="font-mono font-bold text-emerald-700 text-sm">{liveReading.humidity.toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Soil T</div>
                  <div className="font-mono font-bold text-amber-700 text-sm">{liveReading.soilTemp.toFixed(1)}°C</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Moisture</div>
                  <div className="font-mono font-bold text-blue-700 text-sm">{liveReading.moisture.toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Recent rain</div>
                  <div className={cn("font-bold text-sm", liveWeather.rain > 0 ? "text-blue-700" : "text-muted-foreground")}>
                    {liveWeather.rain > 0 ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            )}

            {/* Symptoms grouped by category */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {(Object.keys(symptomsByCategory) as SymptomOption["category"][])
                .filter(cat => symptomsByCategory[cat].length > 0)
                .map(cat => (
                  <div key={cat}>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
                      {SYMPTOM_CATEGORY_LABELS[cat]}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {symptomsByCategory[cat].map(sym => {
                        const isSelected = selectedSymptomIds.includes(sym.id);
                        return (
                          <button
                            key={sym.id}
                            onClick={() => toggleSymptom(sym.id)}
                            className={cn(
                              "text-left text-xs rounded-md border px-2 py-1.5 transition-colors",
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-card border-border hover:bg-muted/50"
                            )}
                          >
                            {sym.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Button
                onClick={runInference}
                disabled={selectedSymptomIds.length === 0}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                <Brain className="w-3.5 h-3.5 mr-1.5" />
                Run Inference ({selectedSymptomIds.length} symptoms)
              </Button>
              <Button variant="outline" onClick={resetAll} size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── RIGHT: KB overview / live env summary ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Microscope className="w-4 h-4 text-emerald-600" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {DISEASE_KNOWLEDGE_BASE.map(d => {
                const sevStyle = SEVERITY_STYLES[d.severityClass];
                const pathStyle = PATHOGEN_STYLES[d.pathogenType];
                return (
                  <div key={d.id} className="rounded-md border p-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{d.name}</span>
                      <span className={cn("w-2 h-2 rounded-full", sevStyle.bg)} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-[10px] font-medium", pathStyle.color)}>{pathStyle.label}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className={cn("text-[10px] font-medium", sevStyle.text)}>{sevStyle.label}</span>
                      {d.chemicalTreatmentEffective ? (
                        <span className="text-[10px] text-emerald-700">· treatable</span>
                      ) : (
                        <span className="text-[10px] text-rose-700">· no chemical cure</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Inference Results ─── */}
      {inferenceResults && inferenceResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Ranked disease list */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-600" />
                Ranked Likely Diseases
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {inferenceResults.length} matches · sorted by confidence
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {inferenceResults.map((match, idx) => {
                  const d = match.disease;
                  const sevStyle = SEVERITY_STYLES[d.severityClass];
                  const isSelected = d.id === selectedResultId;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedResultId(d.id)}
                      className={cn(
                        "w-full text-left rounded-md border p-2.5 transition-colors",
                        isSelected ? "bg-emerald-50 border-emerald-400" : "bg-card border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] font-mono font-bold text-muted-foreground">{idx + 1}</span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">{d.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {match.matchedSymptoms.length} symptoms matched · env fit {(match.environmentalFit * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-emerald-700">{(match.confidence * 100).toFixed(0)}%</div>
                          <div className="text-[9px] text-muted-foreground">confidence</div>
                        </div>
                      </div>
                      <div className="mt-1.5">
                        <Progress value={match.confidence * 100} className="h-1.5 [&>div]:bg-emerald-500" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full", sevStyle.bg)} />
                        <span className={cn("text-[10px] font-medium", sevStyle.text)}>{sevStyle.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected disease detail + voice dialogue */}
          {selectedResult && selectedParcel && (
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-emerald-600" />
                    {selectedResult.disease.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={cn("text-[10px]", PATHOGEN_STYLES[selectedResult.disease.pathogenType].color)}>
                      {PATHOGEN_STYLES[selectedResult.disease.pathogenType].label}
                    </Badge>
                    <Badge variant="outline" className={cn("text-[10px]", SEVERITY_STYLES[selectedResult.disease.severityClass].text)}>
                      {SEVERITY_STYLES[selectedResult.disease.severityClass].label}
                    </Badge>
                    <Badge variant="outline" className={cn("text-[10px]",
                      selectedResult.disease.chemicalTreatmentEffective ? "text-emerald-700" : "text-rose-700"
                    )}>
                      {selectedResult.disease.chemicalTreatmentEffective ? "Chemical treatment OK" : "No chemical cure"}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Inference confidence: <span className="font-mono font-semibold text-emerald-700">{(selectedResult.confidence * 100).toFixed(0)}%</span>
                  {" · "}symptom fit {(selectedResult.symptomFit * 100).toFixed(0)}%
                  {" · "}env fit {(selectedResult.environmentalFit * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted-foreground italic">{selectedResult.reason}</p>
              </CardHeader>
              <CardContent>
                {/* Matched symptoms */}
                {selectedResult.matchedSymptoms.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Matched symptoms</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedResult.matchedSymptoms.map(s => (
                        <Badge key={s} variant="outline" className="text-[10px] bg-emerald-50">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Knowledge base fields */}
                <div className="space-y-2.5">
                  <KbField icon={AlertTriangle} iconColor="text-amber-600" label="Causes" text={selectedResult.disease.causes} />
                  <KbField icon={Microscope} iconColor="text-rose-600" label="Major symptom" text={selectedResult.disease.majorSymptom} />
                  <KbField icon={Lightbulb} iconColor="text-emerald-600" label="Treatment" text={selectedResult.disease.treatment}
                    highlight={!selectedResult.disease.chemicalTreatmentEffective ? "warning" : undefined} />
                  <KbField icon={Activity} iconColor="text-blue-600" label="Damage handling" text={selectedResult.disease.damageHandling} />
                </div>

                {/* Voice Agent dialogue preview */}
                <div className="mt-4 rounded-md border bg-blue-50 border-blue-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <div className="text-sm font-semibold text-blue-800">Voice Agent Dialogue</div>
                    <Badge variant="outline" className="text-[10px] ml-auto">EN · Amharic-ready</Badge>
                  </div>
                  {(() => {
                    const dialogue = generateVoiceDialogue(selectedResult, selectedParcel, { includeInferenceNote: true });
                    return (
                      <div className="space-y-2 text-xs text-foreground">
                        <VoicePlayer
                          sections={[
                            { label: "Empathy", text: dialogue.empathy },
                            { label: "Explanation", text: dialogue.explanation },
                            { label: "Action", text: dialogue.immediateAction },
                            { label: "Prevention", text: dialogue.futurePrevention },
                          ]}
                          title="dialogue"
                          buttonLabel="Speak dialogue"
                          className="mb-2"
                        />
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-blue-700">Empathy &amp; Identification:</span>
                          <p className="italic">{dialogue.empathy}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-blue-700">Explanation:</span>
                          <p>{dialogue.explanation}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-blue-700">Immediate Action:</span>
                          <p>{dialogue.immediateAction}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-blue-700">Future Prevention:</span>
                          <p>{dialogue.futurePrevention}</p>
                        </div>
                        {dialogue.inferenceNote && (
                          <div className="text-[10px] text-muted-foreground italic pt-1 border-t border-blue-200">
                            {dialogue.inferenceNote}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty state */}
      {(!inferenceResults || inferenceResults.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Stethoscope className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <div className="text-sm font-semibold text-foreground mb-1">Ready to run inference</div>
            <div className="text-xs text-muted-foreground">
              Select observed symptoms above, then click "Run Inference". The engine combines symptom matching
              (60% weight) with live environmental fit (40% weight) to rank likely diseases.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KbField({
  icon: Icon, iconColor, label, text, highlight,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  text: string;
  highlight?: "warning" | "danger";
}) {
  return (
    <div className={cn(
      "rounded-md border p-2.5",
      highlight === "warning" && "bg-amber-50 border-amber-200",
      highlight === "danger" && "bg-rose-50 border-rose-200",
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("w-3.5 h-3.5", iconColor)} />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      </div>
      <p className="text-xs text-foreground leading-relaxed">{text}</p>
    </div>
  );
}
