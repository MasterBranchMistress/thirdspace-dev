// app/(authenticated)/feed/page.tsx
"use client";

import { useBrowserLocation } from "@/utils/geolocation/get-user-location/getUserLocation";
import { useEffect, useState } from "react";

type Reverse = {
  lat: number;
  lng: number;
  place?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  postal?: string | null;
};

export default async function UserLocation() {
  const loc = await useBrowserLocation({
    enableHighAccuracy: true,
    timeoutMs: 8000,
  });
  const [rev, setRev] = useState<Reverse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const go = async () => {
      if (loc.status !== "success") return;
      try {
        const res = await fetch(
          `/api/reverse-geocode?lat=${loc.coords.lat}&lng=${loc.coords.lng}`
        );
        const data = await res.json();
        console.log(data);
        if (!res.ok) throw new Error(data?.error || "Reverse failed");
        setRev(data);
      } catch (e: any) {
        setErr(e?.message || "Failed reverse geocoding");
      }
    };
    go();
  }, [loc.status]);

  return (
    <div className="p-4">
      {loc.status === "locating" && <p>Finding your location…</p>}
      {loc.status === "error" && (
        <p className="text-red-500">Location error: {loc.error}</p>
      )}

      {rev && (
        <div className="text-sm z-30">
          <div>
            <b>Approx. location:</b>{" "}
            {rev.place || [rev.city, rev.region].filter(Boolean).join(", ")}
          </div>
          <div className="text-xs opacity-70">
            {rev.lat.toFixed(5)}, {rev.lng.toFixed(5)}
          </div>
        </div>
      )}

      {err && <p className="text-red-500 mt-2">{err}</p>}
    </div>
  );
}
