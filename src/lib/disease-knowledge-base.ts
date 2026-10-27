/**
 * Wheat Disease Knowledge Base — 10 priority diseases for Ethiopian wheat.
 *
 * Structured for:
 *   1. Voice Agent dialogue generation (Empathy → Explanation → Action → Prevention)
 *   2. Rule-based inference engine (symptom keyword + environmental fit matching)
 *   3. Auto-recommendation in the live interventions feed
 *
 * Source: project ground-truth document, structured for both human-readable
 * display and machine inference. Bilingual (English + Amharic placeholder)
 * — content is ready to be transcribed to Amharic for multilingual support.
 */

export type DiseaseSeverity = "critical" | "high" | "medium" | "low";
export type PathogenType = "fungal" | "bacterial" | "viral";

export interface DiseaseEntry {
  id: string;
  name: string;
  causes: string;
  majorSymptom: string;
  treatment: string;
  damageHandling: string;
  // Symptom keywords for inference engine matching
  symptomKeywords: string[];
  // Environmental conditions that favor this disease
  favorableConditions: {
    humidityRange?: [number, number]; // %
    tempRange?: [number, number];     // °C
    rainRequired?: boolean;
    growthStages?: string[];
  };
  severityClass: DiseaseSeverity;
  pathogenType: PathogenType;
  chemicalTreatmentEffective: boolean;
}

export const DISEASE_KNOWLEDGE_BASE: DiseaseEntry[] = [
  // ─── 1. Septoria Leaf Blotch ───────────────────────────────────
  {
    id: "septoria_leaf_blotch",
    name: "Septoria Leaf Blotch",
    causes: "Caused by a fungus that thrives and spreads rapidly when cool, wet weather causes rain to splash spores onto the upper leaves.",
    majorSymptom: "Irregular brown or yellowish spots on the leaves. Inside these spots, you can often see small, dark dots that look like black pepper. Severely infected leaves may wither and die early.",
    treatment: "Apply an appropriate foliar fungicide as soon as possible, focusing on protecting the upper leaves, especially right before the heads open.",
    damageHandling: "Plowing under the infected crop residue after harvest, rotating crops, and planting disease-resistant wheat varieties for the next season.",
    symptomKeywords: [
      "brown spots", "yellowish spots", "dark dots", "black pepper",
      "leaf withering", "early dieback", "irregular spots",
    ],
    favorableConditions: {
      humidityRange: [70, 95],
      tempRange: [12, 20],
      rainRequired: true,
    },
    severityClass: "high",
    pathogenType: "fungal",
    chemicalTreatmentEffective: true,
  },

  // ─── 2. Fusarium Head Blight (Wheat Scab) ───────────────────────
  {
    id: "fusarium_head_blight",
    name: "Fusarium Head Blight (Wheat Scab)",
    causes: "Caused by a fungus that usually attacks the wheat plant specifically during the flowering stage, especially if the weather is warm and very humid.",
    majorSymptom: "The wheat heads or spikes will appear prematurely bleached or white. You might also notice a pink or light orange chalky mold forming on the grain.",
    treatment: "Spray fungicides right at the early flowering stage. Once the grain reaches the dough stage, treatments will no longer be effective.",
    damageHandling: "Harvest infected fields separately so you do not mix good and bad grain. Adjust your combine settings to blow out the lightweight infected kernels. Do not use the harvested grain for seed.",
    symptomKeywords: [
      "bleached heads", "white spikes", "pink mold", "orange mold", "chalky grain",
      "premature white heads",
    ],
    favorableConditions: {
      humidityRange: [80, 95],
      tempRange: [20, 28],
      growthStages: ["Flowering", "Booting", "Heading"],
    },
    severityClass: "critical",
    pathogenType: "fungal",
    chemicalTreatmentEffective: true,
  },

  // ─── 3. Powdery Mildew ──────────────────────────────────────────
  {
    id: "powdery_mildew",
    name: "Powdery Mildew",
    causes: "A fungal infection that loves high humidity, dense fields, and cloudy days with moderate temperatures.",
    majorSymptom: "A dusty, white-to-gray powdery mold growing primarily on the upper surfaces of the leaves, and sometimes on the stems and heads.",
    treatment: "Apply fungicides early when you first see the white spots. Do not wait until the mildew covers the whole leaf area.",
    damageHandling: "For the next planting season, avoid using excessive nitrogen fertilizers which make the plant canopy overgrow, and select resistant wheat varieties.",
    symptomKeywords: [
      "white mold", "gray mold", "powdery", "dusty", "leaf surface",
      "stem mold", "white spots",
    ],
    favorableConditions: {
      humidityRange: [70, 90],
      tempRange: [15, 25],
    },
    severityClass: "medium",
    pathogenType: "fungal",
    chemicalTreatmentEffective: true,
  },

  // ─── 4. Barley Yellow Rust (Dwarf/Rust Complex) ────────────────
  {
    id: "barley_yellow_rust",
    name: "Barley Yellow Rust (and Dwarf Virus)",
    causes: "Can act as a wind-borne fungal infection (yellow/stripe rust) or be spread by aphids (yellow dwarf virus).",
    majorSymptom: "Yellow or orange blister-like spots aligned in long stripes on the leaves. If viral, the leaves turn stark yellow or reddish from the tips downward, and the plants appear severely stunted.",
    treatment: "For the fungal rust, spray a systemic fungicide immediately when symptoms are seen. If it is the virus spread by aphids, there is no cure, but applying safe insecticides can reduce the aphid population.",
    damageHandling: "Constantly monitor your fields early in the season. Planting resistant varieties and removing weed grasses that host aphids and rust is essential.",
    symptomKeywords: [
      "yellow stripes", "orange blisters", "stunted", "yellow tips", "red tips",
      "long stripes", "stripes on leaves",
    ],
    favorableConditions: {
      humidityRange: [60, 85],
      tempRange: [10, 20],
    },
    severityClass: "high",
    pathogenType: "fungal",
    chemicalTreatmentEffective: true,
  },

  // ─── 5. Wheat Rust (Yellow, Stem, Stripe Rust) ─────────────────
  {
    id: "wheat_rust",
    name: "Wheat Rust (Stem Rust and Stripe Rust)",
    causes: "Aggressive fungal infections rapidly spread by the wind. They can break out quickly in humid and warm environments.",
    majorSymptom: "For stripe rust, yellow blisters form in lines on the leaves. For stem rust, you will see dark red or brick-colored, raised blisters on the stems and leaves that rub off on your fingers.",
    treatment: "Immediate application of a foliar fungicide is required as soon as pustules are spotted, particularly to protect the flag leaf.",
    damageHandling: "Destroy volunteer wheat around your fields and plant certified rust-resistant wheat varieties, as this is the most effective long-term defense.",
    symptomKeywords: [
      "yellow blisters", "lines on leaves", "brick red", "dark red blisters",
      "raised blisters", "pustules", "rub off",
    ],
    favorableConditions: {
      humidityRange: [60, 90],
      tempRange: [15, 25],
    },
    severityClass: "critical",
    pathogenType: "fungal",
    chemicalTreatmentEffective: true,
  },

  // ─── 6. Ergot Fungal Disease ───────────────────────────────────
  {
    id: "ergot",
    name: "Ergot Fungal Disease",
    causes: "Caused by a fungus invading the wheat flowers during cool and damp weather while the wheat is blooming.",
    majorSymptom: "Instead of normal wheat grains, you will see a hard, dark-purple or black horn-like fungal body growing out of the wheat head.",
    treatment: "There are no chemical fungicide treatments available to cure the plant once Ergot infects the wheat head.",
    damageHandling: "This is highly toxic to humans and animals—do not feed the infected grain to livestock. Use deep plowing to bury the infected soil structures so they do not emerge next year, and mow nearby wild grasses before they bloom.",
    symptomKeywords: [
      "dark purple", "black horn", "horn-like", "toxic grain", "no grain",
      "purple body",
    ],
    favorableConditions: {
      humidityRange: [80, 95],
      tempRange: [12, 18],
      growthStages: ["Flowering"],
    },
    severityClass: "critical",
    pathogenType: "fungal",
    chemicalTreatmentEffective: false,
  },

  // ─── 7. Root Rot (and Soil-Borne Viruses) ───────────────────────
  {
    id: "root_rot",
    name: "Root Rot and Soil-Borne Viruses",
    causes: "Caused by several types of fungi and viruses living within the soil, often worsened in wet, poorly drained areas.",
    majorSymptom: "Plants appear stunted, heavily yellowed, and frequently die prematurely. If you pull a plant out, the roots and the base of the stem will be dark brown or black and easily break off.",
    treatment: "No chemical treatment can cure root rot once it appears in growing wheat. Preventative seed treatments offer the only chemical defense.",
    damageHandling: "Improve your field's water drainage. You must rotate your field with non-cereal crops, like beans or peas, for a few years to kill the pathogens trapped in the soil.",
    symptomKeywords: [
      "stunted", "yellowed", "premature death", "dark roots", "black stem base",
      "weak roots", "break off", "rotten roots",
    ],
    favorableConditions: {
      humidityRange: [80, 100],
      rainRequired: true,
    },
    severityClass: "high",
    pathogenType: "fungal",
    chemicalTreatmentEffective: false,
  },

  // ─── 8. Bacterial Leaf Blight ──────────────────────────────────
  {
    id: "bacterial_leaf_blight",
    name: "Bacterial Leaf Blight",
    causes: "A bacterial disease usually spread by strong winds, heavy, splashing rains, and wet conditions.",
    majorSymptom: "The leaves show small, water-soaked spots that expand into larger, grayish-brown dead patches. During heavy dew, a bacterial slime might be visible on the leaf surface.",
    treatment: "Because this is a bacterial infection, normal fungal sprays will not work. There are currently no effective chemical treatments.",
    damageHandling: "Avoid moving equipment or walking through the field when the plants are wet to prevent spreading the bacteria. Use clean, certified seeds for the next planting.",
    symptomKeywords: [
      "water-soaked spots", "grayish-brown patches", "bacterial slime",
      "leaf slime", "wet patches", "dead patches",
    ],
    favorableConditions: {
      humidityRange: [80, 100],
      rainRequired: true,
    },
    severityClass: "medium",
    pathogenType: "bacterial",
    chemicalTreatmentEffective: false,
  },

  // ─── 9. Take-All Disease ───────────────────────────────────────
  {
    id: "take_all",
    name: "Take-All Disease",
    causes: "A highly destructive root rot fungus that thrives in the soil, especially in fields where wheat or barley is grown year after year without crop rotation.",
    majorSymptom: "Plants are severely stunted and turn prematurely white or yellow. The unique sign is a shiny, coal-black coloring at the very bottom of the stem near the roots. The plants pull out of the soil very easily.",
    treatment: "Fungicides applied to growing plants are completely ineffective against Take-All.",
    damageHandling: "Stop growing wheat on the affected land immediately. Rotate to broadleaf crops for at least two years. Make sure your soil has proper phosphorus fertilization and good drainage.",
    symptomKeywords: [
      "stunted", "premature white", "premature yellow", "coal-black stem",
      "shiny black base", "easily pulled", "black stem",
    ],
    favorableConditions: {
      humidityRange: [60, 90],
    },
    severityClass: "critical",
    pathogenType: "fungal",
    chemicalTreatmentEffective: false,
  },

  // ─── 10. Wheat Streak Mosaic Virus ─────────────────────────────
  {
    id: "wheat_streak_mosaic",
    name: "Wheat Streak Mosaic Virus",
    causes: "A viral disease carried and spread entirely by microscopic insects known as wheat curl mites.",
    majorSymptom: "The leaves show a very bright, mottled yellowish-green mosaic pattern or streaking parallel to the veins. Plants infected early will be very short and produce little to no grain.",
    treatment: "There is no cure for this virus, and chemical sprays against the mites generally do not work well.",
    damageHandling: "The absolute best control is to destroy all volunteer wheat and wild grasses in the area at least two weeks before planting a new winter wheat crop. This breaks the \"green bridge\" and starves the curl mites.",
    symptomKeywords: [
      "mosaic pattern", "yellowish-green streaking", "mottled",
      "vein-parallel streaks", "stunted", "no grain", "bright yellow-green",
    ],
    favorableConditions: {},
    severityClass: "high",
    pathogenType: "viral",
    chemicalTreatmentEffective: false,
  },
];

// ─── Master symptom list (for UI multi-select) ──────────────────
export interface SymptomOption {
  id: string;
  label: string;
  category: "leaf" | "head" | "stem" | "root" | "growth" | "color";
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  // Leaf symptoms
  { id: "brown_spots",          label: "Brown spots on leaves",      category: "leaf" },
  { id: "yellowish_spots",      label: "Yellowish spots",             category: "leaf" },
  { id: "dark_dots",            label: "Dark dots (black pepper)",    category: "leaf" },
  { id: "leaf_withering",       label: "Leaves withering early",      category: "leaf" },
  { id: "yellow_stripes",       label: "Yellow stripes on leaves",    category: "leaf" },
  { id: "orange_blisters",      label: "Orange blister-like spots",   category: "leaf" },
  { id: "brick_red_blisters",   label: "Brick-red raised blisters",   category: "leaf" },
  { id: "pustules",             label: "Pustules that rub off",      category: "leaf" },
  { id: "white_powdery_mold",   label: "White powdery mold",          category: "leaf" },
  { id: "gray_mold",            label: "Gray dusty mold",             category: "leaf" },
  { id: "water_soaked_spots",   label: "Water-soaked spots",          category: "leaf" },
  { id: "gray_brown_patches",   label: "Grayish-brown dead patches",  category: "leaf" },
  { id: "bacterial_slime",      label: "Bacterial slime on leaves",   category: "leaf" },
  { id: "mosaic_pattern",       label: "Mosaic pattern (mottled)",   category: "leaf" },
  { id: "vein_streaks",         label: "Yellow-green vein-parallel streaks", category: "leaf" },

  // Head symptoms
  { id: "bleached_heads",       label: "Bleached / white heads",      category: "head" },
  { id: "pink_mold",            label: "Pink chalky mold on grain",   category: "head" },
  { id: "dark_purple_horns",    label: "Dark purple/black horn-like bodies", category: "head" },
  { id: "no_grain",             label: "Little or no grain",          category: "head" },

  // Stem symptoms
  { id: "coal_black_stem",      label: "Shiny coal-black stem base", category: "stem" },
  { id: "black_stem_base",      label: "Blackened stem base",         category: "stem" },
  { id: "stem_mold",            label: "Mold on stems",               category: "stem" },

  // Root symptoms
  { id: "dark_roots",           label: "Dark brown/black roots",      category: "root" },
  { id: "weak_roots",           label: "Roots break off easily",      category: "root" },

  // Growth symptoms
  { id: "stunted",              label: "Stunted plants",              category: "growth" },
  { id: "premature_white",      label: "Premature white/yellow",      category: "growth" },
  { id: "yellow_tips",          label: "Yellow tips downward",        category: "growth" },
  { id: "red_tips",             label: "Reddish tips",                category: "growth" },

  // Color
  { id: "premature_yellow",     label: "Premature yellowing",         category: "color" },
];

// Mapping from mock-data DISEASE_CLASSES to KB entries
export function mapDiseaseClassToKb(diseaseClass: string): DiseaseEntry | null {
  const map: Record<string, string> = {
    "Yellow rust":          "wheat_rust",
    "Stem rust":            "wheat_rust",
    "Leaf rust":            "wheat_rust",
    "Powdery mildew":       "powdery_mildew",
    "Septoria leaf blotch": "septoria_leaf_blotch",
    "Tan spot":             "septoria_leaf_blotch", // close proxy
  };
  const kbId = map[diseaseClass];
  if (!kbId) return null;
  return DISEASE_KNOWLEDGE_BASE.find(d => d.id === kbId) ?? null;
}

export function getDiseaseById(id: string): DiseaseEntry | null {
  return DISEASE_KNOWLEDGE_BASE.find(d => d.id === id) ?? null;
}

// ─── Severity styling ───────────────────────────────────────────
export const SEVERITY_STYLES: Record<DiseaseSeverity, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "bg-rose-600",   text: "text-rose-700",   border: "border-rose-300",   label: "Critical" },
  high:     { bg: "bg-orange-500", text: "text-orange-700", border: "border-orange-300", label: "High" },
  medium:   { bg: "bg-amber-500",  text: "text-amber-700",  border: "border-amber-300",  label: "Medium" },
  low:      { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-300", label: "Low" },
};

export const PATHOGEN_STYLES: Record<PathogenType, { label: string; color: string }> = {
  fungal:    { label: "Fungal",    color: "text-amber-700" },
  bacterial: { label: "Bacterial", color: "text-teal-700" },
  viral:     { label: "Viral",     color: "text-purple-700" },
};
