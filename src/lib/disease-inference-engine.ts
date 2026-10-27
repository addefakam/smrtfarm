/**
 * Disease Inference Engine — rule-based matching against the wheat disease KB.
 *
 * Combines:
 *   1. Symptom keyword matching (user-selected symptoms vs. disease symptomKeywords)
 *   2. Environmental fit (current humidity, temperature, recent rain, growth stage
 *      vs. disease favorableConditions)
 *
 * Returns ranked list of likely diseases with confidence scores and human-readable
 * reasoning. Used by:
 *   - Disease Advisor view (user-driven inference)
 *   - Live interventions feed (auto-generated parcel-specific recommendations)
 *   - Voice Agent dialogue generator (for accessible advisory output)
 *
 * The area-specific decision logic uses the AOI's current live weather (humidity,
 * temperature, recent rain from useLiveSensorData) to weight disease likelihood.
 */

import {
  DISEASE_KNOWLEDGE_BASE, SYMPTOM_OPTIONS,
  type DiseaseEntry, type DiseaseSeverity,
} from "./disease-knowledge-base";
import type { Parcel } from "./mock-data";

export interface InferenceInput {
  parcel: Parcel;
  selectedSymptomIds: string[];
  currentHumidity: number;
  currentTemp: number;
  recentRain: boolean;
  // Optional: soil moisture for root-rot weighting
  currentSoilMoisture?: number;
}

export interface DiseaseMatch {
  disease: DiseaseEntry;
  confidence: number;             // 0-1
  matchedSymptoms: string[];      // human-readable labels
  environmentalFit: number;        // 0-1
  symptomFit: number;              // 0-1
  reason: string;                 // human-readable explanation
  severity: DiseaseSeverity;
}

/**
 * Run inference: for each disease in the KB, compute confidence based on:
 *   - symptom match score (60% weight)
 *   - environmental fit (40% weight)
 *
 * Returns only diseases with confidence > 0, sorted descending.
 */
export function inferDiseases(input: InferenceInput): DiseaseMatch[] {
  const matches: DiseaseMatch[] = [];

  for (const disease of DISEASE_KNOWLEDGE_BASE) {
    const matchedSymptomLabels: string[] = [];
    let symptomScore = 0;
    const reasons: string[] = [];

    // ─── 1. Symptom matching ───
    // For each selected symptom, check if the disease's symptomKeywords contain a related phrase
    for (const symId of input.selectedSymptomIds) {
      const symOpt = SYMPTOM_OPTIONS.find(s => s.id === symId);
      if (!symOpt) continue;
      // Direct keyword match: does any symptomKeyword in the disease include (or included by) this symptom's label?
      const symText = symOpt.label.toLowerCase();
      for (const kw of disease.symptomKeywords) {
        const kwText = kw.toLowerCase();
        // Match if either string contains the other (handles "brown spots" → "Brown spots on leaves")
        if (symText.includes(kwText) || kwText.includes(symText)) {
          if (!matchedSymptomLabels.includes(symOpt.label)) {
            matchedSymptomLabels.push(symOpt.label);
          }
          symptomScore += 1;
          break;
        }
      }
    }

    // ─── 2. Environmental fit ───
    const env = disease.favorableConditions;
    let envMatchedCount = 0;
    let envTotalChecks = 0;

    if (env.humidityRange) {
      envTotalChecks += 1;
      const [min, max] = env.humidityRange;
      if (input.currentHumidity >= min && input.currentHumidity <= max) {
        envMatchedCount += 1;
        reasons.push(`humidity ${input.currentHumidity}% within favorable range [${min}-${max}%]`);
      }
    }
    if (env.tempRange) {
      envTotalChecks += 1;
      const [min, max] = env.tempRange;
      if (input.currentTemp >= min && input.currentTemp <= max) {
        envMatchedCount += 1;
        reasons.push(`temperature ${input.currentTemp}°C within favorable range [${min}-${max}°C]`);
      }
    }
    if (env.rainRequired) {
      envTotalChecks += 1;
      if (input.recentRain) {
        envMatchedCount += 1;
        reasons.push("recent rain favors spore splash dispersal");
      }
    }
    if (env.growthStages && env.growthStages.length > 0) {
      envTotalChecks += 1;
      if (input.parcel.growthStage && env.growthStages.includes(input.parcel.growthStage)) {
        envMatchedCount += 1;
        reasons.push(`parcel at ${input.parcel.growthStage} stage (susceptible)`);
      }
    }

    // ─── 3. Combine into confidence ───
    const symptomFit = disease.symptomKeywords.length > 0
      ? symptomScore / Math.min(disease.symptomKeywords.length, 4)  // cap at 4 keywords
      : 0;
    const environmentalFit = envTotalChecks > 0 ? envMatchedCount / envTotalChecks : 0;
    const symptomWeight = 0.6;
    const envWeight = 0.4;
    const confidence = symptomScore > 0
      ? (symptomFit * symptomWeight) + (environmentalFit * envWeight)
      : (environmentalFit * envWeight * 0.5); // If no symptom match, only env-based confidence (reduced)

    // ─── 4. Add to results if any signal ───
    if (symptomScore > 0 || envMatchedCount > 0) {
      matches.push({
        disease,
        confidence: Math.min(1, confidence),
        matchedSymptoms: matchedSymptomLabels,
        environmentalFit,
        symptomFit,
        reason: reasons.length > 0
          ? reasons.join("; ")
          : "no environmental match (conditions outside favorable range)",
        severity: disease.severityClass,
      });
    }
  }

  // Sort by confidence descending; tie-break by severity
  const sevWeight: Record<DiseaseSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return matches.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return sevWeight[b.severity] - sevWeight[a.severity];
  });
}

/**
 * Generate the Voice Agent dialogue following the directive template:
 *   1. Empathy & Identification
 *   2. Explanation (causes)
 *   3. Immediate Action (treatment)
 *   4. Future Prevention (damage handling)
 *
 * The output is plain text formatted for text-to-speech.
 * Ready to be transcribed to Amharic for multilingual support.
 */
export interface VoiceDialogue {
  empathy: string;
  explanation: string;
  immediateAction: string;
  futurePrevention: string;
  fullDialogue: string;
  inferenceNote: string;
}

export function generateVoiceDialogue(
  match: DiseaseMatch,
  parcel: Parcel,
  options: { includeInferenceNote?: boolean } = {}
): VoiceDialogue {
  const d = match.disease;
  const symptoms = match.matchedSymptoms.length > 0
    ? match.matchedSymptoms.join(", ")
    : "environmental indicators";
  const confidencePct = (match.confidence * 100).toFixed(0);

  const empathy = `Based on the symptoms you described — ${symptoms} — your field ${parcel.parcelCode} (${parcel.owner}, ${parcel.areaHa} hectares, ${parcel.growthStage} stage) might be suffering from ${d.name}.`;
  const explanation = `This disease is usually caused by ${d.causes}`;
  const immediateAction = `For treatment, ${d.treatment}`;
  const futurePrevention = `To manage the ongoing damage and prevent future loss, I recommend you ${d.damageHandling}`;
  const inferenceNote = options.includeInferenceNote
    ? `(Inference confidence: ${confidencePct}%. Reasoning: ${match.reason}.)`
    : "";

  const fullDialogue = [
    empathy,
    "",
    explanation,
    "",
    immediateAction,
    "",
    futurePrevention,
    inferenceNote ? "" : "",
    inferenceNote,
  ].filter(Boolean).join("\n");

  return {
    empathy, explanation, immediateAction, futurePrevention,
    fullDialogue, inferenceNote,
  };
}

/**
 * Generate a brief advisory string for use in the live interventions feed.
 * Truncates the KB treatment into a 1-line action recommendation.
 */
export function generateKbInterventionAction(disease: DiseaseEntry, parcel: Parcel): {
  pattern: string;
  message: string;
  action: string;
} {
  const pattern = `${disease.name} detected at ${parcel.parcelCode} (${parcel.growthStage})`;
  const message = `${disease.name} outbreak — ${disease.pathogenType} infection`;
  const action = disease.chemicalTreatmentEffective
    ? `${disease.treatment.slice(0, 100)}${disease.treatment.length > 100 ? "…" : ""}`
    : `No chemical cure — focus on prevention: ${disease.damageHandling.slice(0, 100)}${disease.damageHandling.length > 100 ? "…" : ""}`;
  return { pattern, message, action };
}
