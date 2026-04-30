import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight wrapper around the Web Speech API (SpeechSynthesis).
 *
 * - Free & on-device: no API key, no network round-trip.
 * - Picks a voice matching the requested BCP-47 locale when available.
 * - Survives tab switches: cancels playback on unmount so audio doesn't
 *   keep narrating an old screen after the user navigates away.
 *
 * Pidgin: browsers don't ship a Pidgin voice, so we fall back to the
 * device's English voice — reading Pidgin text in an English voice still
 * works as audio because the spelling is largely phonetic.
 */
export type SpeechStatus = "idle" | "playing" | "paused";

interface UseSpeechResult {
  status: SpeechStatus;
  supported: boolean;
  rate: number;
  setRate: (rate: number) => void;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const pickVoice = (locale: string): SpeechSynthesisVoice | null => {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const lower = locale.toLowerCase();
  // Exact locale match first, then language-only match (e.g. "en"), then default.
  return (
    voices.find((v) => v.lang.toLowerCase() === lower) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(lower.split("-")[0])) ||
    voices.find((v) => v.default) ||
    voices[0] ||
    null
  );
};

export const useSpeech = (locale: string = "en-US"): UseSpeechResult => {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [rate, setRate] = useState<number>(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Some browsers populate voices asynchronously; trigger a re-render
  // when the voices list becomes available so pickVoice() finds them.
  const [, setVoicesReady] = useState(0);
  useEffect(() => {
    if (!supported) return;
    const onVoices = () => setVoicesReady((n) => n + 1);
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    // Trigger initial population on some browsers.
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setStatus("idle");
  }, [supported]);

  // Cancel narration if the consuming component unmounts (tab switch, etc.)
  useEffect(() => () => stop(), [stop]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel();

      const utt = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(locale);
      if (voice) utt.voice = voice;
      utt.lang = voice?.lang || locale;
      utt.rate = rate;
      utt.pitch = 1;
      utt.onend = () => setStatus("idle");
      utt.onerror = () => setStatus("idle");
      utteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
      setStatus("playing");
    },
    [supported, locale, rate],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus("playing");
  }, [supported]);

  return { status, supported, rate, setRate, speak, pause, resume, stop };
};
