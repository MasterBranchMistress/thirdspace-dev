"use client";

import { useEffect, useRef, useState } from "react";

type GeoState = {
  status: "idle" | "locating" | "success" | "error";
  coords: { lat: number; lng: number; accuracy: number | null };
  placeName?: string;
  error?: string;
};

export function useBrowserLocation(options?: {
  enableHighAccuracy?: boolean;
  timeoutMs?: number;
  maximumAgeMs?: number;
}): GeoState {
  const [state, setState] = useState<GeoState>({
    status: "idle",
    coords: { lat: 0, lng: 0, accuracy: null },
  });
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    if (!("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Geolocation not supported",
      }));
      return;
    }

    setState((prev) => ({ ...prev, status: "locating" }));

    const {
      enableHighAccuracy = true,
      timeoutMs = 10_000,
      maximumAgeMs = 0,
    } = options ?? {};

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(`/api/reverse-geocode`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
          });

          let placeName;
          if (res.ok) {
            const data = await res.json();
            placeName = data?.place || data?.place_name || null;
          }

          setState({
            status: "success",
            coords: {
              lat,
              lng,
              accuracy: pos.coords.accuracy,
            },
            placeName: placeName ?? undefined,
          });
        } catch (err: any) {
          setState({
            status: "success",
            coords: {
              lat,
              lng,
              accuracy: pos.coords.accuracy,
            },
            error: "Reverse geocode failed",
          });
        }
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err.message || "Location failed",
        }));
      },
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge: maximumAgeMs,
      }
    );
  }, [options?.enableHighAccuracy, options?.maximumAgeMs, options?.timeoutMs]);

  return state;
}
