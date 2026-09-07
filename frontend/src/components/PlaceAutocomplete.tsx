"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { forwardGeocode, PlaceResult } from "@/lib/geo";

/**
 * Free-text address/place search box with debounced Nominatim autocomplete.
 * Shared between the map page's top search bar and the Directions page's
 * origin/destination pickers. Purely a text-in, selection-out component —
 * callers decide what happens when a suggestion is picked (pan the map,
 * set a coordinate, etc).
 */
export default function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search for a place or address...",
  className = "",
  inputClassName = "",
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const q = value.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const places = await forwardGeocode(q, controller.signal);
        setResults(places);
        setSearched(true);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setResults([]);
          setSearched(true);
        }
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    }, 380);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Close the suggestion dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const showDropdown = open && value.trim().length >= 3;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={inputClassName || "w-full pl-9 pr-8 py-2 bg-surface-hover text-foreground placeholder:text-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"}
      />
      {loading && (
        <Loader2 className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[1300] bg-surface-raised rounded-xl shadow-lg border border-border max-h-64 overflow-y-auto animate-fade-in">
          {loading && results.length === 0 && (
            <p className="px-3.5 py-3 text-xs text-muted">Searching...</p>
          )}
          {!loading && searched && results.length === 0 && (
            <p className="px-3.5 py-3 text-xs text-muted">No results found.</p>
          )}
          {results.map((place, i) => (
            <button
              key={`${place.lat}-${place.lng}-${i}`}
              type="button"
              onClick={() => {
                onSelect(place);
                setOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 flex items-start gap-2 hover:bg-surface-hover active:bg-surface-hover border-b border-border last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-muted-strong leading-snug">{place.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
