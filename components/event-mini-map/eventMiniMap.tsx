// components/maps/EventMiniMap.tsx
"use client";

import Lottie from "lottie-react";
import point from "@/public/lottie/astro.json";
import "mapbox-gl/dist/mapbox-gl.css";
import { Map, NavigationControl, Marker } from "react-map-gl/mapbox";
import DirectionsModal from "./directionsModal";
import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

type Props = {
  user?: SessionUser;
  lat?: number;
  lng?: number;
  height?: number | string;
  zoom?: number;
  interactive?: boolean;
  eventTitle?: string;
  previewOpen?: boolean;
  onEventPage?: boolean;
};

export default function EventMiniMap({
  lat,
  lng,
  user,
  zoom = 15,
  eventTitle,
  previewOpen,
  onEventPage,
}: Props) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return (
    <div
      className={`w-full h-full ${onEventPage ? "mt-3" : ""} flex-col justify-center items-center overflow-hidden rounded-none border border-divider`}
      style={{
        height: previewOpen ? "100vh" : "25vh",
      }}
    >
      <Map
        interactive={previewOpen}
        reuseMaps
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ latitude: lat, longitude: lng, zoom }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={previewOpen}
        dragRotate={previewOpen}
        doubleClickZoom={previewOpen}
      >
        <NavigationControl position="top-left" showCompass={false} />
        {!previewOpen && (
          <div className="flex justify-center items-center">
            <Marker latitude={lat} longitude={lng} anchor="center">
              <Lottie
                animationData={point}
                loop
                autoplay
                style={{ height: "130px", width: "130px", marginTop: "-3rem" }}
              />
              <DirectionsModal
                eventLat={lat}
                eventLng={lng}
                eventTitle={eventTitle}
                userLat={user?.location?.lat}
                userLng={user?.location?.lng}
              />
            </Marker>
          </div>
        )}
      </Map>
    </div>
  );
}
