import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useDependants, type Dependant } from "@/hooks/useDependants";

const STORAGE_KEY = "veridia.activeProfileId";

export type ActiveProfile = {
  id: string | null;          // null = self (caregiver)
  name: string;
  relationship: string;       // "self" | dependant.relationship
  age: number | null;
  sex: "male" | "female" | null;
  isSelf: boolean;
  dependant?: Dependant;
};

type Ctx = {
  activeProfileId: string | null;
  activeProfile: ActiveProfile;
  isSelf: boolean;
  setActiveProfileId: (id: string | null) => void;
};

const ActiveProfileContext = createContext<Ctx | undefined>(undefined);

export const ActiveProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  const { dependants } = useDependants();

  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && stored !== "null" ? stored : null;
  });

  // If the active dependant is removed (or user changes), fall back to self
  useEffect(() => {
    if (!activeProfileId) return;
    if (dependants.length === 0) return; // hook may still be loading
    const stillExists = dependants.some((d) => d.id === activeProfileId);
    if (!stillExists) {
      setActiveProfileIdState(null);
      window.localStorage.setItem(STORAGE_KEY, "null");
    }
  }, [activeProfileId, dependants]);

  // Reset on user change
  useEffect(() => {
    if (!user) {
      setActiveProfileIdState(null);
    }
  }, [user]);

  const setActiveProfileId = useCallback((id: string | null) => {
    setActiveProfileIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id ?? "null");
    }
  }, []);

  const activeProfile: ActiveProfile = useMemo(() => {
    if (!activeProfileId) {
      return {
        id: null,
        name: profile?.full_name || "You",
        relationship: "self",
        age: profile?.age ?? null,
        sex: profile?.sex ?? null,
        isSelf: true,
      };
    }
    const dep = dependants.find((d) => d.id === activeProfileId);
    if (!dep) {
      return {
        id: null,
        name: profile?.full_name || "You",
        relationship: "self",
        age: profile?.age ?? null,
        sex: profile?.sex ?? null,
        isSelf: true,
      };
    }
    return {
      id: dep.id,
      name: dep.full_name,
      relationship: dep.relationship,
      age: dep.age,
      sex: dep.sex,
      isSelf: false,
      dependant: dep,
    };
  }, [activeProfileId, dependants, profile]);

  return (
    <ActiveProfileContext.Provider
      value={{
        activeProfileId,
        activeProfile,
        isSelf: activeProfile.isSelf,
        setActiveProfileId,
      }}
    >
      {children}
    </ActiveProfileContext.Provider>
  );
};

export const useActiveProfile = () => {
  const ctx = useContext(ActiveProfileContext);
  if (!ctx) throw new Error("useActiveProfile must be used within ActiveProfileProvider");
  return ctx;
};

export const initialsOf = (name?: string | null) =>
  (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export const REL_LABELS: Record<string, string> = {
  self: "You",
  child: "Child",
  parent: "Parent",
  spouse: "Spouse",
  patient: "Patient",
  sibling: "Sibling",
  other: "Other",
};
