"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Road, Report, Review, Survey, SosAlert, User, RouteSafetyResult } from "./data";
import { api } from "./api";

interface StoreContextValue {
  roads: Road[];
  reports: Report[];
  surveys: Survey[];
  reviews: Review[];
  users: User[];
  sosAlerts: SosAlert[];
  areas: string[];
  loading: boolean;
  addReport: (r: Omit<Report, "id" | "timestamp" | "status" | "verification">) => Promise<void>;
  verifyReport: (reportId: string, verification: "safe" | "unsafe") => Promise<void>;
  objectReport: (reportId: string, reason: string) => Promise<void>;
  addSurvey: (s: Omit<Survey, "id" | "timestamp" | "status">) => Promise<void>;
  verifySurvey: (surveyId: string, adminNotes: string, approved: boolean) => Promise<void>;
  addReview: (rv: { roadId: string; rating: number; comment: string }) => Promise<void>;
  verifyReview: (reviewId: string, approved: boolean) => Promise<void>;
  updateRoadStatus: (roadId: string, status: Road["status"], verifiedByAdmin?: boolean) => Promise<void>;
  addRoad: (r: { name: string; area: string; lat: number; lng: number; status?: Road["status"] }) => Promise<void>;
  sendSosAlert: (lat: number | null, lng: number | null) => Promise<SosAlert>;
  checkRouteSafety: (origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) => Promise<RouteSafetyResult>;
  resolveSosAlert: (alertId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  suspendUser: (userId: string, suspend: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  refreshSosAlerts: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [roads, setRoads] = useState<Road[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCore = useCallback(async () => {
    const [roadsData, reportsData, surveysData, reviewsData] = await Promise.all([
      api.get<Road[]>("/roads"),
      api.get<Report[]>("/reports"),
      api.get<Survey[]>("/surveys"),
      api.get<Review[]>("/reviews"),
    ]);
    setRoads(roadsData);
    setReports(reportsData);
    setSurveys(surveysData);
    setReviews(reviewsData);
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const usersData = await api.get<User[]>("/users");
      setUsers(usersData);
    } catch {
      // Not authenticated as admin yet — leave users empty.
    }
  }, []);

  const suspendUser: StoreContextValue["suspendUser"] = async (userId, suspend) => {
    const updated = await api.patch<User>(`/users/${userId}`, { isActive: !suspend });
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
  };

  const deleteUser: StoreContextValue["deleteUser"] = async (userId) => {
    await api.delete(`/users/${userId}`);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const refreshSosAlerts = useCallback(async () => {
    try {
      const alertsData = await api.get<SosAlert[]>("/sos");
      setSosAlerts(alertsData);
    } catch {
      // Not authenticated as admin yet — leave sosAlerts empty.
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await fetchCore();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchCore]);

  const areas = Array.from(new Set(roads.map((r) => r.area))).sort();

  const addReport: StoreContextValue["addReport"] = async (r) => {
    const created = await api.post<Report>("/reports", r);
    setReports((prev) => [created, ...prev]);
  };

  const verifyReport: StoreContextValue["verifyReport"] = async (reportId, verification) => {
    const updated = await api.post<Report>(`/reports/${reportId}/verify`, { verification });
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
  };

  const objectReport: StoreContextValue["objectReport"] = async (reportId, reason) => {
    const updated = await api.post<Report>(`/reports/${reportId}/object`, { reason });
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
  };

  const addSurvey: StoreContextValue["addSurvey"] = async (sv) => {
    const created = await api.post<Survey>("/surveys", sv);
    setSurveys((prev) => [created, ...prev]);
  };

  const verifySurvey: StoreContextValue["verifySurvey"] = async (surveyId, adminNotes, approved) => {
    const updated = await api.post<Survey>(`/surveys/${surveyId}/verify`, { approved, adminNotes });
    setSurveys((prev) => prev.map((sv) => (sv.id === surveyId ? updated : sv)));
    if (approved) {
      setRoads((prev) =>
        prev.map((r) =>
          r.id === updated.roadId
            ? { ...r, status: updated.safetyVote === "safe" ? "safe" : "unsafe", verifiedByAdmin: true }
            : r
        )
      );
    }
  };

  const addReview: StoreContextValue["addReview"] = async (rv) => {
    const created = await api.post<Review>("/reviews", rv);
    setReviews((prev) => [created, ...prev]);
  };

  const verifyReview: StoreContextValue["verifyReview"] = async (reviewId, approved) => {
    const updated = await api.post<Review>(`/reviews/${reviewId}/verify`, { approved });
    setReviews((prev) => prev.map((rv) => (rv.id === reviewId ? updated : rv)));
    // Road rating/reviews count is recomputed server-side; re-sync the road.
    const road = await api.get<Road>(`/roads/${updated.roadId}`);
    setRoads((prev) => prev.map((r) => (r.id === road.id ? road : r)));
  };

  const updateRoadStatus: StoreContextValue["updateRoadStatus"] = async (roadId, status, verifiedByAdmin = true) => {
    const updated = await api.patch<Road>(`/roads/${roadId}`, { status, verifiedByAdmin });
    setRoads((prev) => prev.map((r) => (r.id === roadId ? updated : r)));
  };

  const addRoad: StoreContextValue["addRoad"] = async (r) => {
    const created = await api.post<Road>("/roads", {
      name: r.name,
      area: r.area,
      lat: r.lat,
      lng: r.lng,
      status: r.status ?? "safe",
      rating: 0,
      reviews: 0,
    });
    setRoads((prev) => [...prev, created]);
  };

  const sendSosAlert: StoreContextValue["sendSosAlert"] = async (lat, lng) => {
    return api.post<SosAlert>("/sos", { lat, lng });
  };

  const checkRouteSafety: StoreContextValue["checkRouteSafety"] = async (origin, dest) => {
    return api.post<RouteSafetyResult>("/routes/safety", {
      originLat: origin.lat,
      originLng: origin.lng,
      destLat: dest.lat,
      destLng: dest.lng,
    });
  };

  const resolveSosAlert: StoreContextValue["resolveSosAlert"] = async (alertId) => {
    const updated = await api.post<SosAlert>(`/sos/${alertId}/resolve`, {});
    setSosAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
  };

  const resetAll = async () => {
    await fetchCore();
  };

  return (
    <StoreContext.Provider
      value={{
        roads,
        reports,
        surveys,
        reviews,
        users,
        sosAlerts,
        areas,
        loading,
        addReport,
        verifyReport,
        objectReport,
        addSurvey,
        verifySurvey,
        addReview,
        verifyReview,
        updateRoadStatus,
        addRoad,
        sendSosAlert,
        checkRouteSafety,
        resolveSosAlert,
        refreshUsers,
        suspendUser,
        deleteUser,
        refreshSosAlerts,
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
