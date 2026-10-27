"use client";

/**
 * Text-to-Speech hook — wraps the browser SpeechSynthesis API.
 *
 * Features:
 *   - Auto-detect support (SSR-safe: returns supported=false on server)
 *   - Load available voices (async, browser-dependent)
 *   - Auto-select English voice (en-US preferred, en-* fallback)
 *   - speak(text, opts): single utterance
 *   - speakSequence(texts, opts): multi-paragraph sequential playback
 *       (used for the 4-section Voice Agent dialogue)
 *   - pause / resume / stop controls
 *   - State: isSpeaking, isPaused, currentText
 *   - Configurable: rate (0.95 default — slightly slower for advisory content),
 *       pitch (1.0 default), selectedVoiceURI
 *
 * Accessibility:
 *   - When supported=false (older browsers / SSR), UI gracefully degrades
 *     to a "TTS not supported" notice — the text dialogue is still readable
 *
 * Production note:
 *   - The hook works in any modern browser (Chrome, Firefox, Safari, Edge)
 *   - For Amharic support: when an am-ET voice is installed in the OS,
 *     it will appear in the voices list — the UI already filters by
 *     language, so Amharic voices will surface automatically once available
 *   - For higher-quality TTS (e.g., Azure Neural TTS), swap this hook's
 *     speak() implementation with a fetch() to the cloud TTS endpoint
 *     and play the returned audio via <audio> element
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface TTSVoice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  isDefault: boolean;
}

interface SpeakOptions {
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

interface SequenceOptions {
  onItemStart?: (idx: number) => void;
  onEnd?: () => void;
}

export function useTTS() {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [rate, setRate] = useState(0.95); // slightly slower for advisory content
  const [pitch, setPitch] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);

  // Refs for stable callbacks inside the speak() closure
  const rateRef = useRef(rate);
  const pitchRef = useRef(pitch);
  const voiceURIRef = useRef(selectedVoiceURI);

  useEffect(() => { rateRef.current = rate; }, [rate]);
  useEffect(() => { pitchRef.current = pitch; }, [pitch]);
  useEffect(() => { voiceURIRef.current = selectedVoiceURI; }, [selectedVoiceURI]);

  // ── Detect support + load voices ──
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        const mapped: TTSVoice[] = v.map(voice => ({
          voiceURI: voice.voiceURI,
          name: voice.name,
          lang: voice.lang,
          localService: voice.localService,
          isDefault: voice.default,
        }));
        setVoices(mapped);
        // Auto-select en-US default voice, fallback to en-*, fallback to first available
        if (!voiceURIRef.current) {
          const enUS = mapped.find(v => v.lang === "en-US" && v.isDefault)
            || mapped.find(v => v.lang === "en-US")
            || mapped.find(v => v.lang.startsWith("en"));
          if (enUS) setSelectedVoiceURI(enUS.voiceURI);
        }
      }
    };

    loadVoices();
    // Some browsers (Chrome) load voices asynchronously — wait for the event
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // ── speak(): single utterance ──
  const speak = useCallback((text: string, opts?: SpeakOptions) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rateRef.current;
    utterance.pitch = pitchRef.current;
    utterance.lang = "en-US";

    if (voiceURIRef.current) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === voiceURIRef.current);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentText(text);
      opts?.onStart?.();
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText(null);
      opts?.onEnd?.();
    };
    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);
    utterance.onerror = (e) => {
      // Don't treat "interrupted" or "canceled" as errors (those happen on stop)
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.warn("TTS error:", e.error);
      }
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText(null);
    };
    if (opts?.onBoundary) {
      utterance.onboundary = (event) => opts.onBoundary!(event.charIndex);
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  // ── speakSequence(): play multiple texts in order ──
  // Used for the 4-section Voice Agent dialogue (Empathy → Explanation → Action → Prevention)
  const speakSequence = useCallback((texts: string[], opts?: SequenceOptions) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (texts.length === 0) return;
    window.speechSynthesis.cancel();
    let idx = 0;
    const speakNext = () => {
      if (idx >= texts.length) {
        setIsSpeaking(false);
        setCurrentText(null);
        opts?.onEnd?.();
        return;
      }
      const text = texts[idx];
      opts?.onItemStart?.(idx);
      speak(text, { onEnd: () => { idx++; speakNext(); } });
    };
    speakNext();
     
  }, [speak]);

  const pause = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText(null);
    }
  }, []);

  return {
    supported,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    rate, setRate,
    pitch, setPitch,
    isSpeaking,
    isPaused,
    currentText,
    speak,
    speakSequence,
    pause,
    resume,
    stop,
  };
}
