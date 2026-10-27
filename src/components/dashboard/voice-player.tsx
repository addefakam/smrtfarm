"use client";

import { useState } from "react";
import { useTTS } from "@/hooks/use-tts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Volume2, Square, Pause, Play, Mic2 } from "lucide-react";

export interface VoiceSection {
  label: string;     // e.g. "Empathy"
  text: string;      // the text to speak
}

interface VoicePlayerProps {
  sections: VoiceSection[];           // ordered list of sections to speak sequentially
  title?: string;
  compact?: boolean;                  // compact mode: hide voice selector + rate slider
  className?: string;
  buttonLabel?: string;                // override default "Speak dialogue" label
}

/**
 * Reusable TTS player that uses the browser SpeechSynthesis API.
 *
 * Features:
 *   - Play all sections sequentially (Empathy → Explanation → Action → Prevention)
 *   - Pause / Resume / Stop
 *   - Per-section clickable chips (speak just one section)
 *   - Active section highlight (auto-advances during playback)
 *   - Voice selector (filters to English by default; Amharic voices appear if installed)
 *   - Rate slider (0.5x–1.5x, default 0.95x for advisory content)
 *   - Graceful degradation when SpeechSynthesis not supported
 */
export function VoicePlayer({
  sections, title = "Voice Agent Dialogue",
  compact = false, className, buttonLabel,
}: VoicePlayerProps) {
  const {
    supported, isSpeaking, isPaused,
    speak, speakSequence, pause, resume, stop,
    voices, selectedVoiceURI, setSelectedVoiceURI,
    rate, setRate,
  } = useTTS();
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);

  if (!supported) {
    return (
      <div className={cn("text-[11px] text-muted-foreground italic flex items-center gap-1.5", className)}>
        <Mic2 className="w-3 h-3" />
        SpeechSynthesis API not supported in this browser — text-only view.
      </div>
    );
  }

  const handlePlayAll = () => {
    if (isSpeaking && isPaused) {
      resume();
      return;
    }
    if (isSpeaking) {
      pause();
      return;
    }
    const texts = sections.map(s => s.text);
    speakSequence(texts, {
      onItemStart: (idx) => setActiveSectionIdx(idx),
      onEnd: () => setActiveSectionIdx(null),
    });
  };

  const playOneSection = (idx: number) => {
    setActiveSectionIdx(idx);
    speak(sections[idx].text, { onEnd: () => setActiveSectionIdx(null) });
  };

  const isCurrentlyPlaying = isSpeaking && !isPaused;
  const canPause = isSpeaking && !isPaused;
  const canResume = isSpeaking && isPaused;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Primary controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={handlePlayAll}
          disabled={sections.length === 0}
          className={cn(
            "transition-colors",
            isCurrentlyPlaying
              ? "bg-amber-600 hover:bg-amber-700"
              : canResume
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {isCurrentlyPlaying ? (
            <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</>
          ) : canResume ? (
            <><Play className="w-3.5 h-3.5 mr-1.5" /> Resume</>
          ) : (
            <><Volume2 className="w-3.5 h-3.5 mr-1.5" /> {buttonLabel || `Speak ${title}`}</>
          )}
        </Button>

        {(isSpeaking || isPaused) && (
          <Button size="sm" variant="outline" onClick={stop}>
            <Square className="w-3.5 h-3.5 mr-1.5" /> Stop
          </Button>
        )}

        {isSpeaking && (
          <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-700">
            <span className="relative flex h-2 w-2 mr-1">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                isPaused ? "" : "animate-ping bg-blue-500"
              )} />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            {isPaused ? "Paused" : "Speaking"}
            {activeSectionIdx !== null && ` · ${sections[activeSectionIdx]?.label}`}
          </Badge>
        )}
      </div>

      {/* Section chips — click to play just that section */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mr-1">Sections:</span>
        {sections.map((s, idx) => (
          <button
            key={idx}
            onClick={() => playOneSection(idx)}
            disabled={isSpeaking && !isPaused}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded border transition-colors disabled:cursor-not-allowed",
              activeSectionIdx === idx
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-card border-border hover:bg-muted/50 hover:border-blue-300",
              (isSpeaking && !isPaused) && "opacity-50"
            )}
          >
            {idx + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* Voice selector + rate slider (hidden in compact mode) */}
      {!compact && voices.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap text-xs pt-1 border-t">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Voice:</span>
            <select
              value={selectedVoiceURI || ""}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs max-w-[220px] font-mono"
              disabled={isSpeaking}
            >
              {/* English voices first */}
              {voices.filter(v => v.lang.startsWith("en")).map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
              {/* Then non-English (Amharic am-ET will surface here when available) */}
              {voices.filter(v => !v.lang.startsWith("en")).length > 0 && (
                <optgroup label="Other languages">
                  {voices.filter(v => !v.lang.startsWith("en")).map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Rate:</span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-20"
              disabled={isSpeaking}
            />
            <span className="font-mono text-foreground w-10">{rate.toFixed(2)}x</span>
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground">
        Uses browser SpeechSynthesis API · English voice auto-selected · Amharic-ready (when am-ET voice installed in OS)
      </div>
    </div>
  );
}
