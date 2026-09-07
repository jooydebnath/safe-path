"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed, ShieldAlert } from "lucide-react";

const POLL_MS = 5000;

/**
 * Hard-blocks the rest of the app until geolocation is granted — no
 * dismiss, no "continue without it". Renders a modal-style screen instead
 * of the app:
 *  - If the browser hasn't decided yet ("prompt"), the "Allow Location"
 *    button calls getCurrentPosition, which immediately shows the browser's
 *    real Allow/Block dialog — clicking Allow there grants it and unlocks
 *    the app automatically.
 *  - If it's already denied, no button anywhere (ours or otherwise) can
 *    re-summon that native dialog — that's a hard browser security rule,
 *    not something any website's code can work around. So this state shows
 *    step-by-step settings instructions instead, and keeps polling
 *    permissions.query() in the background so the app unlocks itself the
 *    moment the user flips it on.
 */
export default function LocationGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"unknown" | "granted" | "prompt" | "denied">("unknown");
  const [requesting, setRequesting] = useState(false);
  // TIMEOUT / POSITION_UNAVAILABLE (no GPS fix yet, indoors, OS-level
  // Location Services off, etc.) is neither "granted" nor "denied" — the
  // user *did* grant the browser permission, the device just can't produce
  // a fix. Surfaced separately so the screen doesn't silently do nothing
  // and look broken; auto-retry (below) keeps trying regardless.
  const [fixError, setFixError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlight = useRef(false);

  const attemptPrompt = (showSpinner = false) => {
    if (!("geolocation" in navigator)) {
      setState("denied");
      return;
    }
    if (inFlight.current) return; // avoid piling up overlapping requests from the poll
    inFlight.current = true;
    if (showSpinner) setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        inFlight.current = false;
        setRequesting(false);
        setFixError(null);
        setState("granted");
      },
      (err) => {
        inFlight.current = false;
        setRequesting(false);
        // The Permissions API can say "prompt" while the actual call still
        // comes back PERMISSION_DENIED — e.g. inside an iframe/preview
        // without geolocation delegated, or an insecure context. Trust
        // this real result over the (possibly stale/wrong) query() state.
        if (err.code === err.PERMISSION_DENIED) {
          setFixError(null);
          setState("denied");
          return;
        }
        // Permission was granted (or never denied) but no fix came back —
        // most common on iOS, where there's no permissions.query() signal
        // to fall back on. Keep polling (unchanged) but say why nothing's
        // happening instead of leaving the button looking inert.
        setFixError(
          err.code === err.TIMEOUT
            ? "Couldn't get a GPS fix in time. Retrying automatically — make sure Location Services is turned on for this browser."
            : "Location is unavailable right now. Retrying automatically — make sure Location Services is turned on for this browser."
        );
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      // Geolocation is refused outright on non-HTTPS origins — no prompt
      // will ever appear, in any browser, no matter what we do here.
      setState("denied");
      return;
    }

    let cancelled = false;
    let usedFallback = false;
    let permStatus: PermissionStatus | null = null;

    const fallback = () => {
      // No (working) Permissions API — we can't distinguish "prompt" vs
      // "denied" up front, so just try; the real getCurrentPosition result
      // (handled in attemptPrompt) sets the correct state either way.
      if (cancelled || usedFallback) return;
      usedFallback = true;
      clearTimeout(unknownTimer);
      setState((s) => (s === "unknown" ? "prompt" : s));
      attemptPrompt();
      pollTimer.current = setInterval(() => attemptPrompt(), POLL_MS);
    };

    // Safety net: some in-app/embedded browsers (Facebook/Instagram/
    // Messenger webviews, sandboxed iframes) expose navigator.permissions,
    // but its query() promise just hangs — never resolves, never rejects.
    // Every other exit from this effect already falls back to the manual
    // getCurrentPosition loop; without this, that one case is the only way
    // to get stuck on "unknown" (the blocking "Checking..." spinner)
    // forever with no way out.
    const unknownTimer = setTimeout(fallback, 4000);

    if (!("permissions" in navigator)) {
      fallback();
      return () => {
        clearTimeout(unknownTimer);
        if (pollTimer.current) clearInterval(pollTimer.current);
      };
    }

    // Safari (all iPhones) doesn't support querying the "geolocation"
    // permission name and throws *synchronously* rather than rejecting a
    // promise — so this whole call needs a try/catch, not just `.catch()`,
    // or the effect blows up silently and the gate never resolves on iOS.
    let queryPromise: Promise<PermissionStatus> | null = null;
    try {
      queryPromise = navigator.permissions.query({ name: "geolocation" as PermissionName });
    } catch {
      fallback();
      return () => {
        clearTimeout(unknownTimer);
        if (pollTimer.current) clearInterval(pollTimer.current);
      };
    }

    queryPromise
      .then((result) => {
        // If the promise resolves late (after the safety net already took
        // over via fallback()), don't start a second, competing poll loop.
        if (cancelled || usedFallback) return;
        clearTimeout(unknownTimer);
        permStatus = result;
        const sync = () => setState(result.state as "granted" | "prompt" | "denied");
        sync();
        result.onchange = sync;

        pollTimer.current = setInterval(() => {
          if (result.state === "granted") return;
          if (result.state === "prompt") attemptPrompt();
          // "denied": nothing to call — the instructions below do the job instead.
        }, POLL_MS);
      })
      .catch(() => {
        // query() itself can reject in some browsers/embeds — don't get
        // stuck on "unknown" (which blocks with a spinner) forever.
        if (!cancelled) fallback();
      });

    return () => {
      cancelled = true;
      clearTimeout(unknownTimer);
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (permStatus) permStatus.onchange = null;
    };
  }, []);

  if (state === "granted") {
    return <>{children}</>;
  }

  if (state === "unknown") {
    return (
      <div className="mobile-container bg-background min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <MapPin className="w-6 h-6 animate-pulse" />
          <span className="text-sm">Checking location access...</span>
        </div>
      </div>
    );
  }

  const denied = state === "denied";

  return (
    <div className="mobile-container bg-background min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] sp-card sp-glow shadow-xl p-6 text-center animate-fade-in">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${denied ? "bg-danger-soft" : "bg-primary-soft"}`}>
          {denied ? <ShieldAlert className="w-8 h-8 text-danger" /> : <MapPin className="w-8 h-8 text-primary" />}
        </div>

        {denied ? (
          <>
            <h2 className="text-lg font-bold text-foreground mb-2">Location Is Blocked</h2>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              SafePath requires location access to use the app — it's needed to show you on the map, find nearby
              safe/unsafe roads, and send accurate SOS alerts. Your browser has it blocked; only your browser's own
              settings can undo that:
            </p>
            <ol className="text-left text-xs text-muted-strong bg-surface rounded-xl p-3.5 mb-5 space-y-1.5 list-decimal list-inside border border-border">
              <li>Tap the 🔒 lock icon (or "aA") next to the address bar</li>
              <li>Open "Permissions" or "Website Settings"</li>
              <li>Set Location to "Allow"</li>
              <li>Come back here — the app unlocks on its own</li>
            </ol>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-foreground mb-2">Enable Location Access</h2>
            <p className="text-sm text-muted mb-5 leading-relaxed">
              SafePath needs your exact location to use the app — it's required to show you on the map, find nearby
              safe/unsafe roads, and send accurate SOS alerts. Tap Allow below, then Allow again in your browser's
              prompt.
            </p>
          </>
        )}

        {fixError && !denied && (
          <p className="text-xs text-warning bg-warning-soft border border-border rounded-xl p-3 mb-5 text-left leading-relaxed">
            {fixError}
          </p>
        )}

        <button
          onClick={() => attemptPrompt(true)}
          disabled={requesting}
          className="w-full sp-gradient-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-[0_8px_24px_var(--primary-glow)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <LocateFixed className={`w-4 h-4 ${requesting ? "animate-pulse" : ""}`} />
          {requesting ? "Checking..." : denied ? "I've enabled it — check again" : "Allow Location Access"}
        </button>
      </div>
    </div>
  );
}
