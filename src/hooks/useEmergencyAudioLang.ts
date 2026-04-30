import { useEffect, useState } from "react";

export type EmergencyAudioLang = "english" | "pidgin";

const STORAGE_KEY = "veridia.emergencyAudioLang";

const read = (): EmergencyAudioLang => {
  if (typeof window === "undefined") return "english";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "pidgin" ? "pidgin" : "english";
};

/**
 * User preference for which language the emergency audio warning starts in.
 * The loop still alternates English <-> Pidgin so caregivers who speak either
 * one will catch the message; this just controls which they hear first.
 */
export const useEmergencyAudioLang = () => {
  const [lang, setLangState] = useState<EmergencyAudioLang>(read);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLangState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = (next: EmergencyAudioLang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* no-op */
    }
  };

  return { lang, setLang };
};

export const getEmergencyAudioLang = read;
