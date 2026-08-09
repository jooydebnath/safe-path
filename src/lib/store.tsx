"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  roads as seedRoads,
  reports as seedReports,
  surveys as seedSurveys,
  users as seedUsers,
  Road,
  Report,
  Survey,
  User,
} from "./data";

interface StoreContextValue {
  roads: Road[];
  reports: Report[];
  surveys: Survey[];
  users: User[];
  addReport: (r: Omit<Report, "id" | "timestamp" | "status" | "verification">) => void;
  verifyReport: (reportId: string, verification: "safe" | "unsafe") => void;
  objectReport: (reportId: string, reason: string) => void;
  addSurvey: (s: Omit<Survey, "id" | "timestamp" | "status">) => void;
  verifySurvey: (surveyId: string, adminNotes: string, approved: boolean) => void;
  updateRoadStatus: (roadId: string, status: Road["status"], verifiedByAdmin?: boolean) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const STORAGE_KEY = "safepath_store_v1";

interface PersistedState {
  roads: Road[];
  reports: Report[];
  surveys: Survey[];
  users: User[];
}

function loadState(): PersistedState {
  if (typeof window === "undefined") {
    return { roads: seedRoads, reports: seedReports, surveys: seedSurveys, users: seedUsers };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        roads: parsed.roads ?? seedRoads,
        reports: parsed.reports ?? seedReports,
        surveys: parsed.surveys ?? seedSurveys,
        users: parsed.users ?? seedUsers,
      };
    }
  } catch {}
  return { roads: seedRoads, reports: seedReports, surveys: seedSurveys, users: seedUsers };
}

const genId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => ({
    roads: seedRoads,
    reports: seedReports,
    surveys: seedSurveys,
    users: seedUsers,
  }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const addReport: StoreContextValue["addReport"] = (r) => {
    setState((s) => ({
      ...s,
      reports: [
        {
          ...r,
          id: genId("rep"),
          timestamp: new Date().toISOString(),
          status: "pending",
          verification: "pending",
        },
        ...s.reports,
      ],
    }));
  };

  const verifyReport: StoreContextValue["verifyReport"] = (reportId, verification) => {
    setState((s) => ({
      ...s,
      reports: s.reports.map((r) =>
        r.id === reportId
          ? { ...r, verification, status: "verified" }
          : r
      ),
    }));
  };

  const objectReport: StoreContextValue["objectReport"] = (reportId, reason) => {
    setState((s) => ({
      ...s,
      reports: s.reports.map((r) =>
        r.id === reportId
          ? { ...r, verification: "objected", objectionReason: reason, status: "verified" }
          : r
      ),
    }));
  };

  const addSurvey: StoreContextValue["addSurvey"] = (sv) => {
    setState((s) => ({
      ...s,
      surveys: [
        {
          ...sv,
          id: genId("sv"),
          timestamp: new Date().toISOString(),
          status: "pending",
        },
        ...s.surveys,
      ],
    }));
  };

  const verifySurvey: StoreContextValue["verifySurvey"] = (surveyId, adminNotes, approved) => {
    setState((s) => ({
      ...s,
      surveys: s.surveys.map((sv) =>
        sv.id === surveyId
          ? {
              ...sv,
              status: approved ? "verified" : "rejected",
              adminNotes,
            }
          : sv
      ),
      // When a survey is approved, also update the road status to match the vote
      ...(approved
        ? {
            roads: s.roads.map((r) => {
              const survey = s.surveys.find((x) => x.id === surveyId);
              if (survey && r.id === survey.roadId) {
                return {
                  ...r,
                  status: survey.safetyVote === "safe" ? "safe" : "unsafe",
                  verifiedByAdmin: true,
                };
              }
              return r;
            }),
          }
        : {}),
    }));
  };

  const updateRoadStatus: StoreContextValue["updateRoadStatus"] = (roadId, status, verifiedByAdmin = true) => {
    setState((s) => ({
      ...s,
      roads: s.roads.map((r) =>
        r.id === roadId ? { ...r, status, verifiedByAdmin } : r
      ),
    }));
  };

  const resetAll = () => {
    setState({ roads: seedRoads, reports: seedReports, surveys: seedSurveys, users: seedUsers });
  };

  return (
    <StoreContext.Provider
      value={{
        ...state,
        addReport,
        verifyReport,
        objectReport,
        addSurvey,
        verifySurvey,
        updateRoadStatus,
        resetAll,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
