// components/maps/EventMiniMap.tsx
"use client";

import Lottie from "lottie-react";
import point from "@/public/lottie/point.json";
import "mapbox-gl/dist/mapbox-gl.css";
import { Map, NavigationControl, Marker } from "react-map-gl/mapbox";

type Props = {
  lat?: number;
  lng?: number;
  height?: number | string;
  zoom?: number;
  interactive?: boolean;
};

export default function EventMiniMap({
  lat,
  lng,
  height = 160,
  zoom = 12,
  interactive = false,
}: Props) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return (
    <div
      className="w-full overflow-hidden rounded-none border border-divider"
      style={{ height }}
    >
      <Map
        interactive
        reuseMaps
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ latitude: lat, longitude: lng, zoom }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
        dragRotate={false}
        doubleClickZoom={false}
      >
        <NavigationControl position="top-left" showCompass={false} />
        <Marker latitude={lat} longitude={lng} anchor="bottom">
          <Lottie
            animationData={point}
            loop
            autoplay
            style={{ height: "40px", width: "40px", marginBottom: "2rem" }}
          />
        </Marker>
      </Map>
    </div>
  );
}
