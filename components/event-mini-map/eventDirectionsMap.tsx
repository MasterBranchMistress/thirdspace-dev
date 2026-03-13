"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type EventDirectionsMapProps = {
  eventLat: number;
  eventLng: number;
  userLat?: number;
  userLng?: number;
  onRouteInfoChange?: (info: {
    distanceMiles?: number;
    durationMinutes?: number;
  }) => void;
};

type DirectionsResponse = {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: GeoJSON.LineString;
  }>;
};

export default function EventDirectionsMap({
  eventLat,
  eventLng,
  userLat,
  userLng,
  onRouteInfoChange,
}: EventDirectionsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const hasUserLocation =
      typeof userLat === "number" && typeof userLng === "number";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      center: [eventLng, eventLat],
      zoom: hasUserLocation ? 11 : 13,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    new mapboxgl.Marker({ color: "#2E6F40" })
      .setLngLat([eventLng, eventLat])
      .addTo(map);

    if (hasUserLocation) {
      new mapboxgl.Marker({ color: "#950606" })
        .setLngLat([userLng!, userLat!])
        .addTo(map);
    }

    map.on("load", async () => {
      if (!hasUserLocation) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([eventLng, eventLat]);
        map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 800 });
        return;
      }

      try {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${userLng},${userLat};${eventLng},${eventLat}` +
          `?alternatives=false` +
          `&geometries=geojson` +
          `&overview=full` +
          `&steps=false` +
          `&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch directions");
        }

        const data: DirectionsResponse = await res.json();
        const route = data.routes?.[0];

        if (!route?.geometry) return;

        const routeGeoJson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        };

        map.addSource("route", {
          type: "geojson",
          data: routeGeoJson,
        });

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#5c6cc4",
            "line-width": 5,
            "line-opacity": 0.9,
          },
        });

        const bounds = new mapboxgl.LngLatBounds();
        route.geometry.coordinates.forEach(([lng, lat]) => {
          bounds.extend([lng, lat]);
        });

        map.fitBounds(bounds, {
          padding: {
            top: 100,
            bottom: 180,
            left: 50,
            right: 50,
          },
          duration: 900,
          maxZoom: 14,
        });

        onRouteInfoChange?.({
          distanceMiles: route.distance / 1609.344,
          durationMinutes: Math.round(route.duration / 60),
        });
      } catch (error) {
        console.error("Directions fetch failed:", error);

        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([userLng!, userLat!]);
        bounds.extend([eventLng, eventLat]);

        map.fitBounds(bounds, {
          padding: {
            top: 100,
            bottom: 180,
            left: 50,
            right: 50,
          },
          duration: 900,
          maxZoom: 14,
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [eventLat, eventLng, userLat, userLng, onRouteInfoChange]);

  return <div ref={containerRef} className="h-full w-full" />;
}
