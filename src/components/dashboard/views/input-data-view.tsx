"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  getParcelsBySite, SITES, type SiteId,
} from "@/lib/mock-data";
import {
  writeSoilReading, writeWeather, writeReflectance, writeShapefile,
  getLocalSoilReadings, getLocalWeatherObs, getLocalReflectance, getLocalShapefiles,
  clearAllLocalData,
  type SoilReadingInput, type WeatherInput, type ReflectanceInput, type ShapefileInput,
} from "@/lib/data-store";
import { isFirebaseConfigured } from "@/lib/firebase";
import { parseShapefile, generateSampleShapefile, type ParsedShapefile } from "@/lib/shapefile-parser";
import { cn } from "@/lib/utils";
import {
  Microscope, Cloud, Radio, FileUp, Database, Zap, RefreshCw, FlaskConical, Upload, MapPin,
} from "lucide-react";

// Leaflet map — dynamic import to avoid SSR issues
const LeafletMap = dynamic(() => import("@/components/dashboard/leaflet-map").then(m => m.default), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-muted/30 animate-pulse rounded-md flex items-center justify-center text-sm text-muted-foreground">Loading Leaflet map…</div>,
});

interface InputDataViewProps {
  siteId: SiteId;
}

export function InputDataView({ siteId }: InputDataViewProps) {
  const { toast } = useToast();
  const site = SITES.find(s => s.id === siteId)!;
  const parcels = getParcelsBySite(siteId);

  // Local refresh counter (re-read recent submissions after each write)
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener("pfe:dataChange", handler);
    return () => window.removeEventListener("pfe:dataChange", handler);
  }, []);

  // ── Soil form state ──
  const [soilForm, setSoilForm] = useState({
    parcelId: parcels[0]?.id || "",
    n: "45", p: "18", k: "210", ph: "6.4", ec: "0.8",
    moisture: "32", soilTemp: "22", humidity: "65",
  });

  // ── Reflectance form state ──
  const [refForm, setRefForm] = useState({
    parcelId: parcels[0]?.id || "",
    blue: "0.07", green: "0.10", red: "0.05",
    nir: "0.50", re: "0.30", swir1: "0.15",
    source: "uav" as "uav" | "sentinel2" | "manual",
  });

  // ── Weather form state ──
  const [weatherForm, setWeatherForm] = useState({
    aoiId: siteId,
    date: new Date().toISOString().slice(0, 10),
    tMax: String(site.weatherToday.t_max),
    tMin: String(site.weatherToday.t_min),
    rh: String(site.weatherToday.rh),
    wind: String(site.weatherToday.wind_speed),
    solarRad: String(site.weatherToday.solar_rad),
    rain: String(site.weatherToday.rain),
    et0: String(site.weatherToday.et0),
  });

  // ── Shapefile upload state ──
  const [parsedShapefile, setParsedShapefile] = useState<ParsedShapefile | null>(null);
  const [shpFileName, setShpFileName] = useState<string>("");
  const [uploadMode, setUploadMode] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState<string>("");

  // Reset parcel selection on site change only (not on every parcels array reference)
   
  useEffect(() => {
    const first = parcels[0];
    if (first) {
      setSoilForm(f => ({ ...f, parcelId: first.id }));
      setRefForm(f => ({ ...f, parcelId: first.id }));
    }
    setWeatherForm(f => ({
      ...f, aoiId: siteId,
      tMax: String(site.weatherToday.t_max), tMin: String(site.weatherToday.t_min),
      rh: String(site.weatherToday.rh), wind: String(site.weatherToday.wind_speed),
      solarRad: String(site.weatherToday.solar_rad), rain: String(site.weatherToday.rain),
      et0: String(site.weatherToday.et0),
    }));
     
  }, [siteId]);

  // ── Handlers ──
  async function handleSoilSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parcel = parcels.find(p => p.id === soilForm.parcelId);
    if (!parcel) return;
    const input: SoilReadingInput = {
      parcelId: parcel.id, parcelCode: parcel.parcelCode,
      ts: new Date().toISOString(),
      n: parseFloat(soilForm.n), p: parseFloat(soilForm.p), k: parseFloat(soilForm.k),
      ph: parseFloat(soilForm.ph), ec: parseFloat(soilForm.ec),
      moisture: parseFloat(soilForm.moisture), soilTemp: parseFloat(soilForm.soilTemp),
      humidity: parseFloat(soilForm.humidity), source: "manual",
    };
    const result = await writeSoilReading(input);
    toast({
      title: "Soil reading saved",
      description: `${result.mode === "firebase" ? "→ Firebase RTDB" : "→ localStorage"} · ${parcel.parcelCode} N=${input.n}ppm · moisture=${input.moisture}%`,
    });
    setRefreshKey(k => k + 1);
  }

  async function handleReflectanceSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parcel = parcels.find(p => p.id === refForm.parcelId);
    if (!parcel) return;
    const input: ReflectanceInput = {
      parcelId: parcel.id, parcelCode: parcel.parcelCode,
      date: new Date().toISOString().slice(0, 10),
      blue: parseFloat(refForm.blue), green: parseFloat(refForm.green), red: parseFloat(refForm.red),
      nir: parseFloat(refForm.nir), re: parseFloat(refForm.re), swir1: parseFloat(refForm.swir1),
      source: refForm.source,
    };
    const result = await writeReflectance(input);
    toast({
      title: "Reflectance values saved",
      description: `${result.mode === "firebase" ? "→ Firebase RTDB" : "→ localStorage"} · ${parcel.parcelCode} NIR=${input.nir} · NDVI=${((input.nir - input.red) / (input.nir + input.red)).toFixed(2)}`,
    });
    setRefreshKey(k => k + 1);
  }

  async function handleWeatherSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: WeatherInput = {
      aoiId: weatherForm.aoiId, date: weatherForm.date,
      tMax: parseFloat(weatherForm.tMax), tMin: parseFloat(weatherForm.tMin),
      rh: parseFloat(weatherForm.rh), wind: parseFloat(weatherForm.wind),
      solarRad: parseFloat(weatherForm.solarRad), rain: parseFloat(weatherForm.rain),
      et0: parseFloat(weatherForm.et0), source: "manual",
    };
    const result = await writeWeather(input);
    toast({
      title: "Weather observation saved",
      description: `${result.mode === "firebase" ? "→ Firebase RTDB" : "→ localStorage"} · ${site.name} · T_max=${input.tMax}°C · ET₀=${input.et0}mm`,
    });
    setRefreshKey(k => k + 1);
  }

  async function handleShpFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length < 1) return;
    setUploadMode("parsing");
    setUploadError("");
    try {
      const shpFile = Array.from(files).find(f => f.name.toLowerCase().endsWith(".shp"));
      const dbfFile = Array.from(files).find(f => f.name.toLowerCase().endsWith(".dbf"));
      if (!shpFile) throw new Error("No .shp file found. Please select .shp (+ .dbf, .shx, .prj)");
      const shpBuf = await shpFile.arrayBuffer();
      const dbfBuf = dbfFile ? await dbfFile.arrayBuffer() : undefined;
      const parsed = await parseShapefile(shpBuf, dbfBuf);
      setParsedShapefile(parsed);
      setShpFileName(shpFile.name);
      setUploadMode("done");
      toast({
        title: "Shapefile parsed",
        description: `${parsed.featureCount} features · bbox=[${parsed.bbox?.map(v => v.toFixed(3)).join(", ")}]`,
      });
    } catch (err) {
      setUploadMode("error");
      setUploadError(err instanceof Error ? err.message : String(err));
      toast({ title: "Shapefile parse failed", description: String(err), variant: "destructive" });
    }
  }

  async function handleGenerateSample() {
    setUploadMode("parsing");
    setUploadError("");
    try {
      const sample = generateSampleShapefile(site.lon, site.lat, 9);
      setParsedShapefile(sample);
      setShpFileName(`sample-${site.id}-${Date.now()}.shp`);
      setUploadMode("done");
      toast({
        title: "Sample shapefile generated",
        description: `${sample.featureCount} sample parcels centered on ${site.name}`,
      });
    } catch (err) {
      setUploadMode("error");
      setUploadError(String(err));
    }
  }

  async function handleSaveShapefile() {
    if (!parsedShapefile) return;
    const input: ShapefileInput = {
      aoiId: siteId,
      fileName: shpFileName || "uploaded.shp",
      featureCount: parsedShapefile.featureCount,
      geoJson: parsedShapefile.geoJson,
      uploadedAt: new Date().toISOString(),
    };
    const result = await writeShapefile(input);
    toast({
      title: "Shapefile stored",
      description: `${result.mode === "firebase" ? "→ Firebase RTDB" : "→ localStorage"} · ${parsedShapefile.featureCount} parcels for ${site.name}`,
    });
    setRefreshKey(k => k + 1);
  }

  function handleClearAll() {
    clearAllLocalData();
    setParsedShapefile(null);
    setShpFileName("");
    setUploadMode("idle");
    toast({ title: "Local data cleared", description: "All localStorage entries removed" });
    setRefreshKey(k => k + 1);
  }

  // Recent submissions
  const recentSoil = getLocalSoilReadings().slice(-5).reverse();
  const recentRef = getLocalReflectance().slice(-5).reverse();
  const recentWeather = getLocalWeatherObs().slice(-5).reverse();
  const recentShapefiles = getLocalShapefiles().slice(-5).reverse();

  return (
    <div className="space-y-4">
      {/* Module banner */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span className="text-base font-semibold text-foreground">Input Data Module</span>
                <Badge variant="outline" className="text-[10px]">
                  {isFirebaseConfigured() ? "Firebase RTDB live" : "Mock mode (localStorage)"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Submit soil properties, reflectance values, weather observations, and shapefiles. Each submission triggers re-computation of vegetation indices, soil-water balance, and inference recommendations.
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="text-muted-foreground">Site</div>
              <div className="font-semibold text-foreground">{site.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {site.lat.toFixed(4)}°N, {site.lon.toFixed(4)}°E
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Soil | Reflectance | Weather | Shapefile */}
      <Tabs defaultValue="soil" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
          <TabsTrigger value="soil" className="text-xs">
            <Microscope className="w-3.5 h-3.5 mr-1.5" />
            Soil Properties
          </TabsTrigger>
          <TabsTrigger value="reflectance" className="text-xs">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Reflectance
          </TabsTrigger>
          <TabsTrigger value="weather" className="text-xs">
            <Cloud className="w-3.5 h-3.5 mr-1.5" />
            Weather
          </TabsTrigger>
          <TabsTrigger value="shapefile" className="text-xs">
            <FileUp className="w-3.5 h-3.5 mr-1.5" />
            Shapefile
          </TabsTrigger>
        </TabsList>

        {/* ─── Soil Properties ─── */}
        <TabsContent value="soil">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Microscope className="w-4 h-4 text-amber-600" />
                NPK Sensor Reading
              </CardTitle>
              <p className="text-xs text-muted-foreground">Per-parcel in-situ probe reading (write to Firebase RTDB → triggers IWSS re-computation)</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSoilSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-1">
                    <Label htmlFor="parcelId" className="text-xs">Parcel</Label>
                    <select
                      id="parcelId"
                      value={soilForm.parcelId}
                      onChange={e => setSoilForm(f => ({ ...f, parcelId: e.target.value }))}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {parcels.map(p => <option key={p.id} value={p.id}>{p.parcelCode} · {p.owner}</option>)}
                    </select>
                  </div>
                  <NumberInput label="N (ppm)" value={soilForm.n} onChange={v => setSoilForm(f => ({ ...f, n: v }))} color="text-amber-700" />
                  <NumberInput label="P-Olsen (ppm)" value={soilForm.p} onChange={v => setSoilForm(f => ({ ...f, p: v }))} color="text-yellow-700" />
                  <NumberInput label="K-exch (ppm)" value={soilForm.k} onChange={v => setSoilForm(f => ({ ...f, k: v }))} color="text-orange-700" />
                  <NumberInput label="pH" value={soilForm.ph} onChange={v => setSoilForm(f => ({ ...f, ph: v }))} color="text-emerald-700" step="0.1" />
                  <NumberInput label="EC (dS/m)" value={soilForm.ec} onChange={v => setSoilForm(f => ({ ...f, ec: v }))} color="text-emerald-700" step="0.01" />
                  <NumberInput label="Moisture (%)" value={soilForm.moisture} onChange={v => setSoilForm(f => ({ ...f, moisture: v }))} color="text-blue-700" />
                  <NumberInput label="Soil Temp (°C)" value={soilForm.soilTemp} onChange={v => setSoilForm(f => ({ ...f, soilTemp: v }))} color="text-amber-700" />
                  <NumberInput label="Air RH (%)" value={soilForm.humidity} onChange={v => setSoilForm(f => ({ ...f, humidity: v }))} color="text-emerald-700" />
                </div>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800">
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
                  Submit soil reading
                </Button>
              </form>

              {/* Recent submissions */}
              {recentSoil.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Recent submissions (last 5)</div>
                  <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                    {recentSoil.map((r, i) => (
                      <div key={i} className="text-[11px] font-mono bg-muted/40 rounded px-2 py-1 flex items-center justify-between">
                        <span><span className="text-emerald-700 font-semibold">{r.parcelCode}</span> · N={r.n} · P={r.p} · K={r.k} · pH={r.ph} · moist={r.moisture}%</span>
                        <span className="text-muted-foreground">{new Date(r.ts).toLocaleString().slice(5, 17)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Reflectance ─── */}
        <TabsContent value="reflectance">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Spectral Reflectance per Band
              </CardTitle>
              <p className="text-xs text-muted-foreground">Per-parcel reflectance (0-1) for UAV multispectral or Sentinel-2 imagery → triggers M3 indices re-computation (NDVI, NDRE, NDMI, GNDVI, SAVI, LAI)</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReflectanceSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-1">
                    <Label htmlFor="refParcelId" className="text-xs">Parcel</Label>
                    <select
                      id="refParcelId"
                      value={refForm.parcelId}
                      onChange={e => setRefForm(f => ({ ...f, parcelId: e.target.value }))}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {parcels.map(p => <option key={p.id} value={p.id}>{p.parcelCode} · {p.owner}</option>)}
                    </select>
                  </div>
                  <NumberInput label="Blue (B)" value={refForm.blue} onChange={v => setRefForm(f => ({ ...f, blue: v }))} color="text-blue-700" step="0.001" />
                  <NumberInput label="Green (G)" value={refForm.green} onChange={v => setRefForm(f => ({ ...f, green: v }))} color="text-emerald-700" step="0.001" />
                  <NumberInput label="Red (R)" value={refForm.red} onChange={v => setRefForm(f => ({ ...f, red: v }))} color="text-rose-700" step="0.001" />
                  <NumberInput label="NIR" value={refForm.nir} onChange={v => setRefForm(f => ({ ...f, nir: v }))} color="text-emerald-900" step="0.001" />
                  <NumberInput label="Red-Edge" value={refForm.re} onChange={v => setRefForm(f => ({ ...f, re: v }))} color="text-teal-700" step="0.001" />
                  <NumberInput label="SWIR1" value={refForm.swir1} onChange={v => setRefForm(f => ({ ...f, swir1: v }))} color="text-amber-700" step="0.001" />
                  <div>
                    <Label htmlFor="source" className="text-xs">Source</Label>
                    <select
                      id="source"
                      value={refForm.source}
                      onChange={e => setRefForm(f => ({ ...f, source: e.target.value as ReflectanceInput["source"] }))}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="uav">UAV (MicaSense / DJI Mavic 3M)</option>
                      <option value="sentinel2">Sentinel-2 L2A (10m)</option>
                      <option value="manual">Manual entry</option>
                    </select>
                  </div>
                </div>

                {/* Computed indices preview */}
                <div className="rounded-md bg-muted/40 border p-2.5">
                  <div className="text-xs text-muted-foreground mb-1.5">Computed indices (preview)</div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
                    {(() => {
                      const r = parseFloat(refForm.red);
                      const n = parseFloat(refForm.nir);
                      const g = parseFloat(refForm.green);
                      const re = parseFloat(refForm.re);
                      const swir = parseFloat(refForm.swir1);
                      const safeDiv = (a: number, b: number) => b === 0 ? 0 : a / b;
                      return (
                        <>
                          <div><span className="text-muted-foreground">NDVI</span> <span className="font-bold text-emerald-700">{safeDiv(n - r, n + r).toFixed(2)}</span></div>
                          <div><span className="text-muted-foreground">NDRE</span> <span className="font-bold text-teal-700">{safeDiv(n - re, n + re).toFixed(2)}</span></div>
                          <div><span className="text-muted-foreground">NDMI</span> <span className="font-bold text-blue-700">{safeDiv(n - swir, n + swir).toFixed(2)}</span></div>
                          <div><span className="text-muted-foreground">GNDVI</span> <span className="font-bold text-emerald-700">{safeDiv(n - g, n + g).toFixed(2)}</span></div>
                          <div><span className="text-muted-foreground">SAVI</span> <span className="font-bold text-amber-700">{(safeDiv(n - r, n + r + 0.5) * 1.5).toFixed(2)}</span></div>
                          <div><span className="text-muted-foreground">LAI</span> <span className="font-bold text-foreground">{(Math.max(0, safeDiv(n - r, n + r)) * 5.5).toFixed(1)}</span></div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800">
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
                  Submit reflectance values
                </Button>
              </form>

              {recentRef.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Recent submissions (last 5)</div>
                  <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                    {recentRef.map((r, i) => (
                      <div key={i} className="text-[11px] font-mono bg-muted/40 rounded px-2 py-1 flex items-center justify-between">
                        <span><span className="text-emerald-700 font-semibold">{r.parcelCode}</span> · NIR={r.nir} · RE={r.re} · src={r.source}</span>
                        <span className="text-muted-foreground">{r.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Weather ─── */}
        <TabsContent value="weather">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                Weather Observation
              </CardTitle>
              <p className="text-xs text-muted-foreground">Per-AOI daily weather — drives FAO-56 Penman-Monteith ET₀ → IWSS soil-water balance</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWeatherSubmit} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <Label htmlFor="wDate" className="text-xs">Date</Label>
                    <Input id="wDate" type="date" value={weatherForm.date} onChange={e => setWeatherForm(f => ({ ...f, date: e.target.value }))} className="h-9" />
                  </div>
                  <NumberInput label="T_max (°C)" value={weatherForm.tMax} onChange={v => setWeatherForm(f => ({ ...f, tMax: v }))} color="text-amber-700" />
                  <NumberInput label="T_min (°C)" value={weatherForm.tMin} onChange={v => setWeatherForm(f => ({ ...f, tMin: v }))} color="text-blue-700" />
                  <NumberInput label="RH (%)" value={weatherForm.rh} onChange={v => setWeatherForm(f => ({ ...f, rh: v }))} color="text-emerald-700" />
                  <NumberInput label="Wind (m/s)" value={weatherForm.wind} onChange={v => setWeatherForm(f => ({ ...f, wind: v }))} color="text-teal-700" step="0.1" />
                  <NumberInput label="Solar rad (MJ/m²/d)" value={weatherForm.solarRad} onChange={v => setWeatherForm(f => ({ ...f, solarRad: v }))} color="text-yellow-700" step="0.1" />
                  <NumberInput label="Rain (mm)" value={weatherForm.rain} onChange={v => setWeatherForm(f => ({ ...f, rain: v }))} color="text-blue-700" step="0.1" />
                  <NumberInput label="ET₀ (mm/d)" value={weatherForm.et0} onChange={v => setWeatherForm(f => ({ ...f, et0: v }))} color="text-orange-700" step="0.1" />
                </div>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800">
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
                  Submit weather observation
                </Button>
              </form>

              {recentWeather.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Recent observations (last 5)</div>
                  <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                    {recentWeather.map((r, i) => (
                      <div key={i} className="text-[11px] font-mono bg-muted/40 rounded px-2 py-1 flex items-center justify-between">
                        <span><span className="text-emerald-700 font-semibold">{r.aoiId}</span> · {r.date} · T={r.tMin}-{r.tMax}°C · RH={r.rh}% · ET₀={r.et0}mm · rain={r.rain}mm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Shapefile ─── */}
        <TabsContent value="shapefile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-emerald-600" />
                  Shapefile Upload
                </CardTitle>
                <p className="text-xs text-muted-foreground">Upload .shp + .dbf (+ .shx + .prj optional) → parse in-browser → render on Leaflet map → store to PostGIS/Firebase</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Upload zone */}
                  <label
                    htmlFor="shpUpload"
                    className={cn(
                      "block border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
                      uploadMode === "parsing" ? "border-emerald-400 bg-emerald-50" :
                      uploadMode === "done" ? "border-emerald-600 bg-emerald-50" :
                      uploadMode === "error" ? "border-rose-400 bg-rose-50" :
                      "border-border hover:border-emerald-400 hover:bg-emerald-50/30"
                    )}
                  >
                    <Upload className={cn("w-8 h-8 mx-auto mb-2", uploadMode === "done" ? "text-emerald-700" : "text-muted-foreground")} />
                    <div className="text-sm font-medium text-foreground">
                      {uploadMode === "parsing" ? "Parsing…" :
                       uploadMode === "done" ? `${shpFileName} parsed` :
                       uploadMode === "error" ? "Upload failed — try again" :
                       "Click to select .shp + .dbf files"}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Or use the "Generate sample" button below for demo purposes
                    </div>
                    <input
                      id="shpUpload"
                      type="file"
                      multiple
                      accept=".shp,.dbf,.shx,.prj"
                      onChange={handleShpFileSelect}
                      className="hidden"
                      disabled={uploadMode === "parsing"}
                    />
                  </label>
                  {uploadError && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                      {uploadError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSample}
                      disabled={uploadMode === "parsing"}
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      Generate sample (9 parcels)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveShapefile}
                      disabled={!parsedShapefile}
                    >
                      <Database className="w-3.5 h-3.5 mr-1" />
                      Save to DB
                    </Button>
                  </div>

                  {/* Parsed shapefile info */}
                  {parsedShapefile && (
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2.5 text-xs space-y-1">
                      <div className="font-semibold text-emerald-800">Parsed shapefile</div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Features</span><span className="font-mono font-semibold">{parsedShapefile.featureCount}</span></div>
                      {parsedShapefile.bbox && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">BBox</span>
                          <span className="font-mono text-[10px]">
                            [{parsedShapefile.bbox[0].toFixed(3)}, {parsedShapefile.bbox[1].toFixed(3)}, {parsedShapefile.bbox[2].toFixed(3)}, {parsedShapefile.bbox[3].toFixed(3)}]
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {recentShapefiles.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-2">Recent uploads (last 5)</div>
                      <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                        {recentShapefiles.map((r, i) => (
                          <div key={i} className="text-[11px] font-mono bg-muted/40 rounded px-2 py-1 flex items-center justify-between">
                            <span><span className="text-emerald-700 font-semibold">{r.aoiId}</span> · {r.fileName}</span>
                            <span className="text-muted-foreground">{r.featureCount} feats</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leaflet preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  Map Preview (Leaflet)
                </CardTitle>
                <p className="text-xs text-muted-foreground">Parcel polygons overlaid on OpenStreetMap basemap</p>
              </CardHeader>
              <CardContent>
                <LeafletMap
                  selectedSiteId={siteId}
                  parcelGeoJson={parsedShapefile?.geoJson}
                  height="380px"
                />
                <div className="mt-2 text-[10px] text-muted-foreground text-center">
                  OpenStreetMap basemap · Leaflet 1.9 · click any polygon to inspect
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Clear-all button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleClearAll}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Clear all local data
        </Button>
      </div>
    </div>
  );
}

// ─── Reusable NumberInput sub-component ──────────────────────────
function NumberInput({
  label, value, onChange, color = "text-foreground", step = "1",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  color?: string;
  step?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn("h-9 font-mono", color)}
      />
    </div>
  );
}
